// =============================================================================
// PawLand - MesajPanel
// Private messaging panel for friend-to-friend communication
// =============================================================================

import { useState } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { useMesajViewModel } from "../../hooks/useMesajViewModel";

interface MesajPanelProps {
  konusmaId: string;
  karsiTarafAd: string;
  onKapat: () => void;
}

// Zaman once formatı
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

export function MesajPanel({
  konusmaId,
  karsiTarafAd,
  onKapat,
}: MesajPanelProps) {
  const {
    mesajlar,
    yukleniyor,
    hata,
    kullaniciId,
    mesajGonder,
  } = useMesajViewModel(konusmaId);

  const [yeniMesaj, setYeniMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const mesajGonderHandler = async () => {
    if (!yeniMesaj.trim() || gonderiliyor) return;

    setGonderiliyor(true);
    try {
      await mesajGonder(yeniMesaj.trim());
      setYeniMesaj("");
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {karsiTarafAd}
            </h3>
            <p className="text-sm text-gray-500">Özel Mesajlaşma</p>
          </div>
        </div>
        <button
          onClick={onKapat}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body - Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : mesajlar.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Henüz mesaj yok</p>
            <p className="text-sm">İlk mesajı siz gönderin!</p>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3">
            {mesajlar.map((mesaj) => {
              const benimMesaj = mesaj.gonderenId === kullaniciId;
              return (
                <div
                  key={mesaj.id}
                  className={`flex ${benimMesaj ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      benimMesaj
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    {!benimMesaj && (
                      <span className="text-xs font-medium text-gray-500 block mb-1">
                        {mesaj.gonderenAd}
                      </span>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {mesaj.icerik}
                    </p>
                    <span
                      className={`text-xs mt-1 block ${
                        benimMesaj ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {zamanOnce(mesaj.olusturmaTarihi)}
                      {benimMesaj && mesaj.okundu && " • Okundu"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hata && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{hata}</p>
          </div>
        )}
      </div>

      {/* Footer - Mesaj Yaz */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={yeniMesaj}
              onChange={(e) => setYeniMesaj(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  mesajGonderHandler();
                }
              }}
              placeholder="Mesajınızı yazın..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={gonderiliyor}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {yeniMesaj.length}/500
            </div>
          </div>
          <button
            onClick={mesajGonderHandler}
            disabled={!yeniMesaj.trim() || gonderiliyor}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end flex items-center gap-2"
          >
            {gonderiliyor ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
           Arkadaşlar arasında serbest iletişim - moderasyon yok
        </p>
      </div>
    </div>
  );
}
