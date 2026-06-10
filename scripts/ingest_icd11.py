"""
ICD-11 Zihinsel Sağlık Bölümünü WHO API'den çeker ve Supabase'e ekler.
WHO ICD-11 API ücretsiz ve açık lisanslı.
Çalıştırma: python scripts/ingest_icd11.py
"""

import os
import sys
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ICD-11 API - ücretsiz, kayıt gerekmez (token alınıyor)
TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"
ICD_BASE  = "https://id.who.int/icd/release/11/2024-01/mms"

# Zihinsel ve davranışsal bozukluklar bölümü kodu
MENTAL_HEALTH_ROOT = "http://id.who.int/icd/release/11/2024-01/mms/334423054"

CHUNK_SIZE = 500
OVERLAP    = 80

print("Model yükleniyor...")
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("Model hazır.")


def get_icd_token() -> str:
    """WHO ICD-11 API için token alır (Client Credentials Flow)."""
    # Kayıtsız erişim için boş credentials deniyoruz
    # Gerçek kullanım için: https://icd.who.int/icdapi adresinden kayıt olun
    try:
        resp = requests.post(TOKEN_URL, data={
            "client_id": os.environ.get("ICD_CLIENT_ID", ""),
            "client_secret": os.environ.get("ICD_CLIENT_SECRET", ""),
            "scope": "icdapi_access",
            "grant_type": "client_credentials"
        }, timeout=10)
        if resp.ok:
            return resp.json().get("access_token", "")
    except Exception:
        pass
    return ""


def fetch_entity(uri: str, token: str = "") -> dict:
    """ICD-11 entity bilgisini çeker."""
    headers = {
        "Accept": "application/json",
        "API-Version": "v2",
        "Accept-Language": "en",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # URI'den path çıkar
    path = uri.replace("http://id.who.int/icd/release/11/2024-01/mms", "")
    url = f"{ICD_BASE}{path}" if path else ICD_BASE

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.ok:
            return resp.json()
    except Exception as e:
        print(f"  Hata: {e}")
    return {}


def extract_text(entity: dict) -> str:
    """Entity'den metin çıkarır."""
    parts = []

    title = entity.get("title", {})
    if isinstance(title, dict):
        parts.append(title.get("@value", ""))
    elif isinstance(title, str):
        parts.append(title)

    definition = entity.get("definition", {})
    if isinstance(definition, dict):
        parts.append(definition.get("@value", ""))

    inclusions = entity.get("inclusion", [])
    for inc in inclusions:
        if isinstance(inc, dict):
            label = inc.get("label", {})
            if isinstance(label, dict):
                parts.append(label.get("@value", ""))

    diagnostic = entity.get("diagnosticCriteria", {})
    if isinstance(diagnostic, dict):
        parts.append(diagnostic.get("@value", ""))

    additional = entity.get("additionalClinicalDetail", {})
    if isinstance(additional, dict):
        parts.append(additional.get("@value", ""))

    return "\n".join(p for p in parts if p).strip()


def chunk_text(text: str, source: str, url: str) -> list[dict]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk) > 50:
            chunks.append({"content": chunk, "source": source, "url": url})
        start += CHUNK_SIZE - OVERLAP
    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def insert_chunks(chunks: list[dict]):
    if not chunks:
        return
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    batch_size = 10
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]
        embeddings = embed_texts(texts)
        rows = [
            {"content": c["content"], "source": c["source"],
             "url": c.get("url"), "page": None, "embedding": emb}
            for c, emb in zip(batch, embeddings)
        ]
        resp = requests.post(f"{SUPABASE_URL}/rest/v1/documents", headers=headers, json=rows)
        if not resp.ok:
            print(f"  Ekleme hatası: {resp.text[:100]}")
        time.sleep(0.2)


