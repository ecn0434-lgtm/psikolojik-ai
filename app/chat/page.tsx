'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import { Send, Search, BookOpen, LogOut, Brain } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { source: string; page?: number }[]
}

interface QuizQuestion {
  question: string
  type: 'multiple' | 'open'
  options?: string[]
  answer: string
  explanation: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'student' | 'clinician' | 'general'>('general')
  const [tab, setTab] = useState<'chat' | 'search' | 'quiz'>('chat')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [token, setToken] = useState('')
  const [quizTopic, setQuizTopic] = useState('')
  const [quizCount, setQuizCount] = useState(5)
  const [quizType, setQuizType] = useState<'mixed' | 'multiple' | 'open'>('mixed')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = '/login'; return }
      setToken(data.session.access_token)
      supabase.from('profiles').select('mode').eq('id', data.session.user.id).single()
        .then(({ data: p }) => { if (p?.mode) setMode(p.mode as any) })
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: input, history, mode }),
    })
    const data = await res.json()

    if (res.ok) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: `Hata: ${data.error}` }])
    }
    setLoading(false)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    })
    const data = await res.json()
    setSearchResults(data.results || [])
  }

  async function generateQuiz(e: React.FormEvent) {
    e.preventDefault()
    if (!quizTopic.trim()) return
    setQuizLoading(true)
    setQuizQuestions([])
    setRevealed({})

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topic: quizTopic, count: quizCount, type: quizType }),
    })
    const data = await res.json()
    setQuizQuestions(data.questions || [])
    setQuizLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const tabConfig = [
    { id: 'chat' as const, label: 'Sohbet', icon: BookOpen },
    { id: 'search' as const, label: 'Arama', icon: Search },
    { id: 'quiz' as const, label: 'Quiz', icon: Brain },
  ]

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar — sadece masaüstü */}
      <div className="hidden md:flex w-56 bg-indigo-900 text-white flex-col p-4 shrink-0">
        <h1 className="text-lg font-bold mb-6">Psikoloji AI</h1>

        <div className="text-xs text-indigo-300 mb-1">Mod</div>
        <select
          value={mode}
          onChange={e => setMode(e.target.value as any)}
          className="bg-indigo-800 text-white text-sm rounded px-2 py-1 mb-6"
        >
          <option value="student">🎓 Öğrenci</option>
          <option value="clinician">🏥 Klinisyen</option>
          <option value="general">👤 Genel</option>
        </select>

        {tabConfig.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 ${tab === t.id ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}

        <div className="flex-1" />
        <button onClick={logout} className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white">
          <LogOut size={16} /> Çıkış
        </button>
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobil üst bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-indigo-900 text-white shrink-0">
          <h1 className="text-base font-bold">Psikoloji AI</h1>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as any)}
            className="bg-indigo-800 text-white text-xs rounded px-2 py-1"
          >
            <option value="student">🎓 Öğrenci</option>
            <option value="clinician">🏥 Klinisyen</option>
            <option value="general">👤 Genel</option>
          </select>
          <button onClick={logout} className="text-indigo-300 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>

        {/* SOHBET */}
        {tab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-16">
                  <p className="text-xl mb-2">Psikoloji Asistanı</p>
                  <p className="text-sm px-4">DSM-5, genel psikoloji, her şeyi sorabilirsiniz</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-2xl rounded-2xl px-3 py-2 md:px-4 md:py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white shadow text-gray-800'}`}>
                    <div className="prose prose-sm max-w-none text-sm md:text-base">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                        {msg.sources.slice(0, 5).map((s, si) => (
                          <span key={si} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            📚 {s.source}{s.page ? ` s.${s.page}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow rounded-2xl px-4 py-3 text-gray-400 text-sm animate-pulse">
                    Yanıt hazırlanıyor...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 md:p-4 bg-white border-t flex gap-2 shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Soru sorun..."
                className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm min-w-0"
              />
              <button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shrink-0">
                <Send size={18} />
              </button>
            </form>
          </>
        )}

        {/* ARAMA */}
        {tab === 'search' && (
          <div className="p-3 md:p-6 flex-1 overflow-y-auto">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4 md:mb-6">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="DSM-5'te ara..."
                className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm min-w-0"
              />
              <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 text-sm shrink-0">Ara</button>
            </form>
            <div className="space-y-3">
              {searchResults.map((r, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-3 md:p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-indigo-700">📚 {r.source}{r.page ? ` — s.${r.page}` : ''}</span>
                    <span className="text-xs text-gray-400">{Math.round(r.similarity * 100)}%</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab === 'quiz' && (
          <div className="p-3 md:p-6 flex-1 overflow-y-auto">
            <form onSubmit={generateQuiz} className="bg-white rounded-2xl shadow p-4 md:p-5 mb-4 md:mb-6 space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-indigo-900">Quiz Üret</h2>
              <input
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="Konu girin... (örn: depresyon, anksiyete)"
                className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Soru sayısı</label>
                  <select value={quizCount} onChange={e => setQuizCount(Number(e.target.value))} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Soru tipi</label>
                  <select value={quizType} onChange={e => setQuizType(e.target.value as any)} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                    <option value="mixed">Karışık</option>
                    <option value="multiple">Çoktan seçmeli</option>
                    <option value="open">Açık uçlu</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={quizLoading || !quizTopic.trim()} className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
                {quizLoading ? 'Sorular üretiliyor...' : 'Quiz Oluştur'}
              </button>
            </form>

            <div className="space-y-3 md:space-y-4">
              {quizQuestions.map((q, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-4 md:p-5">
                  <p className="font-medium text-gray-800 mb-3 text-sm md:text-base">{i + 1}. {q.question}</p>
                  {q.type === 'multiple' && q.options && (
                    <div className="space-y-1 mb-3">
                      {q.options.map((opt, oi) => (
                        <p key={oi} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">{opt}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    {revealed[i] ? 'Cevabı Gizle' : 'Cevabı Göster'}
                  </button>
                  {revealed[i] && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm">
                      <p className="font-medium text-green-800">Cevap: {q.answer}</p>
                      <p className="text-green-700 mt-1">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobil alt navigasyon */}
        <div className="md:hidden flex border-t bg-white shrink-0">
          {tabConfig.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition ${tab === t.id ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
