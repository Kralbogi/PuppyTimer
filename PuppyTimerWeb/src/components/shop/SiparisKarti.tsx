// =============================================================================
// PawLand - SiparisKarti
// Order card component with collapsible product list
// =============================================================================

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, CheckCircle } from "lucide-react";
import type { Siparis } from "../../types/models";

interface SiparisKartiProps {
  siparis: Siparis;
  onDegerlendir: (urun: { urunId: string; ad: string }) => void;
  yorumYapilanUrunler: Set<string>;
}

const DURUM_BADGE: Record<string, { label: string; className: string; icon: string }> = {
  beklemede: { label: "Beklemede", className: "bg-yellow-100 text-yellow-700", icon: "" },
  onaylandi: { label: "Onaylandı", className: "bg-blue-100 text-blue-700", icon: "" },
  hazirlaniyor: { label: "Hazırlanıyor", className: "bg-purple-100 text-purple-700", icon: "" },
  kargoda: { label: "Kargoda", className: "bg-orange-100 text-orange-700", icon: "" },
  teslim_edildi: { label: "Teslim Edildi", className: "bg-green-100 text-green-700", icon: "" },
};

export default function SiparisKarti({ siparis, onDegerlendir, yorumYapilanUrunler }: SiparisKartiProps) {
  const [genisletildi, setGenisletildi] = useState(false);

  const durumBilgi = DURUM_BADGE[siparis.durum] || DURUM_BADGE.beklemede;
  const tarih = new Date(siparis.olusturmaTarihi).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${durumBilgi.className}`}>
              {durumBilgi.icon} {durumBilgi.label}
            </span>
          </div>
          <span className="text-xs text-gray-500">{tarih}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Sipariş #{siparis.id.slice(0, 8)}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {siparis.urunler.length} ürün
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Toplam</p>
            <p className="text-lg font-bold text-orange-500">
              ₺{siparis.toplamFiyat.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible product list */}
      <div>
        <button
          onClick={() => setGenisletildi(!genisletildi)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Ürünleri Görüntüle</span>
          {genisletildi ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {genisletildi && (
          <div className="px-4 pb-4 space-y-3">
            {siparis.urunler.map((urun) => {
              const yorumYapildi = yorumYapilanUrunler.has(urun.urunId);

              return (
                <div
                  key={urun.urunId}
                  className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Product image */}
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {urun.resimUrl ? (
                      <img
                        src={urun.resimUrl}
                        alt={urun.ad}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl"></span>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {urun.ad}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {urun.adet} adet × ₺{urun.birimFiyat.toFixed(2)}
                    </p>
                  </div>

                  {/* Review button or status */}
                  <div className="flex-shrink-0">
                    {yorumYapildi ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle size={14} />
                        <span>Değerlendirildi</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onDegerlendir({ urunId: urun.urunId, ad: urun.ad })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Star size={14} />
                        Değerlendir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
