import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { embedText } from '@/lib/rag'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'admin') return NextResponse.json({ error: 'Sadece adminler veri ekleyebilir' }, { status: 403 })

  const { content, source, page, url } = await req.json()
  if (!content || !source) return NextResponse.json({ error: 'content ve source zorunlu' }, { status: 400 })

  const chunks = chunkText(content)
  const inserted = []

  for (const chunk of chunks) {
    const embedding = await embedText(chunk)
    const { data, error } = await supabaseAdmin.from('documents').insert({
      content: chunk, source, page, url, embedding,
    }).select('id').single()
    if (!error) inserted.push(data.id)
  }

  return NextResponse.json({ inserted: inserted.length })
}

function chunkText(text: string, maxTokens = 600, overlap = 100): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    chunks.push(words.slice(start, end).join(' '))
    start += maxTokens - overlap
  }

  return chunks
}
