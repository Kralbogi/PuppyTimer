// =============================================================================
// PawLand - Çerçeve Seçici
// Premium / Satın Al modları
// =============================================================================

import { useState } from "react";
import { Crown, Lock, ShoppingBag } from "lucide-react";
import SatinAlModal, { type SatinAlItem } from "./SatinAlModal";
import {
  CerceveTipi,
  cerceveTipiBaslik,
  cerceveTipiEmoji,
  tumCerceveler,
} from "../../types/enums";

const CERCEVE_RING: Record<string, string> = {
  Normal:         '#8a7560',
  KralTaci:       '#FFD700',
  KraliceTaci:    '#FF69B4',
  KirmiziKurdele: '#FF4444',
  Yildiz:         '#FFB300',
  Elmas:          '#B9F2FF',
  Ates:           '#FF4500',
};

type ShopCerceve = { id: string; label: string; emoji: string; ring: string; fiyat: string; aciklama: string };


const SATIN_AL_CERCEVELER: ShopCerceve[] = [
  { id: "galaksi",  label: "Galaksi",   emoji: "🌌", ring: "#7c3aed", fiyat: "₺9,99", aciklama: "Mor galaksi efektli özel çerçeve" },
  { id: "neon",     label: "Neon",      emoji: "⚡", ring: "#22d3ee", fiyat: "₺6,99", aciklama: "Parlayan neon mavi çerçeve" },
  { id: "rainbow",  label: "Gökkuşağı", emoji: "🌈", ring: "#f59e0b", fiyat: "₺4,99", aciklama: "Renkli gökkuşağı çerçevesi" },
  { id: "kar",      label: "Kar Tanesi",emoji: "❄️", ring: "#bae6fd", fiyat: "₺4,99", aciklama: "Buz mavisi kar tanesi çerçevesi" },
];

function CerceveBubble({ emoji, ring, size = 36 }: { emoji: string; ring: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${ring}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, background: `${ring}18`,
    }}>
      {emoji}
    </div>
  );
}

interface FrameSelectorProps {
  seciliCerceve?: CerceveTipi;
  onChange: (cerceve: CerceveTipi) => void;
  isPremium: boolean;
  onPremiumUpsell?: () => void;
}

export default function FrameSelector({
  seciliCerceve = CerceveTipi.Normal,
  onChange,
  isPremium,
  onPremiumUpsell,
}: FrameSelectorProps) {
  const [satinAlItem, setSatinAlItem] = useState<SatinAlItem | null>(null);

  return (
    <>
    {satinAlItem && <SatinAlModal item={satinAlItem} onKapat={() => setSatinAlItem(null)} />}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Harita Çerçevesi</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Topluluk haritasında görünür</p>
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
          {/* Premium çerçeveler */}
          {tumCerceveler.map((cerceve) => {
            const secili = seciliCerceve === cerceve;
            const locked = !isPremium && cerceve !== CerceveTipi.Normal;
            const ring = CERCEVE_RING[cerceve] ?? '#8a7560';
            return (
              <button key={cerceve} type="button"
                onClick={() => {
                  if (locked) { onPremiumUpsell?.(); return; }
                  onChange(cerceve);
                }}
                className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: secili ? 'rgba(224,122,47,0.1)' : 'var(--color-bg-card)',
                    border: `2px solid ${secili ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  {locked
                    ? <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    : <CerceveBubble emoji={cerceveTipiEmoji(cerceve)} ring={ring} size={36} />
                  }
                </div>
                <span className="text-[10px] font-medium text-center" style={{ color: secili ? 'var(--color-primary)' : 'var(--color-text-muted)', maxWidth: 56 }}>
                  {cerceveTipiBaslik(cerceve)}
                </span>
                {secili && !locked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}

          {/* Satın alınabilir çerçeveler */}
          {SATIN_AL_CERCEVELER.map((item) => (
            <button key={item.id} type="button"
              onClick={() => setSatinAlItem({ id: item.id, label: item.label, emoji: item.emoji, fiyat: item.fiyat, aciklama: item.aciklama })}
              className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.06)', border: '2px solid rgba(99,102,241,0.25)' }}>
                <CerceveBubble emoji={item.emoji} ring={item.ring} size={36} />
              </div>
              <span className="text-[10px] font-medium text-center" style={{ color: '#6366f1', maxWidth: 56 }}>
                {item.label}
              </span>
              <span className="text-[9px] font-bold" style={{ color: '#6366f1' }}>{item.fiyat}</span>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#6366f1' }}>
                <ShoppingBag size={9} color="white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
