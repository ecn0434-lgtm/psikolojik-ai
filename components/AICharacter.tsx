'use client'

import { useEffect, useState } from 'react'

export type CharacterState = 'idle' | 'thinking' | 'talking'

export default function AICharacter({
  state,
  size = 110,
}: {
  state: CharacterState
  size?: number
}) {
  const [mouthOpen, setMouthOpen] = useState(false)
  const [blinking, setBlinking] = useState(false)

  // Konuşunca ağız açılıp kapanır
  useEffect(() => {
    if (state !== 'talking') { setMouthOpen(false); return }
    const iv = setInterval(() => setMouthOpen(p => !p), 190)
    return () => clearInterval(iv)
  }, [state])

  // Rastgele göz kırpma
  useEffect(() => {
    const doBlink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 140)
    }
    const iv = setInterval(doBlink, 2800 + Math.random() * 2000)
    return () => clearInterval(iv)
  }, [])

  // Düşünürken gözler hafif yukarı bakar
  const px = state === 'thinking' ? -1 : 0
  const py = state === 'thinking' ? -3 : 0

  const animClass =
    state === 'idle'     ? 'animate-float'       :
    state === 'thinking' ? 'animate-think'        :
                           'animate-bounce-soft'

  return (
    <div className="relative flex flex-col items-center select-none" style={{ width: size, height: size + 20 }}>
      {/* Düşünme kabarcıkları */}
      {state === 'thinking' && (
        <div className="absolute flex gap-1" style={{ top: -18, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="w-2.5 h-2.5 rounded-full bg-purple-300 animate-dot-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-dot-2" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-dot-3" />
        </div>
      )}

      <div className={animClass} style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <defs>
            <radialGradient id="hg" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="100%" stopColor="#9333ea" />
            </radialGradient>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fce7f3" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fce7f3" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eg" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3e8ff" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#9333ea" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Sol kulak/çıkıntı */}
          <ellipse cx="26" cy="22" rx="11" ry="13" fill="url(#hg)" />
          {/* Sağ kulak/çıkıntı */}
          <ellipse cx="74" cy="22" rx="11" ry="13" fill="url(#hg)" />

          {/* Baş */}
          <circle cx="50" cy="55" r="36" fill="url(#hg)" filter="url(#shadow)" />

          {/* Sol göz beyazı */}
          <ellipse
            cx="37" cy="51"
            rx="9" ry={blinking ? 1.2 : 10}
            fill="url(#eg)"
          />
          {/* Sağ göz beyazı */}
          <ellipse
            cx="63" cy="51"
            rx="9" ry={blinking ? 1.2 : 10}
            fill="url(#eg)"
          />

          {/* Sol göz bebeği */}
          {!blinking && (
            <>
              <circle cx={37 + px} cy={51 + py} r="5" fill="#3b0764" />
              <circle cx={39 + px} cy={48 + py} r="2" fill="white" />
              <circle cx={35 + px} cy={53 + py} r="1" fill="white" opacity="0.6" />
            </>
          )}
          {/* Sağ göz bebeği */}
          {!blinking && (
            <>
              <circle cx={63 + px} cy={51 + py} r="5" fill="#3b0764" />
              <circle cx={65 + px} cy={48 + py} r="2" fill="white" />
              <circle cx={61 + px} cy={53 + py} r="1" fill="white" opacity="0.6" />
            </>
          )}

          {/* Sol yanak pembesi */}
          <ellipse cx="26" cy="62" rx="8" ry="6" fill="url(#bg)" />
          {/* Sağ yanak pembesi */}
          <ellipse cx="74" cy="62" rx="8" ry="6" fill="url(#bg)" />

          {/* Ağız */}
          {mouthOpen ? (
            <ellipse cx="50" cy="70" rx="9" ry="6" fill="#3b0764" />
          ) : (
            <path
              d="M 38 68 Q 50 78 62 68"
              stroke="#3b0764"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Küçük yıldız sol kulakta */}
          <text x="23" y="16" fontSize="9" textAnchor="middle" fill="#fde68a">✦</text>
          {/* Küçük yıldız sağ kulakta */}
          <text x="77" y="16" fontSize="9" textAnchor="middle" fill="#fde68a">✦</text>
        </svg>
      </div>
    </div>
  )
}
