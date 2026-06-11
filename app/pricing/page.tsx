'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PsikoWorld from '@/components/PsikoWorld'

const PLANS = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '$0',
    period: '',
    color: '#6b7280',
    bg: 'rgba(249,250,251,0.9)',
    border: '#e5e7eb',
    features: ['20 sorgu/gün', 'Genel psikoloji', 'Temel arama'],
    cta: 'Mevcut Plan',
    disabled: true,
  },
  {
    id: 'student',
    name: 'Öğrenci',
    price: '$4.99',
    period: '/ay',
    color: '#7c3aed',
    bg: 'rgba(245,243,255,0.95)',
    border: '#a78bfa',
    badge: 'Popüler',
    features: ['100 sorgu/gün', 'Akademik içerik', 'Quiz üretimi', 'Web araştırması'],
    cta: 'Başla',
    disabled: false,
  },
  {
    id: 'clinician',
    name: 'Profesyonel',
    price: '$14.99',
    period: '/ay',
    color: '#4338ca',
    bg: 'rgba(238,242,255,0.95)',
    border: '#818cf8',
    features: ['Sınırsız sorgu', 'Klinik tanı kriterleri', 'Diferansiyel tanı', 'Öncelikli destek'],
    cta: 'Başla',
    disabled: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState('free')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setToken(data.session.access_token)
      supabase.from('profiles').select('plan').eq('id', data.session.user.id).single()
        .then(({ data: p }) => { if (p?.plan) setCurrentPlan(p.plan) })
    })
  }, [])

  async function handleSubscribe(planId: string) {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
    setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PsikoWorld />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Üst nav */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(76,29,149,0.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
          <Link href="/chat" className="text-white font-bold text-lg">← Psikoloji AI</Link>
          {currentPlan !== 'free' && (
            <button onClick={handlePortal} disabled={loading === 'portal'}
              className="text-sm text-purple-200 hover:text-white transition">
              {loading === 'portal' ? 'Yükleniyor...' : 'Aboneliği Yönet'}
            </button>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Planınızı Seçin
            </h1>
            <p className="text-purple-100 text-sm md:text-base">İhtiyacınıza uygun planla psikoloji asistanınıza erişin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
            {PLANS.map(plan => {
              const isCurrentPlan = currentPlan === plan.id
              return (
                <div key={plan.id} className="relative rounded-3xl p-6 flex flex-col shadow-xl"
                  style={{ background: plan.bg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `2px solid ${isCurrentPlan ? plan.color : plan.border}` }}>

                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${plan.color}, #6d28d9)` }}>
                      {plan.badge}
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                      Aktif ✓
                    </div>
                  )}

                  <h2 className="text-lg font-bold mb-1" style={{ color: plan.color }}>{plan.name}</h2>
                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-3xl font-extrabold text-gray-800">{plan.price}</span>
                    <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span style={{ color: plan.color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={plan.disabled || isCurrentPlan || loading === plan.id}
                    className="w-full py-2.5 rounded-2xl font-semibold text-sm transition disabled:opacity-50"
                    style={
                      plan.disabled || isCurrentPlan
                        ? { background: '#e5e7eb', color: '#9ca3af', cursor: 'default' }
                        : { background: `linear-gradient(135deg, ${plan.color}, #6d28d9)`, color: 'white' }
                    }
                  >
                    {loading === plan.id
                      ? 'Yönlendiriliyor...'
                      : isCurrentPlan
                      ? 'Mevcut Plan'
                      : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-purple-200 text-xs mt-8 text-center">
            Ödeme Stripe ile güvenle işlenir · İstediğiniz zaman iptal edebilirsiniz
          </p>
        </div>
      </div>
    </div>
  )
}
