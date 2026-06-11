import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const supabaseId = session.metadata?.supabase_id
        const plan = session.metadata?.plan
        if (supabaseId && plan) {
          await supabaseAdmin.from('profiles').update({
            plan,
            stripe_subscription_id: session.subscription as string,
          }).eq('id', supabaseId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const supabaseId = sub.metadata?.supabase_id
        const plan = sub.metadata?.plan
        if (supabaseId && plan) {
          const status = sub.status === 'active' ? plan : 'free'
          await supabaseAdmin.from('profiles').update({
            plan: status,
            stripe_subscription_id: sub.id,
          }).eq('id', supabaseId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const supabaseId = sub.metadata?.supabase_id
        if (supabaseId) {
          await supabaseAdmin.from('profiles').update({
            plan: 'free',
            stripe_subscription_id: null,
          }).eq('id', supabaseId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
