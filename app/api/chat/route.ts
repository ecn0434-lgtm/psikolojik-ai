import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ragQuery } from '@/lib/rag'
import { getSystemPrompt, UserMode } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, history, mode } = await req.json()
    if (!message) return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 })

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 401 })

    // Limit kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_queries, last_query_date, plan')
      .eq('id', user.id)
      .single()

    if (profile) {
      const now = new Date()
      const windowStart = profile.last_query_date ? new Date(profile.last_query_date) : null
      const isNewWindow = !windowStart ||
        (now.getTime() - windowStart.getTime()) >= 24 * 60 * 60 * 1000
      const count = isNewWindow ? 0 : profile.daily_queries
      const limits: Record<string, number> = { free: 5, student: 100, clinician: 999999, admin: 999999 }
      const limit = limits[profile.plan] ?? 5

      if (count >= limit) {
        return NextResponse.json({ error: 'Sorgu limitinize ulaştınız. 24 saat sonra yenilenir.' }, { status: 429 })
      }

      await supabase.from('profiles').update({
        daily_queries: isNewWindow ? 1 : count + 1,
        ...(isNewWindow ? { last_query_date: now.toISOString() } : {}),
      }).eq('id', user.id)
    }

    const userMode: UserMode = mode || 'general'
    const systemPrompt = getSystemPrompt(userMode)
    const { answer, sources } = await ragQuery(message, systemPrompt, history)

    if (conversationId) {
      await supabase.from('messages').insert([
        { conversation_id: conversationId, role: 'user', content: message },
        { conversation_id: conversationId, role: 'assistant', content: answer, sources },
      ])
    }

    return NextResponse.json({ answer, sources })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