def crawl_category(uri: str, token: str, depth: int = 0, max_depth: int = 2) -> list[dict]:
    if depth > max_depth:
        return []
    entity = fetch_entity(uri, token)
    if not entity:
        return []
    chunks = []
    text = extract_text(entity)
    title_val = entity.get("title", {})
    title = title_val.get("@value", "") if isinstance(title_val, dict) else str(title_val)
    if text:
        source = f"ICD-11: {title}" if title else "ICD-11"
        chunks.extend(chunk_text(text, source, uri))
        print(f"  {'  ' * depth}[{depth}] {title[:60]} ({len(text.split())} kelime)")
    for child_uri in entity.get("child", []):
        time.sleep(0.3)
        chunks.extend(crawl_category(child_uri, token, depth + 1, max_depth))
    return chunks


def scrape_icd11_web() -> list[dict]:
    """ICD-11 zihinsel sağlık sayfalarını web'den çeker."""
    from urllib.request import urlopen, Request
    from html.parser import HTMLParser

    class TextExtractor(HTMLParser):
        def __init__(self):
            super().__init__()
            self.text = []
            self._skip = False
            self._skip_tags = {"script", "style", "nav", "footer", "header"}
        def handle_starttag(self, tag, attrs):
            if tag in self._skip_tags:
                self._skip = True
        def handle_endtag(self, tag):
            if tag in self._skip_tags:
                self._skip = False
        def handle_data(self, data):
            if not self._skip and data.strip():
                self.text.append(data.strip())

    # ICD-11 zihinsel sağlık bölümü sayfaları
    pages = [
        ("https://icd.who.int/browse/2024-01/mms/en#334423054", "ICD-11: Zihinsel Bozukluklar Genel"),
        ("https://icd.who.int/browse/2024-01/mms/en#1683919430", "ICD-11: Nörogelişimsel Bozukluklar"),
        ("https://icd.who.int/browse/2024-01/mms/en#1563440232", "ICD-11: Şizofreni Spektrum Bozuklukları"),
        ("https://icd.who.int/browse/2024-01/mms/en#578635574",  "ICD-11: Bipolar Bozukluklar"),
        ("https://icd.who.int/browse/2024-01/mms/en#1563440232", "ICD-11: Depresif Bozukluklar"),
        ("https://icd.who.int/browse/2024-01/mms/en#1048413558", "ICD-11: Anksiyete Bozuklukları"),
        ("https://icd.who.int/browse/2024-01/mms/en#822985919",  "ICD-11: OKB Bozuklukları"),
        ("https://icd.who.int/browse/2024-01/mms/en#2070699808", "ICD-11: Travma ve Stres Bozuklukları"),
        ("https://icd.who.int/browse/2024-01/mms/en#1418260036", "ICD-11: Yeme Bozuklukları"),
        ("https://icd.who.int/browse/2024-01/mms/en#1580466198", "ICD-11: Kişilik Bozuklukları"),
    ]

    all_chunks = []
    headers_req = {"User-Agent": "Mozilla/5.0 (educational research bot)"}

    for url, source in pages:
        try:
            req = Request(url, headers=headers_req)
            html = urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
            parser = TextExtractor()
            parser.feed(html)
            text = " ".join(parser.text)

            if len(text.split()) > 50:
                chunks = chunk_text(text, source, url)
                all_chunks.extend(chunks)
                print(f"  OK {source} -> {len(chunks)} parca")
            else:
                print(f"  SKIP {source} -> icerik alinamadi")

            time.sleep(1)
        except Exception as e:
            print(f"  HATA {source}: {e}")

    return all_chunks


def main():
    print("ICD-11 token aliniyor...")
    token = get_icd_token()
    if token:
        print("  Token alindi! WHO API ile devam ediliyor.")
    else:
        print("  Token alinamadi.")
        sys.exit(1)

    print("\nICD-11 Zihinsel Saglik bolumu cekiliyor...")
    print("(Bu islem 5-15 dakika surebilir)\n")

    all_chunks = crawl_category(MENTAL_HEALTH_ROOT, token, max_depth=2)

    print(f"\nToplam {len(all_chunks)} parca olusturuldu.")
    if all_chunks:
        print("Supabase'e ekleniyor...")
        insert_chunks(all_chunks)
        print(f"Tamamlandi! {len(all_chunks)} ICD-11 parcasi eklendi.")
    else:
        print("Hic icerik alinamadi.")


if __name__ == "__main__":
    main()
