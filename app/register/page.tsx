'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MODES = [
  { id: 'student', label: '🎓 Psikoloji Öğrencisiyim', desc: 'Akademik kaynak + web araştırması' },
  { id: 'clinician', label: '🏥 Klinisyen / Psikologum', desc: 'Teknik tanı kriterleri, sınırsız sorgu' },
  { id: 'general', label: '👤 Genel Kullanıcıyım', desc: 'Basit açıklamalar, günde 20 sorgu' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('general')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = signUpData.user?.id
    if (userId) {
      await supabase.from('profiles').update({ mode }).eq('id', userId)
    }

    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-indigo-900 mb-6">Kayıt Ol</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="password"
            placeholder="Şifre (min. 6 karakter)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
            minLength={6}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Ben bir...</p>
            {MODES.map(m => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  mode === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}
