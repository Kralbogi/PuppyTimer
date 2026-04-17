// =============================================================================
// PawLand - AddZoneModal (Bolge Ekleme Modali)
// Topluluk haritasina yeni tehlikeli/sosyal bolge ekleme
// =============================================================================

import React, { useState } from "react";
import { X, AlertTriangle, Users } from "lucide-react";
import { BolgeTuru, bolgeTuruBaslik } from "../../types/enums";
import { icerikGecerliMi } from "../../utils/validationUtils";

interface AddZoneModalProps {
  enlem: number;
  boylam: number;
  onSave: (data: {
    baslik: string;
    aciklama: string;
    tur: BolgeTuru;
    yaricap: number;
  }) => void;
  onClose: () => void;
}

const AddZoneModal: React.FC<AddZoneModalProps> = ({
  enlem,
  boylam,
  onSave,
  onClose,
}) => {
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tur, setTur] = useState<BolgeTuru>(BolgeTuru.Sosyal);
  const [yaricap, setYaricap] = useState(150);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);

  const handleSave = () => {
    if (!baslik.trim()) return;

    // Validate title
    const baslikValidasyon = icerikGecerliMi(baslik, true);
    if (!baslikValidasyon.gecerli) {
      setHataMesaji(baslikValidasyon.hata!);
      return;
    }

    // Validate description if present
    if (aciklama.trim()) {
      const aciklamaValidasyon = icerikGecerliMi(aciklama, true);
      if (!aciklamaValidasyon.gecerli) {
        setHataMesaji(aciklamaValidasyon.hata!);
        return;
      }
    }

    setHataMesaji(null);
    onSave({
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      tur,
      yaricap,
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Bölge Ekle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Baslik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Bölge adı..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
            />
          </div>

          {/* Tur secici */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bölge Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTur(BolgeTuru.Sosyal)}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                  tur === BolgeTuru.Sosyal
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <Users
                  size={24}
                  className={
                    tur === BolgeTuru.Sosyal
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    tur === BolgeTuru.Sosyal
                      ? "text-green-700"
                      : "text-gray-600"
                  }`}
                >
                  {bolgeTuruBaslik(BolgeTuru.Sosyal)}
                </span>
                <span className="text-xs text-gray-400">
                  Buluşma / Park
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTur(BolgeTuru.Tehlikeli)}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                  tur === BolgeTuru.Tehlikeli
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <AlertTriangle
                  size={24}
                  className={
                    tur === BolgeTuru.Tehlikeli
                      ? "text-red-600"
                      : "text-gray-400"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    tur === BolgeTuru.Tehlikeli
                      ? "text-red-700"
                      : "text-gray-600"
                  }`}
                >
                  {bolgeTuruBaslik(BolgeTuru.Tehlikeli)}
                </span>
                <span className="text-xs text-gray-400">
                  Sokak Köpeği
                </span>
              </button>
            </div>
          </div>

          {/* Yaricap slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Yarıçap: <span className="font-bold">{yaricap}m</span>
            </label>
            <input
              type="range"
              min={50}
              max={500}
              step={25}
              value={yaricap}
              onChange={(e) => setYaricap(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50m</span>
              <span>500m</span>
            </div>
          </div>

          {/* Aciklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Açıklama
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Ek bilgi..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none text-sm"
            />
          </div>

          {/* Koordinat gosterimi */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Enlem:</span> {enlem.toFixed(6)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium">Boylam:</span> {boylam.toFixed(6)}
            </p>
          </div>

          {/* Error message */}
          {hataMesaji && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {hataMesaji}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!baslik.trim()}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddZoneModal;
