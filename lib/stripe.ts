import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const PLANS = {
  student: {
    name: 'Öğrenci',
    priceId: process.env.STRIPE_STUDENT_PRICE_ID!,
    amount: 4.99,
    currency: 'usd',
    label: '$4.99/ay',
    queries: 100,
    features: ['100 sorgu/gün', 'Akademik içerik', 'Quiz üretimi', 'Web araştırması'],
  },
  clinician: {
    name: 'Profesyonel',
    priceId: process.env.STRIPE_CLINICIAN_PRICE_ID!,
    amount: 14.99,
    currency: 'usd',
    label: '$14.99/ay',
    queries: -1,
    features: ['Sınırsız sorgu', 'Klinik tanı kriterleri', 'Diferansiyel tanı', 'Öncelikli destek'],
  },
}
