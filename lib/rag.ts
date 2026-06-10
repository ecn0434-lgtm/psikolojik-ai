import { anthropic, MODEL } from './claude'
import { supabaseAdmin } from './supabase-admin'

export interface SearchResult {
  content: string
  source: string
  page?: number
  similarity: number
}

let _embedder: any = null

async function getEmbedder() {
  if (!_embedder) {
    const { pipeline } = await import('@xenova/transformers')
    _embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2')
  }
  return _embedder
}

export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder()
  const result = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data as Float32Array)
}

export async function searchDocuments(
  query: string,
  topK: number = 10
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
  const results = await searchDocuments(query)
  const context = buildContext(results)

  const userContent = context
    ? `Aşağıdaki kaynaklara dayanarak soruyu yanıtla:\n\n${context}\n\n---\nSoru: ${query}`
    : `Soru: ${query}`

  const messages = [
    ...history,
    { role: 'user' as const, content: userContent },
  ]

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })

  const answer =
    response.content[0].type === 'text' ? response.content[0].text : ''

  return { answer, sources: results }
}
