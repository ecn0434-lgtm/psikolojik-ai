import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { anthropic, MODEL } from '@/lib/claude'
import { searchDocuments, buildContext } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 401 })

    const { topic, count = 5, type = 'mixed' } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Konu gerekli' }, { status: 400 })

    const results = await searchDocuments(topic, 8)
    const context = buildContext(results)

    const typeInstruction =
      type === 'multiple'
        ? '4 şıklı çoktan seçmeli sorular üret (A, B, C, D şıkları ve doğru cevap)'
        : type === 'open'
        ? 'Açık uçlu sorular üret (cevap anahtarı ile birlikte)'
        : 'Karışık: bazıları çoktan seçmeli (A/B/C/D), bazıları açık uçlu olsun'

    const contextSection = context
      ? `\n\nReferans kaynak:\n${context}`
      : ''

    const prompt = `"${topic}" konusunda ${count} adet psikoloji sorusu üret. ${typeInstruction}

Her soru için JSON formatında ver:
{
  "questions": [
    {
      "question": "soru metni",
      "type": "multiple",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "doğru cevap",
      "explanation": "kısa açıklama"
    }
  ]
}${contextSection}`

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ questions: [], raw: text })
  } catch (err: any) {
    console.error('Quiz API error:', err)
    return NextResponse.json({ error: 'Quiz oluşturulamadı.' }, { status: 500 })
  }
}
