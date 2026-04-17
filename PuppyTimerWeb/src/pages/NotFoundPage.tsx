import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="mb-6 opacity-30">
        <img src="/pawlandlogo.png" alt="PawLand" className="w-20 h-20 object-contain mx-auto" />
      </div>
      <h1 className="text-6xl font-black mb-2" style={{ color: 'var(--color-text)' }}>404</h1>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Sayfa Bulunamadı
      </p>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-primary)' }}
      >
        <Home size={18} />
        Ana Sayfaya Dön
      </button>
    </div>
  )
}
