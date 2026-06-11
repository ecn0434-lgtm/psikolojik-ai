import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    if (!PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 401 })

    // Mevcut Stripe customer ID'yi al veya yeni oluştur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://psikoloji-ai.vercel.app'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/chat?subscribed=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { supabase_id: user.id, plan },
      subscription_data: {
        metadata: { supabase_id: user.id, plan },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
