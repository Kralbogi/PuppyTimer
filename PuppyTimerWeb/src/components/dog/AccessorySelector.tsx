// =============================================================================
// PawLand - Aksesuar Seçici
// Ücretsiz / Premium / Satın Al modları
// =============================================================================

import { useState } from "react";
import { Crown, Lock, ShoppingBag } from "lucide-react";
import SatinAlModal, { type SatinAlItem } from "./SatinAlModal";

export type Aksesuar = "hat" | "collar" | "glasses" | "bandana" | "bow" | "scarf";

type ItemTip = "free" | "premium" | "satin_al";

interface AksesuarItem {
  id: string;
  label: string;
  emoji: string;
  tip: ItemTip;
  fiyat?: string;
}

const AKSESUARLAR: AksesuarItem[] = [
  { id: "hat",       label: "Şapka",     emoji: "🎩",  tip: "premium" },
  { id: "collar",    label: "Tasma",     emoji: "📿",  tip: "premium" },
  { id: "glasses",   label: "Gözlük",    emoji: "🕶️",  tip: "premium" },
  { id: "bandana",   label: "Bandana",   emoji: "🧣",  tip: "premium" },
  { id: "bow",       label: "Fiyonk",    emoji: "🎀",  tip: "premium" },
  { id: "scarf",     label: "Atkı",      emoji: "🧤",  tip: "premium" },
  // Satın alınabilir özel itemlar
  { id: "crown",     label: "Taç",       emoji: "👑",  tip: "satin_al", fiyat: "₺9,99" },
  { id: "wings",     label: "Kanatlar",  emoji: "🦋",  tip: "satin_al", fiyat: "₺6,99" },
  { id: "cape",      label: "Pelerin",   emoji: "🦸",  tip: "satin_al", fiyat: "₺6,99" },
  { id: "star_bow",  label: "Yıldız",    emoji: "⭐",  tip: "satin_al", fiyat: "₺4,99" },
];

const ACIKLAMALAR: Record<string, string> = {
  crown:    "Altın taç ile köpeğini kraliyet havasında göster",
  wings:    "Kelebek kanatları ile köpeğini benzersiz kıl",
  cape:     "Süper kahraman peleriniyle fark yarat",
  star_bow: "Parlayan yıldız aksesuarı ile öne çık",
};

interface AccessorySelectorProps {
  seciliAksesuarlar: string[];
  onChange: (aksesuarlar: string[]) => void;
  isPremium: boolean;
  onPremiumUpsell?: () => void;
}

export default function AccessorySelector({
  seciliAksesuarlar,
  onChange,
  isPremium,
  onPremiumUpsell,
}: AccessorySelectorProps) {
  const [satinAlItem, setSatinAlItem] = useState<SatinAlItem | null>(null);

  const handleToggle = (item: AksesuarItem) => {
    if (item.tip === "satin_al") {
      setSatinAlItem({
        id: item.id,
        label: item.label,
        emoji: item.emoji,
        fiyat: item.fiyat!,
        aciklama: ACIKLAMALAR[item.id],
      });
      return;
    }
    if (item.tip === "premium" && !isPremium) {
      onPremiumUpsell?.();
      return;
    }
    const id = item.id;
    if (seciliAksesuarlar.includes(id)) {
      onChange(seciliAksesuarlar.filter((a) => a !== id));
    } else {
      onChange([...seciliAksesuarlar, id]);
    }
  };

  return (
    <>
    {satinAlItem && (
      <SatinAlModal item={satinAlItem} onKapat={() => setSatinAlItem(null)} />
    )}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Aksesuarlar</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>3D modelde görünür</p>
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
        <div className="flex gap-2 min-w-max">
          {AKSESUARLAR.map((item) => {
            const secili = seciliAksesuarlar.includes(item.id);
            const locked = item.tip === "premium" && !isPremium;
            const satin_al = item.tip === "satin_al";

            return (
              <button key={item.id} type="button"
                onClick={() => handleToggle(item)}
                className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    background: secili ? 'rgba(224,122,47,0.12)' : satin_al ? 'rgba(99,102,241,0.06)' : locked ? 'rgba(0,0,0,0.03)' : 'var(--color-bg-card)',
                    border: `2px solid ${secili ? 'var(--color-primary)' : satin_al ? 'rgba(99,102,241,0.3)' : 'var(--color-border-light)'}`,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  {locked ? <Lock size={16} style={{ color: 'var(--color-text-muted)' }} /> : item.emoji}
                </div>
                <span className="text-[10px] font-medium" style={{ color: secili ? 'var(--color-primary)' : satin_al ? '#6366f1' : 'var(--color-text-muted)' }}>
                  {item.label}
                </span>
                {satin_al && (
                  <span className="text-[9px] font-bold" style={{ color: '#6366f1' }}>{item.fiyat}</span>
                )}
                {satin_al && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#6366f1' }}>
                    <ShoppingBag size={9} color="white" />
                  </div>
                )}
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
        </div>
      </div>
    </div>
    </>
  );
}
