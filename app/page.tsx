import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo / İkon */}
        <div
          className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          🧠
        </div>

        <h1 className="text-4xl font-bold mb-3" style={{ color: '#3b0764' }}>
          Psikoloji AI
        </h1>
        <p className="text-lg mb-8" style={{ color: '#6d28d9' }}>
          Psikoloji asistanınız — öğrenciler, klinisyenler ve meraklılar için.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="flex-1 max-w-[160px] py-3 rounded-2xl text-white font-semibold shadow-md hover:opacity-90 transition text-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="flex-1 max-w-[160px] py-3 rounded-2xl font-semibold shadow-sm hover:bg-purple-50 transition text-center"
            style={{ border: '2px solid #7c3aed', color: '#7c3aed' }}
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  )
}
