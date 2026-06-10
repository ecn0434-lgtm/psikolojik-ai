'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import { Send, Search, BookOpen, LogOut, Brain } from 'lucide-react'
import AICharacter, { CharacterState } from '@/components/AICharacter'
import PsikoWorld from '@/components/PsikoWorld'

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
  const [charState, setCharState] = useState<CharacterState>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Karakter durumu: loading→thinking, yanıt gelince→talking, 3sn sonra→idle
  useEffect(() => {
    if (loading) {
      setCharState('thinking')
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current)
    } else if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      setCharState('talking')
      talkTimerRef.current = setTimeout(() => setCharState('idle'), 3000)
    }
    return () => { if (talkTimerRef.current) clearTimeout(talkTimerRef.current) }
  }, [loading, messages])

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
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: res.ok ? data.answer : `Hata: ${data.error}`,
        sources: res.ok ? data.sources : [],
      },
    ])
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
    <div className="flex h-screen overflow-hidden" style={{ position: 'relative' }}>
      <PsikoWorld />

      {/* Sidebar — masaüstü */}
      <div className="hidden md:flex w-60 flex-col p-5 shrink-0" style={{ position: 'relative', zIndex: 1, background: 'rgba(76,29,149,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: '1px solid rgba(167,139,250,0.3)' }}>
        <h1 className="text-lg font-bold text-white mb-2">Psikoloji AI</h1>
        <p className="text-xs text-purple-300 mb-5">Psikoloji asistanınız</p>

        <div className="text-xs text-purple-300 mb-1">Mod</div>
        <select
          value={mode}
          onChange={e => setMode(e.target.value as any)}
          className="text-white text-sm rounded-lg px-3 py-1.5 mb-6 border-0 outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <option value="student">🎓 Öğrenci</option>
          <option value="clinician">🏥 Klinisyen</option>
          <option value="general">👤 Genel</option>
        </select>

        {tabConfig.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-2 text-left transition-all"
            style={{
              background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: tab === t.id ? 'white' : 'rgba(196,181,253,1)',
            }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}

        {/* Karakter - sidebar'da */}
        <div className="flex-1 flex items-end justify-center pb-4">
          <AICharacter state={charState} size={90} />
        </div>

        <button onClick={logout} className="flex items-center gap-2 text-sm text-purple-300 hover:text-white transition-colors mt-2">
          <LogOut size={16} /> Çıkış
        </button>
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>

        {/* Mobil üst bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 shrink-0" style={{ background: 'rgba(76,29,149,0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(167,139,250,0.3)' }}>
          <div className="flex items-center gap-2">
            <AICharacter state={charState} size={36} />
            <span className="text-white font-bold text-sm">Psikoloji AI</span>
          </div>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as any)}
            className="text-white text-xs rounded-lg px-2 py-1 border-0 outline-none"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <option value="student">🎓 Öğrenci</option>
            <option value="clinician">🏥 Klinisyen</option>
            <option value="general">👤 Genel</option>
          </select>
          <button onClick={logout} className="text-purple-300 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>

        {/* SOHBET */}
        {tab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>

              {/* Boş ekran: büyük karakter */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-10">
                  <AICharacter state={charState} size={130} />
                  <div className="text-center">
                    <p className="text-xl font-semibold text-purple-900">Merhaba! Ben Psiko 👋</p>
                    <p className="text-sm text-purple-600 mt-1">Psikoloji ile ilgili her şeyi sorabilirsiniz</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* AI avatar - mesajların yanında */}
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mb-1">
                      <AICharacter state={i === messages.length - 1 ? charState : 'idle'} size={38} />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] md:max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm"
                    style={
                      msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }
                        : { background: 'white', color: '#1e1b4b', border: '1px solid #ede9fe' }
                    }
                  >
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-purple-100 flex flex-wrap gap-1">
                        {msg.sources.slice(0, 4).map((s, si) => (
                          <span key={si} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                            📚 {s.source}{s.page ? ` s.${s.page}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <AICharacter state="thinking" size={38} />
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-purple-100 flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-dot-1" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-dot-2" />
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-dot-3" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Mesaj giriş alanı */}
            <form onSubmit={sendMessage} className="p-3 md:p-4 shrink-0 flex gap-2"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderTop: '1px solid #ede9fe' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Soru sorun..."
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none min-w-0 text-purple-900 placeholder-purple-300"
                style={{ background: 'white', border: '1.5px solid #ddd6fe' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 p-2.5 rounded-2xl text-white transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}

        {/* ARAMA */}
        {tab === 'search' && (
          <div className="p-3 md:p-6 flex-1 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <form onSubmit={handleSearch} className="flex gap-2 mb-5">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Psikoloji literatüründe ara..."
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none min-w-0 text-purple-900 placeholder-purple-300"
                style={{ background: 'white', border: '1.5px solid #ddd6fe' }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                Ara
              </button>
            </form>
            <div className="space-y-3">
              {searchResults.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-purple-700">📚 {r.source}{r.page ? ` — s.${r.page}` : ''}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-purple-600" style={{ background: '#f5f3ff' }}>{Math.round(r.similarity * 100)}%</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab === 'quiz' && (
          <div className="p-3 md:p-6 flex-1 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <form onSubmit={generateQuiz} className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 md:p-5 mb-5 space-y-3">
              <h2 className="text-base md:text-lg font-semibold text-purple-900">Quiz Üret</h2>
              <input
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="Konu girin... (örn: depresyon, anksiyete)"
                className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none text-purple-900 placeholder-purple-300"
                style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}
              />
              <div className="flex gap-3">
                {[
                  { label: 'Soru sayısı', value: quizCount, onChange: (v: string) => setQuizCount(Number(v)), options: [['3','3'],['5','5'],['10','10']] },
                  { label: 'Soru tipi', value: quizType, onChange: (v: string) => setQuizType(v as any), options: [['mixed','Karışık'],['multiple','Çoktan seçmeli'],['open','Açık uçlu']] },
                ].map(f => (
                  <div key={f.label} className="flex-1">
                    <label className="text-xs text-purple-400 block mb-1">{f.label}</label>
                    <select
                      value={f.value}
                      onChange={e => f.onChange(e.target.value)}
                      className="w-full rounded-xl px-3 py-1.5 text-sm outline-none text-purple-900"
                      style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}
                    >
                      {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={quizLoading || !quizTopic.trim()}
                className="w-full py-2.5 rounded-2xl text-white font-medium text-sm transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {quizLoading ? 'Sorular üretiliyor...' : 'Quiz Oluştur'}
              </button>
            </form>

            <div className="space-y-3 md:space-y-4">
              {quizQuestions.map((q, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 md:p-5">
                  <p className="font-medium text-purple-900 mb-3 text-sm md:text-base">{i + 1}. {q.question}</p>
                  {q.type === 'multiple' && q.options && (
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, oi) => (
                        <p key={oi} className="text-sm text-gray-600 rounded-xl px-3 py-2" style={{ background: '#faf5ff' }}>{opt}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
                    className="text-sm text-purple-600 font-medium hover:text-purple-800 transition"
                  >
                    {revealed[i] ? 'Cevabı Gizle ▲' : 'Cevabı Göster ▼'}
                  </button>
                  {revealed[i] && (
                    <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
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
        <div className="md:hidden flex shrink-0" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #ede9fe' }}>
          {tabConfig.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-3 flex flex-col items-center gap-0.5 text-xs transition-colors"
              style={{ color: tab === t.id ? '#6d28d9' : '#a78bfa' }}
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
