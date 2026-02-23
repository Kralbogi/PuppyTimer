// =============================================================================
// PuppyTimer Web - KopekYorumPanel
// Topluluk kopegi yorum paneli
// =============================================================================

import { useState } from "react";
import { X, Send, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { useKopekYorumViewModel } from "../../hooks/useKopekYorumViewModel";
import type { ToplulukKopek } from "../../types/models";
import { icerikGecerliMi } from "../../utils/validationUtils";

interface KopekYorumPanelProps {
  kopek: ToplulukKopek;
  onKapat: () => void;
}

// Zaman once formatı (ornek: "5 dakika önce", "2 saat önce")
function zamanOnce(tarih: number): string {
  const fark = Date.now() - tarih;
  const saniye = Math.floor(fark / 1000);
  const dakika = Math.floor(saniye / 60);
  const saat = Math.floor(dakika / 60);
  const gun = Math.floor(saat / 24);

  if (gun > 0) return `${gun} gün önce`;
  if (saat > 0) return `${saat} saat önce`;
  if (dakika > 0) return `${dakika} dakika önce`;
  return "Az önce";
}

export function KopekYorumPanel({ kopek, onKapat }: KopekYorumPanelProps) {
  const {
    yorumlar,
    yukleniyor,
    hata,
    kullaniciId,
    yorumYaz,
    yorumKaldir,
  } = useKopekYorumViewModel(kopek.id);

  const [yeniYorum, setYeniYorum] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [yorumHatasi, setYorumHatasi] = useState<string | null>(null);

  const yorumGonder = async () => {
    if (!yeniYorum.trim() || gonderiliyor) return;

    // Validate comment content
    const validasyon = icerikGecerliMi(yeniYorum, true);
    if (!validasyon.gecerli) {
      setYorumHatasi(validasyon.hata!);
      return;
    }

    setGonderiliyor(true);
    setYorumHatasi(null);
    try {
      await yorumYaz(yeniYorum.trim());
      setYeniYorum("");
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {kopek.kopekAd}
            </h3>
            <p className="text-sm text-gray-500">
              {yorumlar.length} yorum
            </p>
          </div>
        </div>
        <button
          onClick={onKapat}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body - Yorumlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : yorumlar.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Henüz yorum yok</p>
            <p className="text-sm">İlk yorumu siz yapın!</p>
          </div>
        ) : (
          yorumlar.map((yorum) => {
            const benimYorum = yorum.olusturanId === kullaniciId;
            return (
              <div
                key={yorum.id}
                className={`p-3 rounded-lg ${
                  benimYorum ? "bg-orange-50 border border-orange-200" : "bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">
                      {yorum.olusturanAd}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {zamanOnce(yorum.olusturmaTarihi)}
                    </span>
                  </div>
                  {benimYorum && (
                    <button
                      onClick={() => yorumKaldir(yorum.id)}
                      className="p-1 hover:bg-orange-100 rounded transition-colors flex-shrink-0"
                      title="Yorumu sil"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {yorum.icerik}
                </p>
              </div>
            );
          })
        )}

        {hata && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{hata}</p>
          </div>
        )}
      </div>

      {/* Footer - Yorum Yaz */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {yorumHatasi && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {yorumHatasi}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={yeniYorum}
              onChange={(e) => setYeniYorum(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  yorumGonder();
                }
              }}
              placeholder="Yorumunuzu yazın..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              disabled={gonderiliyor}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {yeniYorum.length}/500
            </div>
          </div>
          <button
            onClick={yorumGonder}
            disabled={!yeniYorum.trim() || gonderiliyor}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end flex items-center gap-2"
          >
            {gonderiliyor ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
