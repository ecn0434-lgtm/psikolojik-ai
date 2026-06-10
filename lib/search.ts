export interface WebResult {
  title: string
  url: string
  content: string
}

export async function webSearch(query: string): Promise<WebResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_key_here'
        ? { api_key: process.env.TAVILY_API_KEY }
        : {}),
      query: `psikoloji ${query}`,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
    }),
  })

  if (!res.ok) return []

  const data = await res.json()
  return (data.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }))
}
