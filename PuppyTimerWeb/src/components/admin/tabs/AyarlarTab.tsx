// =============================================================================
// PawLand - Admin Ayarlar Tab
// Manage profanity filter and other settings
// =============================================================================

import { useState, useEffect } from "react";
import { Save, Plus, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { loadHakaretListesi, saveHakaretListesi } from "../../../services/toplulukChatService";

export default function AyarlarTab() {
  const [kelimeler, setKelimeler] = useState<string[]>([]);
  const [yeniKelime, setYeniKelime] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durum, setDurum] = useState<{
    tip: "success" | "error" | null;
    mesaj: string;
  }>({ tip: null, mesaj: "" });

  // Load profanity list on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setYukleniyor(true);
    try {
      const liste = await loadHakaretListesi();
      setKelimeler(liste);
    } catch (error) {
      setDurum({
        tip: "error",
        mesaj: "Veriler yüklenemedi",
      });
    } finally {
      setYukleniyor(false);
    }
  };

  const handleEkle = () => {
    const temiz = yeniKelime.toLowerCase().trim();
    if (!temiz) return;

    if (kelimeler.includes(temiz)) {
      setDurum({
        tip: "error",
        mesaj: "Bu kelime zaten listede",
      });
      return;
    }

    setKelimeler([...kelimeler, temiz]);
    setYeniKelime("");
    setDurum({ tip: null, mesaj: "" });
  };

  const handleSil = (kelime: string) => {
    setKelimeler(kelimeler.filter((k) => k !== kelime));
  };

  const handleKaydet = async () => {
    setKaydediliyor(true);
    setDurum({ tip: null, mesaj: "" });

    try {
      await saveHakaretListesi(kelimeler);
      setDurum({
        tip: "success",
        mesaj: "Yasaklı kelimeler kaydedildi",
      });
    } catch (error) {
      setDurum({
        tip: "error",
        mesaj: error instanceof Error ? error.message : "Kaydetme başarısız",
      });
    } finally {
      setKaydediliyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Yasaklı Kelimeler
        </h2>
        <p className="text-sm text-gray-500">
          Topluluk chat'inde yasaklı olan kelimeleri yönetin
        </p>
      </div>

      {/* Status Message */}
      {durum.tip && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${
            durum.tip === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {durum.tip === "success" ? (
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              durum.tip === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {durum.mesaj}
          </p>
        </div>
      )}

      {/* Add New Word */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Yeni Kelime Ekle</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={yeniKelime}
            onChange={(e) => setYeniKelime(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleEkle()}
            placeholder="Yasaklı kelime..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
          <button
            onClick={handleEkle}
            disabled={!yeniKelime.trim()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Ekle
          </button>
        </div>
      </div>

      {/* Word List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">
            Kelime Listesi ({kelimeler.length})
          </h3>
          <button
            onClick={handleKaydet}
            disabled={kaydediliyor}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
          >
            {kaydediliyor ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Kaydet
          </button>
        </div>

        {kelimeler.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Henüz yasaklı kelime yok
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {kelimeler.sort().map((kelime) => (
              <div
                key={kelime}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm text-gray-900 truncate">{kelime}</span>
                <button
                  onClick={() => handleSil(kelime)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">Bilgi</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Kelimeler otomatik olarak küçük harfe çevrilir</li>
          <li>• Word boundary kontrolü yapılır (false positive önlenir)</li>
          <li>• Değişiklikler 5 dakika cache'lenir (performans)</li>
          <li>• "selam" gibi kelimeler "am" içerdiği için ENGELLENMEZç</li>
        </ul>
      </div>
    </div>
  );
}
