'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://psikoloji-ai.vercel.app/reset-password',
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-indigo-900 mb-2">Şifremi Unuttum</h1>

        {sent ? (
          <div className="text-center mt-4">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-gray-700 mb-2 font-medium">E-posta gönderildi!</p>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu kontrol edin.
            </p>
            <Link href="/login" className="text-indigo-600 font-medium hover:underline text-sm">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>

            <p className="text-sm text-center mt-4 text-gray-600">
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">Giriş sayfasına dön</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
