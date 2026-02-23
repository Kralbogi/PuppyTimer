// =============================================================================
// PuppyTimer Web - Görev Widget
// Harita sayfasında görev takibi ve puan kazanma
// =============================================================================

import { useState, useEffect } from "react";
import { Trophy, Target, ChevronDown, Clock } from "lucide-react";
import {
  aktifGorevleriGetir,
  otomatikGorevleriBaslat,
  yuruyusGorevleriniGuncelle,
  gorevGetir,
} from "../../services/gorevService";
import type { KullaniciGorev } from "../../types/models";

interface GorevWidgetProps {
  kopekId: number;
}

export default function GorevWidget({ kopekId }: GorevWidgetProps) {
  const [acik, setAcik] = useState(false);
  const [aktifGorevler, setAktifGorevler] = useState<KullaniciGorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Görevleri yükle ve otomatik başlat
  const yukle = async () => {
    setYukleniyor(true);
    try {
      // Her Pazartesi otomatik görevleri başlat
      await otomatikGorevleriBaslat(kopekId);

      // Yürüyüş görevlerini güncelle (haftalık mesafe hesapla)
      await yuruyusGorevleriniGuncelle(kopekId);

      const aktif = await aktifGorevleriGetir(kopekId);
      setAktifGorevler(aktif);
    } catch (err) {
      console.error("Görevler yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    yukle();
    // Auto-refresh every 30 seconds
    const interval = setInterval(yukle, 30000);
    return () => clearInterval(interval);
  }, [kopekId]);

  // İlerleme yüzdesi
  const ilerlemYuzdesi = (kullaniciGorev: KullaniciGorev): number => {
    const gorev = gorevGetir(kullaniciGorev.gorevId);
    if (!gorev) return 0;
    return Math.min(100, Math.round((kullaniciGorev.ilerleme / gorev.hedef) * 100));
  };

  // Kalan süre
  const kalanSure = (bitisTarihi: number): string => {
    const kalan = bitisTarihi - Date.now();
    const gunler = Math.floor(kalan / (24 * 60 * 60 * 1000));
    const saatler = Math.floor((kalan % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (gunler > 0) return `${gunler} gün ${saatler} saat`;
    if (saatler > 0) return `${saatler} saat`;
    return "Bitiyor!";
  };

  // Zorluk rengi
  const zorlukRenk = (zorluk: string): string => {
    switch (zorluk) {
      case "kolay":
        return "bg-green-100 text-green-700 border-green-300";
      case "orta":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "zor":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "efsane":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!acik) {
    // Minimized state
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="fixed top-20 right-4 z-[999] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all"
      >
        <Target size={18} />
        <span>Görevler</span>
        {aktifGorevler.length > 0 && (
          <span className="bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {aktifGorevler.length}
          </span>
        )}
      </button>
    );
  }

  // Expanded state
  return (
    <div className="fixed top-20 right-4 z-[999] w-80 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Trophy size={20} />
          <span className="font-bold">Görevler</span>
        </div>
        <button
          type="button"
          onClick={() => setAcik(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {yukleniyor ? (
          <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
        ) : (
          <>
            {/* Aktif Görevler */}
            {aktifGorevler.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Haftalık Görevler ({aktifGorevler.length})
                </h3>
                <div className="space-y-2">
                  {aktifGorevler.map((kullaniciGorev) => {
                    const gorev = gorevGetir(kullaniciGorev.gorevId);
                    if (!gorev) return null;

                    const yuzde = ilerlemYuzdesi(kullaniciGorev);

                    return (
                      <div
                        key={kullaniciGorev.id}
                        className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{gorev.icon}</span>
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {gorev.baslik}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{gorev.aciklama}</p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${zorlukRenk(
                              gorev.zorluk
                            )}`}
                          >
                            {gorev.zorluk}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {Math.round(kullaniciGorev.ilerleme)}m / {gorev.hedef}m
                            </span>
                            <span className="font-semibold text-orange-600">{yuzde}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-500"
                              style={{ width: `${yuzde}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock size={12} />
                            <span>{kalanSure(kullaniciGorev.bitisTarihi)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-600 font-semibold">
                            <Trophy size={12} />
                            <span>+{gorev.puan} puan</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800">
                  <p className="font-medium">📅 Otomatik yenileme</p>
                  <p className="mt-1">Görevler her Pazartesi sabahı otomatik olarak yenilenir.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl">🎉</div>
                <p className="text-sm font-semibold text-gray-900">Tüm görevler tamamlandı!</p>
                <p className="text-xs text-gray-500">Yeni görevler Pazartesi günü başlayacak!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
