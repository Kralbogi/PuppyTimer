import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config' // Initialize i18next
import { LanguageProvider } from './contexts/LanguageContext'
import App from './App'

// ── Ortam değişkeni validasyonu ───────────────────────────────────────────────
const REQUIRED_ENV_VARS = ['VITE_ADMIN_UID'] as const
for (const key of REQUIRED_ENV_VARS) {
  if (!import.meta.env[key]) {
    console.warn(`[PawLand] Eksik ortam değişkeni: ${key}. Bazı özellikler çalışmayabilir.`)
  }
}

// Tüm beklenmedik render hatalarını yakalar, beyaz ekran yerine
// kullanıcı dostu bir hata ekranı gösterir.
class ErrorBoundary extends Component<{ children: ReactNode }, { hata: Error | null }> {
  state = { hata: null }

  static getDerivedStateFromError(hata: Error) {
    return { hata }
  }

  render() {
    if (this.state.hata) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '24px', textAlign: 'center', background: '#faf6f0' }}>
          <p style={{ fontWeight: 700, fontSize: '20px', color: '#e07a2f', marginBottom: '12px' }}>PawLand</p>
          <p style={{ fontWeight: 700, fontSize: '16px', color: '#3d2e1f' }}>Bir şeyler ters gitti</p>
          <p style={{ fontSize: '13px', color: '#8a7560', marginTop: '4px', marginBottom: '20px' }}>Sayfayı yenilemeyi deneyin.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#e07a2f', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Yenile
          </button>
        </div>
      )
    }
    return this.state.hata === null ? this.props.children : null
  }
}

// Eski dark mode tercihini ve class'ını temizle
localStorage.removeItem('pawland_theme')
document.documentElement.classList.remove('dark')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
