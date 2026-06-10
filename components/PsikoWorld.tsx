export default function PsikoWorld() {
  const PSKOS = [
    { cls: 'wander-1', main: '#60a5fa', light: '#93c5fd', dark: '#1e40af', talk: true  },
    { cls: 'wander-2', main: '#4ade80', light: '#86efac', dark: '#166534', talk: false },
    { cls: 'wander-3', main: '#fb923c', light: '#fdba74', dark: '#9a3412', talk: true  },
    { cls: 'wander-4', main: '#f472b6', light: '#f9a8d4', dark: '#831843', talk: false },
    { cls: 'wander-5', main: '#34d399', light: '#6ee7b7', dark: '#065f46', talk: true  },
    { cls: 'wander-6', main: '#facc15', light: '#fde68a', dark: '#92400e', talk: false },
    { cls: 'wander-7', main: '#f87171', light: '#fca5a5', dark: '#991b1b', talk: true  },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>

      {/* ── Gökyüzü ── */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #bae6fd 0%, #c4b5fd 45%, #e9d5ff 75%, #ddd6fe 100%)',
      }} />

      {/* ── Güneş ── */}
      <div className="absolute" style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #fef08a, #fbbf24)',
        top: '7%', right: '12%',
        boxShadow: '0 0 50px 20px rgba(251,191,36,0.35)',
      }} />

      {/* ── Bulutlar ── */}
      {[
        { top: '8%',  dur: '38s', delay: '0s',    scale: 1.1 },
        { top: '14%', dur: '55s', delay: '-18s',  scale: 0.75 },
        { top: '6%',  dur: '46s', delay: '-30s',  scale: 0.9 },
      ].map((c, i) => (
        <div key={i} className="absolute" style={{
          top: c.top,
          animation: `cloud-drift ${c.dur} linear infinite ${c.delay}`,
          transform: `scale(${c.scale})`,
          transformOrigin: 'left center',
        }}>
          <svg width="160" height="60" viewBox="0 0 160 60">
            <ellipse cx="80" cy="44" rx="72" ry="20" fill="white" opacity="0.88" />
            <ellipse cx="55" cy="34" rx="34" ry="28" fill="white" opacity="0.88" />
            <ellipse cx="100" cy="30" rx="30" ry="26" fill="white" opacity="0.88" />
            <ellipse cx="76" cy="24" rx="24" ry="22" fill="white" opacity="0.88" />
          </svg>
        </div>
      ))}

      {/* ── Arka dağlar (SVG) ── */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice"
        style={{ height: '75%' }}>
        <defs>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
        </defs>

        {/* Arka dağlar */}
        <path d="M -80,900 Q 200,260 480,900 Z"  fill="url(#m1)" />
        <path d="M 250,900 Q 600,180 950,900 Z"  fill="url(#m2)" />
        <path d="M 720,900 Q 1080,310 1440,900 Z" fill="url(#m1)" />
        <path d="M 1100,900 Q 1320,400 1540,900 Z" fill="url(#m3)" />

        {/* Orta tepeler */}
        <path d="M -100,900 Q 180,560 460,900 Z"  fill="url(#hill1)" opacity="0.7" />
        <path d="M 200,900 Q 520,520 840,900 Z"   fill="url(#hill2)" opacity="0.65" />
        <path d="M 600,900 Q 950,540 1300,900 Z"  fill="url(#hill1)" opacity="0.7" />
        <path d="M 1000,900 Q 1240,560 1500,900 Z" fill="url(#hill2)" opacity="0.65" />

        {/* Zemin */}
        <rect x="0" y="750" width="1440" height="150" fill="url(#ground)" />
        <rect x="0" y="748" width="1440" height="8" rx="3" fill="#4ade80" opacity="0.5" />

        {/* Ağaçlar — arka sıra (küçük) */}
        {[80, 195, 320, 450, 590, 730, 870, 1010, 1150, 1290, 1390].map((x, i) => {
          const h = 60 + (i % 3) * 20
          const r = 20 + (i % 3) * 7
          return (
            <g key={i}>
              <rect x={x - 4} y={750 - h} width={8} height={h} rx="3" fill="#713f12" />
              <circle cx={x} cy={750 - h - r * 0.55} r={r} fill="#15803d" opacity="0.9" />
              <circle cx={x} cy={750 - h - r * 0.55} r={r * 0.75} fill="#16a34a" />
            </g>
          )
        })}

        {/* Ağaçlar — ön sıra (büyük) */}
        {[30, 150, 280, 420, 580, 750, 900, 1070, 1210, 1360].map((x, i) => {
          const h = 80 + (i % 4) * 25
          const r = 28 + (i % 4) * 8
          const green = i % 2 === 0 ? '#166534' : '#14532d'
          const greenL = i % 2 === 0 ? '#16a34a' : '#15803d'
          return (
            <g key={i}>
              <rect x={x - 5} y={750 - h} width={10} height={h} rx="3" fill="#92400e" />
              <circle cx={x} cy={750 - h - r * 0.5} r={r} fill={green} />
              <circle cx={x} cy={750 - h - r * 0.5} r={r * 0.78} fill={greenL} />
              <circle cx={x - r * 0.3} cy={750 - h - r * 0.7} r={r * 0.45} fill={greenL} opacity="0.8" />
            </g>
          )
        })}

        {/* Çiçekler zeminde */}
        {[60,160,290,430,570,700,840,980,1120,1260,1380].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={752} r={4} fill={['#fde68a','#fca5a5','#a5f3fc','#d9f99d','#fbcfe8'][i % 5]} />
          </g>
        ))}
      </svg>

      {/* ── Gezinen mini Psiko'lar ── */}
      {PSKOS.map((p, i) => (
        <div key={i} className={p.cls}>
          <svg width="48" height="54" viewBox="0 0 50 56">
            <defs>
              <radialGradient id={`pg${i}`} cx="38%" cy="30%" r="65%">
                <stop offset="0%" stopColor={p.light} />
                <stop offset="100%" stopColor={p.main} />
              </radialGradient>
            </defs>
            {/* Kulaklar */}
            <ellipse cx="14" cy="13" rx="8" ry="9" fill={`url(#pg${i})`} />
            <ellipse cx="36" cy="13" rx="8" ry="9" fill={`url(#pg${i})`} />
            {/* Baş */}
            <circle cx="25" cy="32" r="21" fill={`url(#pg${i})`} />
            {/* Gözler */}
            <ellipse cx="17" cy="29" rx="5.5" ry="6" fill="white" />
            <ellipse cx="33" cy="29" rx="5.5" ry="6" fill="white" />
            <circle cx="18" cy="29" r="3.5" fill={p.dark} />
            <circle cx="34" cy="29" r="3.5" fill={p.dark} />
            <circle cx="19.5" cy="27.5" r="1.5" fill="white" />
            <circle cx="35.5" cy="27.5" r="1.5" fill="white" />
            {/* Yanak */}
            <ellipse cx="9"  cy="35" rx="5" ry="3.5" fill="rgba(255,180,180,0.55)" />
            <ellipse cx="41" cy="35" rx="5" ry="3.5" fill="rgba(255,180,180,0.55)" />
            {/* Ağız */}
            {p.talk ? (
              <ellipse cx="25" cy="43" rx="7" ry="4.5" fill={p.dark}>
                <animate attributeName="ry" values="4.5;1.2;4.5" dur="0.38s" repeatCount="indefinite" />
              </ellipse>
            ) : (
              <path d="M 16 41 Q 25 49 34 41" stroke={p.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}
            {/* Yıldızlar */}
            <text x="11" y="8" fontSize="8" textAnchor="middle" fill="#fde68a">✦</text>
            <text x="39" y="8" fontSize="8" textAnchor="middle" fill="#fde68a">✦</text>
          </svg>
        </div>
      ))}

    </div>
  )
}
