# Psikoloji AI — Kurulum Kılavuzu

## 1. Supabase Kurulumu
1. https://supabase.com adresinden ücretsiz hesap aç
2. Yeni proje oluştur
3. "SQL Editor"a git ve `supabase/schema.sql` içeriğini çalıştır
4. Settings > API > Project URL ve anon key'i kopyala

## 2. Voyage AI (Gömüm / Embedding)
1. https://www.voyageai.com adresinden ücretsiz API key al
2. (Aylık 50M token ücretsiz — DSM-5 için yeterli)

## 3. .env.local Dosyasını Doldur
```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VOYAGE_API_KEY=pa-...
```

## 4. PDF'i Vektör Veritabanına Aktar (Bir Kez)
```bash
pip install PyPDF2 supabase requests python-dotenv
python scripts/ingest_pdf.py
```
~ 10-20 dakika sürer (DSM-5 boyutuna göre)

## 5. Uygulamayı Çalıştır
```bash
npm run dev
```
Tarayıcıda: http://localhost:3000

## 6. İlk Admin Kullanıcısı
Kayıt olduktan sonra Supabase'de profiles tablosunda
plan = 'admin' olarak güncelle.
