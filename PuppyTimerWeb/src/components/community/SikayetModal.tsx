// =============================================================================
// PawLand - Şikayet Modal
// Report user modal with category selection
// =============================================================================

import { useState } from "react";
import { X, AlertTriangle, Flag, Loader2 } from "lucide-react";
import type { SikayetKategorisi } from "../../types/models";

interface SikayetModalProps {
  kullaniciAd: string;
  kullaniciId: string;
  kopekId: string;
  onGonder: (kategori: SikayetKategorisi, aciklama?: string) => Promise<void>;
  onKapat: () => void;
}

const SIKAYET_KATEGORILERI: {
  id: SikayetKategorisi;
  baslik: string;
  aciklama: string;
  emoji: string;
}[] = [
  {
    id: "hakaret",
    baslik: "Hakaret / Küfür",
    aciklama: "Küfür, hakaret veya saldırgan dil kullanımı",
    emoji: "",
  },
  {
    id: "spam",
    baslik: "Spam",
    aciklama: "Gereksiz tekrarlayan içerik veya reklam",
    emoji: "",
  },
  {
    id: "uygunsuz_gorsel",
    baslik: "Uygunsuz Görsel",
    aciklama: "Rahatsız edici, müstehcen veya uygunsuz fotoğraf",
    emoji: "",
  },
  {
    id: "rahatsizlik",
    baslik: "Rahatsız Edici İçerik",
    aciklama: "Taciz, tehdit veya rahatsız edici davranış",
    emoji: "",
  },
];

export function SikayetModal({
  kullaniciAd,
  onGonder,
  onKapat,
}: SikayetModalProps) {
  const [secilenKategori, setSecilenKategori] = useState<SikayetKategorisi | null>(null);
  const [aciklama, setAciklama] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleGonder = async () => {
    if (!secilenKategori) {
      setHata("Lütfen bir kategori seçin");
      return;
    }

    setGonderiliyor(true);
    setHata(null);

    try {
      await onGonder(secilenKategori, aciklama.trim() || undefined);
      onKapat();
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : "Şikayet gönderilemedi";
      setHata(mesaj);
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-red-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Flag size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Şikayet Et</h2>
              <p className="text-xs text-gray-600">{kullaniciAd}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onKapat}
            className="p-1 text-gray-400 hover:text-gray-600"
            disabled={gonderiliyor}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-5">
          {/* Uyarı */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Şikayetler ciddi bir şekilde değerlendirilir. Yanlış veya kötü niyetli şikayetler
              kendi hesabınızı riske atabilir.
            </p>
          </div>

          {/* Kategori Seçimi */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Şikayet Kategorisi
            </label>
            {SIKAYET_KATEGORILERI.map((kategori) => (
              <button
                key={kategori.id}
                onClick={() => setSecilenKategori(kategori.id)}
                disabled={gonderiliyor}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  secilenKategori === kategori.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{kategori.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{kategori.baslik}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{kategori.aciklama}</p>
                  </div>
                  {secilenKategori === kategori.id && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Açıklama (Opsiyonel) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Açıklama <span className="text-gray-400 font-normal">(Opsiyonel)</span>
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value.slice(0, 200))}
              placeholder="Şikayetinizle ilgili ek bilgi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              rows={3}
              maxLength={200}
              disabled={gonderiliyor}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{aciklama.length}/200</div>
          </div>

          {/* Hata Mesajı */}
          {hata && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600">{hata}</p>
            </div>
          )}

          {/* Ceza Bilgisi */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">Ceza Sistemi:</p>
            <ul className="space-y-0.5 ml-4 list-disc">
              <li>10 hakaret şikayeti → Sohbetten engellenir</li>
              <li>10 uygunsuz görsel → Fotoğraf kaldırılır</li>
              <li>25+ toplam şikayet → Topluluktan engellenir</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
          <button
            onClick={onKapat}
            disabled={gonderiliyor}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleGonder}
            disabled={!secilenKategori || gonderiliyor}
            className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {gonderiliyor ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Flag size={16} />
                Şikayet Gönder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
