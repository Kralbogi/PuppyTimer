import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🐾</div>
          <p style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Bir şeyler ters gitti</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', marginBottom: '20px' }}>Sayfayı yenilemeyi deneyin.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Yenile
          </button>
        </div>
      )
    }
    return this.state.hata === null ? this.props.children : null
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
