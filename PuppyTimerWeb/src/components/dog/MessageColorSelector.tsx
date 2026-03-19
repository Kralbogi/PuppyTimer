// =============================================================================
// PawLand - Mesaj Rengi Seçici
// Premium / Satın Al modları
// =============================================================================

import { useState } from "react";
import { Crown, Lock, ShoppingBag } from "lucide-react";
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
          {SATIN_AL_RENKLER.map((item) => (
            <button key={item.id} type="button"
              onClick={() => setSatinAlItem({ id: item.id, label: item.label, emoji: item.emoji, fiyat: item.fiyat, aciklama: item.aciklama })}
              className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95">
              <div className="w-11 h-11 rounded-full shadow-sm"
                style={{ backgroundColor: item.hex, border: '2px solid rgba(99,102,241,0.4)', opacity: 0.85 }} />
              <span className="text-[10px]" style={{ color: '#6366f1' }}>{item.label}</span>
              <span className="text-[9px] font-bold" style={{ color: '#6366f1' }}>{item.fiyat}</span>
              <div className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#6366f1' }}>
                <ShoppingBag size={8} color="white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
