import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '@/lib/rag'

export async function POST(req: NextRequest) {
  const { query, topK } = await req.json()
  if (!query) return NextResponse.json({ error: 'Sorgu gerekli' }, { status: 400 })

  const results = await searchDocuments(query, topK || 10)
  return NextResponse.json({ results })
}
