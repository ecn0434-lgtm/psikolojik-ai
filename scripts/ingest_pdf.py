"""
DSM-5 PDF'ini ve diğer kaynakları Supabase'e aktarır.
Kurulum: pip install pypdf2 supabase requests python-dotenv
Çalıştırma: python scripts/ingest_pdf.py
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
print("Model yükleniyor (ilk seferinde ~130MB indirir)...")
from sentence_transformers import SentenceTransformer
_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("Model hazır.")

CHUNK_SIZE = 600   # kelime
OVERLAP    = 100   # kelime


def extract_pdf_text(pdf_path: str) -> list[dict]:
    """PDF'den sayfa sayfa metin çıkarır."""
    try:
        import PyPDF2
    except ImportError:
        print("PyPDF2 kurun: pip install PyPDF2")
        sys.exit(1)

    pages = []
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": i, "text": text})
    return pages


def chunk_text(text: str, source: str, page: int = None) -> list[dict]:
    """Metni örtüşen parçalara böler."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunk = " ".join(words[start:end])
        chunks.append({"content": chunk, "source": source, "page": page})
        start += CHUNK_SIZE - OVERLAP
    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Yerel model ile Türkçe destekli metin gömümleri oluşturur."""
    embeddings = _model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def insert_chunks(chunks: list[dict]):
    """Parçaları Supabase'e ekler."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    batch_size = 10
    total = len(chunks)
    inserted = 0

    for i in range(0, total, batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["content"] for c in batch]

        embeddings = embed_texts(texts)

        rows = [
            {
                "content": c["content"],
                "source":  c["source"],
                "page":    c.get("page"),
                "url":     c.get("url"),
                "embedding": emb,
            }
            for c, emb in zip(batch, embeddings)
        ]

        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/documents",
            headers=headers,
            json=rows,
        )
        resp.raise_for_status()
        inserted += len(rows)
        print(f"  {inserted}/{total} parça eklendi", end="\r")
        time.sleep(0.3)  # rate limit

    print(f"\n  Toplam {inserted} parça eklendi.")


def ingest_pdf(pdf_path: str, source_name: str):
    print(f"PDF okunuyor: {pdf_path}")
    pages = extract_pdf_text(pdf_path)
    print(f"  {len(pages)} sayfa bulundu")

    all_chunks = []
    for p in pages:
        all_chunks.extend(chunk_text(p["text"], source_name, p["page"]))
    print(f"  {len(all_chunks)} parçaya bölündü")

    insert_chunks(all_chunks)


def ingest_url(url: str, source_name: str):
    """Web sayfasından metin çeker ve ekler."""
    try:
        from urllib.request import urlopen
        from html.parser import HTMLParser

        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
                self._skip = False
            def handle_starttag(self, tag, attrs):
                if tag in ("script", "style", "nav", "footer"):
                    self._skip = True
            def handle_endtag(self, tag):
                if tag in ("script", "style", "nav", "footer"):
                    self._skip = False
            def handle_data(self, data):
                if not self._skip:
                    self.text.append(data)

        html = urlopen(url).read().decode("utf-8", errors="ignore")
        parser = TextExtractor()
        parser.feed(html)
        text = " ".join(parser.text)

        chunks = chunk_text(text, source_name)
        chunks = [dict(c, url=url) for c in chunks]
        print(f"  URL: {url} → {len(chunks)} parça")
        insert_chunks(chunks)
    except Exception as e:
        print(f"  URL hatası: {e}")


if __name__ == "__main__":
    # --- DSM-5 PDF ---
    dsm5_path = r"C:\Users\FUJITSU\Downloads\dsm-5-tan-ltleri-bavuru-elkitab-2013nbsped-9789753001984_compress.pdf"
    if Path(dsm5_path).exists():
        ingest_pdf(dsm5_path, "DSM-5")
    else:
        print(f"DSM-5 PDF bulunamadı: {dsm5_path}")

    # --- Ek web kaynakları ---
    web_sources = [
        ("https://www.who.int/classifications/classification-of-diseases", "ICD-11"),
        ("https://www.psychiatry.org/psychiatrists/diagnosis", "APA Tanı"),
    ]
    print("\nWeb kaynakları ekleniyor...")
    for url, name in web_sources:
        ingest_url(url, name)

    print("\nTamamlandı!")
