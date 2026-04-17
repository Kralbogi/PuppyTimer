// =============================================================================
// PawLand - Çerçeve Seçici
// Premium / Satın Al modları + inline harita önizlemesi
// =============================================================================

import { useState } from "react";
import { Crown, Lock, ShoppingBag, Map, X, ShoppingCart } from "lucide-react";
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

type ShopCerceve = { id: string; label: string; emoji: string; ring: string; fiyat: string; aciklama: string; gradient?: string };

const SATIN_AL_CERCEVELER: ShopCerceve[] = [
  { id: "galaksi",  label: "Galaksi",   emoji: "🌌", ring: "#7c3aed", fiyat: "₺9,99", aciklama: "Mor galaksi efektli özel çerçeve", gradient: "linear-gradient(135deg,#7c3aed,#c026d3)" },
  { id: "neon",     label: "Neon",      emoji: "⚡", ring: "#22d3ee", fiyat: "₺6,99", aciklama: "Parlayan neon mavi çerçeve",       gradient: "linear-gradient(135deg,#22d3ee,#0ea5e9)" },
  { id: "rainbow",  label: "Gökkuşağı", emoji: "🌈", ring: "#f59e0b", fiyat: "₺4,99", aciklama: "Renkli gökkuşağı çerçevesi",      gradient: "linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6)" },
  { id: "kar",      label: "Kar Tanesi",emoji: "❄️", ring: "#bae6fd", fiyat: "₺4,99", aciklama: "Buz mavisi kar tanesi çerçevesi", gradient: "linear-gradient(135deg,#bae6fd,#7dd3fc)" },
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

// Mini harita önizlemesi — küçük map kartı çerçeve rengini gösterir
function HaritaOnizleme({ item, onSatinAl, onIptal }: { item: ShopCerceve; onSatinAl: () => void; onIptal: () => void }) {
  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: `2px solid ${item.ring}`, boxShadow: `0 0 16px ${item.ring}44` }}>
      {/* Mini harita alanı */}
      <div style={{ background: '#e8f5e9', position: 'relative', height: 120, overflow: 'hidden' }}>
        {/* Harita grid arka plan */}
        <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.3 }}>
          {[20,40,60,80,100].map(y => <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#4CAF50" strokeWidth="1"/>)}
          {[10,20,30,40,50,60,70,80,90].map(x => <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#4CAF50" strokeWidth="1"/>)}
        </svg>
        {/* Köpek pin — çerçeve renginde */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `4px solid ${item.ring}`,
            background: `${item.ring}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            boxShadow: `0 0 0 3px white, 0 0 12px ${item.ring}88`,
          }}>
            🐾
          </div>
          <div style={{
            background: item.gradient ?? item.ring,
            color: 'white', fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}>
            {item.label} Çerçevesi
          </div>
        </div>
        {/* Diğer pinler (dekor) */}
        {[[20,30],[75,60],[15,75],[80,25]].map(([l,t],i)=>(
          <div key={i} style={{ position:'absolute', left:`${l}%`, top:`${t}%`, width:24, height:24, borderRadius:'50%', border:'2px solid #8a7560', background:'#8a756018', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🐕</div>
        ))}
        <div style={{ position:'absolute', top:8, left:8, display:'flex', alignItems:'center', gap:4, background:'white', borderRadius:8, padding:'3px 8px', boxShadow:'0 1px 4px rgba(0,0,0,0.1)' }}>
          <Map size={10} color="#666"/>
          <span style={{ fontSize:10, color:'#666', fontWeight:600 }}>Önizleme</span>
        </div>
      </div>
      {/* Satın al bar */}
      <div style={{ background:'white', padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a', margin:0 }}>{item.label} Çerçevesi</p>
          <p style={{ fontSize:11, color:'#666', margin:0 }}>{item.aciklama}</p>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color: item.ring }}>{item.fiyat}</span>
        <button type="button" onClick={onIptal}
          style={{ width:30, height:30, borderRadius:'50%', border:'1px solid #eee', background:'#f5f5f5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={14} color="#666"/>
        </button>
        <button type="button" onClick={onSatinAl}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: item.gradient ?? item.ring, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
          <ShoppingCart size={13}/>Satın Al
        </button>
      </div>
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
  const [previewFrame, setPreviewFrame] = useState<ShopCerceve | null>(null);

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
          {SATIN_AL_CERCEVELER.map((item) => {
            const previewing = previewFrame?.id === item.id;
            return (
              <button key={item.id} type="button"
                onClick={() => setPreviewFrame(previewing ? null : item)}
                className="relative flex flex-col items-center gap-1 flex-shrink-0 smooth-transition active:scale-95"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: previewing ? `${item.ring}18` : 'rgba(99,102,241,0.06)',
                    border: `2px solid ${previewing ? item.ring : 'rgba(99,102,241,0.25)'}`,
                  }}>
                  <CerceveBubble emoji={item.emoji} ring={item.ring} size={36} />
                </div>
                <span className="text-[10px] font-medium text-center" style={{ color: previewing ? item.ring : '#6366f1', maxWidth: 56 }}>
                  {item.label}
                </span>
                <span className="text-[9px] font-bold" style={{ color: previewing ? item.ring : '#6366f1' }}>{item.fiyat}</span>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: previewing ? item.ring : '#6366f1' }}>
                  <ShoppingBag size={9} color="white" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline harita önizlemesi */}
      {previewFrame && (
        <HaritaOnizleme
          item={previewFrame}
          onIptal={() => setPreviewFrame(null)}
          onSatinAl={() => {
            setSatinAlItem({ id: previewFrame.id, label: previewFrame.label, emoji: previewFrame.emoji, fiyat: previewFrame.fiyat, aciklama: previewFrame.aciklama });
            setPreviewFrame(null);
          }}
        />
      )}
    </div>
    </>
  );
}
