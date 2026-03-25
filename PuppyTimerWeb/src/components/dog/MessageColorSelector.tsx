// =============================================================================
// PawLand - Mesaj Rengi Seçici
// Premium / Satın Al modları + inline sohbet balonu önizlemesi
// =============================================================================

import { useState } from "react";
import { Crown, Lock, ShoppingBag, X, ShoppingCart } from "lucide-react";
import SatinAlModal, { type SatinAlItem } from "./SatinAlModal";
import {
  MesajRengi,
  mesajRengiBaslik,
  mesajRengiHex,
  tumMesajRenkleri,
} from "../../types/enums";

type SatinAlRenk = { id: string; label: string; emoji: string; hex: string; fiyat: string; aciklama: string };

const SATIN_AL_RENKLER: SatinAlRenk[] = [
  { id: "altin",   label: "Altın",   emoji: "🟡", hex: "#FFD700", fiyat: "₺4,99", aciklama: "Köpeğinin mesajları altın renkli görünsün" },
  { id: "gumus",   label: "Gümüş",   emoji: "⚪", hex: "#A8B5C4", fiyat: "₺4,99", aciklama: "Şık gümüş renkli mesaj ve isim" },
  { id: "pembe",   label: "Pembe",   emoji: "🩷", hex: "#FF6EB4", fiyat: "₺3,99", aciklama: "Sevimli pembe renk ile öne çık" },
  { id: "turkuaz", label: "Turkuaz", emoji: "🩵", hex: "#00CED1", fiyat: "₺3,99", aciklama: "Ferahlatıcı turkuaz mesaj rengi" },
];

// Inline sohbet balonu önizlemesi
function SohbetBalonuOnizleme({ item, onSatinAl, onIptal }: { item: SatinAlRenk; onSatinAl: () => void; onIptal: () => void }) {
  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: `2px solid ${item.hex}66`, background: 'var(--color-bg-card)' }}>
      {/* Chat preview */}
      <div style={{ padding: '14px 16px', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <p style={{ fontSize: 10, color: '#999', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Önizleme</p>
        {/* Other user bubble */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🐶</div>
          <div>
            <p style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>Boncuk</p>
            <div style={{ background: 'white', borderRadius: '12px 12px 12px 2px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: 180 }}>
              <p style={{ fontSize: 12, color: '#333', margin: 0 }}>Merhaba! Bugün parkta görüşelim mi? 🐾</p>
            </div>
          </div>
        </div>
        {/* Own bubble — with selected color */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: 'row-reverse' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${item.hex}`, background: `${item.hex}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🐕</div>
          <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={{ fontSize: 10, color: item.hex, fontWeight: 700, marginBottom: 2 }}>Papi ({item.label})</p>
            <div style={{
              background: `${item.hex}18`,
              border: `1.5px solid ${item.hex}44`,
              borderRadius: '12px 12px 2px 12px',
              padding: '8px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              maxWidth: 180,
            }}>
              <p style={{ fontSize: 12, color: item.hex, margin: 0, fontWeight: 600 }}>Evet tabii! Sütlüce parkında buluşalım 🎾</p>
            </div>
          </div>
        </div>
      </div>
      {/* Buy bar */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'white' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{item.label} Mesaj Rengi</p>
          <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{item.aciklama}</p>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: item.hex }}>{item.fiyat}</span>
        <button type="button" onClick={onIptal}
          style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #eee', background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#666" />
        </button>
        <button type="button" onClick={onSatinAl}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: item.hex, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <ShoppingCart size={13} />Satın Al
        </button>
      </div>
    </div>
  );
}

interface MessageColorSelectorProps {
  seciliRenk?: MesajRengi;
  onChange: (renk: MesajRengi) => void;
  isPremium: boolean;
  onPremiumUpsell?: () => void;
}

export default function MessageColorSelector({
  seciliRenk = MesajRengi.Varsayilan,
  onChange,
  isPremium,
  onPremiumUpsell,
}: MessageColorSelectorProps) {
  const [satinAlItem, setSatinAlItem] = useState<SatinAlItem | null>(null);
  const [previewRenk, setPreviewRenk] = useState<SatinAlRenk | null>(null);

  const handleSelect = (renk: MesajRengi) => {
    if (!isPremium && renk !== MesajRengi.Varsayilan) { onPremiumUpsell?.(); return; }
    onChange(renk);
  };

  return (
    <>
    {satinAlItem && <SatinAlModal item={satinAlItem} onKapat={() => setSatinAlItem(null)} />}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Mesaj Rengi</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Seçili: <span style={{ color: mesajRengiHex(seciliRenk) }}>●</span> {mesajRengiBaslik(seciliRenk)}
          </p>
        </div>
        {!isPremium && (
          <button type="button" onClick={onPremiumUpsell}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}>
            <Crown size={10} />Premium
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-3 min-w-max">
          {/* Premium renkler */}
          {tumMesajRenkleri.map((renk) => {
            const locked = !isPremium && renk !== MesajRengi.Varsayilan;
            const secili = seciliRenk === renk;
            return (
              <button key={renk} type="button" onClick={() => handleSelect(renk)}
                className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95">
                <div className="w-11 h-11 rounded-full shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: mesajRengiHex(renk),
                    border: secili ? '3px solid var(--color-primary)' : '2px solid rgba(0,0,0,0.08)',
                    opacity: locked ? 0.5 : 1,
                    transform: secili ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  {locked && <Lock size={12} color="white" />}
                </div>
                <span className="text-[10px]" style={{ color: secili ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {mesajRengiBaslik(renk)}
                </span>
                {secili && !locked && (
                  <div className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}

          {/* Satın alınabilir renkler */}
          {SATIN_AL_RENKLER.map((item) => {
            const previewing = previewRenk?.id === item.id;
            return (
              <button key={item.id} type="button"
                onClick={() => setPreviewRenk(previewing ? null : item)}
                className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95">
                <div className="w-11 h-11 rounded-full shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: item.hex,
                    border: previewing ? `3px solid ${item.hex}` : '2px solid rgba(99,102,241,0.4)',
                    opacity: previewing ? 1 : 0.85,
                    transform: previewing ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: previewing ? `0 0 0 3px white, 0 0 0 5px ${item.hex}66` : 'none',
                  }}
                />
                <span className="text-[10px]" style={{ color: previewing ? item.hex : '#6366f1' }}>{item.label}</span>
                <span className="text-[9px] font-bold" style={{ color: previewing ? item.hex : '#6366f1' }}>{item.fiyat}</span>
                <div className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: previewing ? item.hex : '#6366f1' }}>
                  <ShoppingBag size={8} color="white" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline sohbet balonu önizlemesi */}
      {previewRenk && (
        <SohbetBalonuOnizleme
          item={previewRenk}
          onIptal={() => setPreviewRenk(null)}
          onSatinAl={() => {
            setSatinAlItem({ id: previewRenk.id, label: previewRenk.label, emoji: previewRenk.emoji, fiyat: previewRenk.fiyat, aciklama: previewRenk.aciklama });
            setPreviewRenk(null);
          }}
        />
      )}
    </div>
    </>
  );
}
