import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-indigo-900 mb-4">Psikoloji AI</h1>
        <p className="text-lg text-indigo-700 mb-8">
          Psikoloji asistanınız. Öğrenciler, klinisyenler ve genel kullanıcılar için.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  )
}
