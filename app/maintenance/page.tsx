import PsikoWorld from '@/components/PsikoWorld'
import AICharacter from '@/components/AICharacter'

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <PsikoWorld />

      {/* İçerik kartı */}
      <div
        className="relative z-10 text-center px-8 py-10 rounded-3xl max-w-md w-full mx-4 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(167,139,250,0.4)',
        }}
      >
        {/* Karakter */}
        <div className="flex justify-center mb-4">
          <AICharacter state="idle" size={110} />
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ color: '#3b0764' }}>
          Psikoloji AI
        </h1>

        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}
        >
          🔧 Çok Yakında
        </div>

        <p className="text-purple-800 mb-2 font-medium">
          Siteyi geliştiriyoruz!
        </p>
        <p className="text-purple-600 text-sm leading-relaxed">
          Ödeme sistemi ve yeni özellikler üzerinde çalışıyoruz.
          En kısa sürede sizlerle buluşacağız. ✨
        </p>

        <div className="mt-6 pt-5 border-t border-purple-100 flex justify-center gap-3 text-xs text-purple-400">
          <span>🧠 Psikoloji AI</span>
          <span>·</span>
          <span>Yakında açılıyor</span>
        </div>
      </div>
    </div>
  )
}
