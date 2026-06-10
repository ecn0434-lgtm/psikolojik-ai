import { anthropic, MODEL } from './claude'
import { supabaseAdmin } from './supabase-admin'

export interface SearchResult {
  content: string
  source: string
  page?: number
  similarity: number
}

export async function embedText(text: string): Promise<number[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
        signal: controller.signal,
      }
    )
    if (!res.ok) throw new Error(`Embedding hatası: ${res.status}`)
    const data = await res.json()
    return Array.isArray(data[0]) ? data[0] : data
  } finally {
    clearTimeout(timeout)
  }
}

export async function searchDocuments(
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  const embedding = await embedText(query)

  const { data, error } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: embedding,
    match_count: topK,
    match_threshold: 0.3,
  })

  if (error) throw new Error(error.message)

  return (data || []).map((row: any) => ({
    content: row.content,
    source: row.source,
    page: row.page,
    similarity: row.similarity,
  }))
}

export function buildContext(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[Kaynak ${i + 1}: ${r.source}${r.page ? ` s.${r.page}` : ''}]\n${r.content}`
    )
    .join('\n\n---\n\n')
}

export async function ragQuery(
  query: string,
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ answer: string; sources: SearchResult[] }> {
  // Embedding başarısız olursa RAG'sız devam et
  let results: SearchResult[] = []
  let context = ''
  try {
    results = await searchDocuments(query)
    context = buildContext(results)
  } catch (e) {
    console.warn('Embedding/search atlandı:', e)
  }

  const userContent = context
    ? `Aşağıdaki kaynaklara dayanarak soruyu yanıtla:\n\n${context}\n\n---\nSoru: ${query}`
    : `Soru: ${query}`

  const messages = [
    ...history,
    { role: 'user' as const, content: userContent },
  ]

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const answer =
    response.content[0].type === 'text' ? response.content[0].text : ''

  return { answer, sources: results }
}
