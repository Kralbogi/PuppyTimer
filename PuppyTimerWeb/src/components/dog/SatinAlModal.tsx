// =============================================================================
// PawLand - Satın Al Modalı
// Kilitli item satın alma ekranı — Stripe veya yakında bilgisi
// =============================================================================

import { X, CreditCard, ShoppingBag, Star, Shield, Zap } from "lucide-react";

export interface SatinAlItem {
  id: string;
  label: string;
  emoji: string;
  fiyat: string;
  aciklama?: string;
}

interface SatinAlModalProps {
  item: SatinAlItem;
  onKapat: () => void;
}

export default function SatinAlModal({ item, onKapat }: SatinAlModalProps) {
  const handleKrediKarti = () => {
    // Stripe entegrasyonu aktif olduğunda buraya checkout URL gelecek
    // Şimdilik Premium sayfasına yönlendir
    onKapat();
    window.location.href = "/premium";
  };

  const handleAppStore = () => {
    onKapat();
    window.location.href = "/premium";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onKapat}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--color-bg-card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className="relative h-32 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
            <div className="absolute top-3 right-3">
              <button onClick={onKapat}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={15} className="text-white" />
              </button>
            </div>
            {/* Dekoratif daireler */}
            <div className="absolute top-4 left-6 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-2 right-12 w-10 h-10 rounded-full bg-white/10" />
            {/* Emoji */}
            <div className="text-6xl z-10 drop-shadow-lg">{item.emoji}</div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Item adı + fiyat */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{item.label}</h2>
                {item.aciklama && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.aciklama}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>{item.fiyat}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>tek seferlik</div>
              </div>
            </div>

            {/* Özellikler */}
            <div className="rounded-2xl p-3 space-y-2"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              {[
                { icon: Star,   text: "Sadece sana özel görünüm" },
                { icon: Zap,    text: "Anında aktif, kalıcı satın alma" },
                { icon: Shield, text: "Güvenli ödeme" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.12)' }}>
                    <Icon size={12} style={{ color: '#6366f1' }} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Ödeme butonları */}
            <div className="space-y-2.5">
              <button
                onClick={handleKrediKarti}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white smooth-transition active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
              >
                <CreditCard size={16} />
                Kredi / Banka Kartı ile Öde
              </button>

              <button
                onClick={handleAppStore}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold smooth-transition active:scale-[0.98]"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text)',
                }}
              >
                <ShoppingBag size={16} />
                Uygulama İçi Satın Al
              </button>
            </div>

            <p className="text-center text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Satın alarak{' '}
              <span style={{ color: 'var(--color-primary)' }}>kullanım koşullarını</span>
              {' '}kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
