// =============================================================================
// PuppyTimer Web - Mesaj Rengi Seçici (Premium Özellik)
// Topluluk chat mesaj rengi seçme
// =============================================================================

import { Crown } from "lucide-react";
import { MesajRengi, mesajRengiBaslik, mesajRengiHex, premiumMesajRenkleri } from "../../types/enums";

interface MessageColorSelectorProps {
  seciliRenk?: MesajRengi;
  onChange: (renk: MesajRengi) => void;
  isPremium: boolean;
}

export default function MessageColorSelector({
  seciliRenk = MesajRengi.Varsayilan,
  onChange,
  isPremium,
}: MessageColorSelectorProps) {
  const handleSelect = (renk: MesajRengi) => {
    if (!isPremium && renk !== MesajRengi.Varsayilan) {
      alert("Premium mesaj renkleri sadece Premium üyeler için! Premium'a geçin.");
      return;
    }

    onChange(renk);
  };

  const allColors = [MesajRengi.Varsayilan, ...premiumMesajRenkleri];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Mesaj Rengi</h3>
        {!isPremium && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <Crown size={12} />
            <span>Premium</span>
          </div>
        )}
      </div>

      {!isPremium && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
          <p className="font-medium">👑 Premium özellik!</p>
          <p className="mt-1">
            Topluluk chat'inde mesajlarınızı renkli göndermek için Premium'a geçin.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {allColors.map((renk) => {
          const renkHex = mesajRengiHex(renk);
          const isPremiumRenk = renk !== MesajRengi.Varsayilan;
          const secili = seciliRenk === renk;

          return (
            <button
              key={renk}
              type="button"
              onClick={() => handleSelect(renk)}
              disabled={!isPremium && isPremiumRenk}
              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                secili
                  ? "border-blue-500 bg-blue-50"
                  : isPremium || !isPremiumRenk
                  ? "border-gray-200 bg-white hover:border-gray-300"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full mb-2 shadow-sm"
                style={{ backgroundColor: renkHex }}
              />
              <div className="text-xs font-medium text-gray-900">
                {mesajRengiBaslik(renk)}
              </div>

              {secili && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {!isPremium && isPremiumRenk && (
                <div className="absolute top-2 right-2">
                  <Crown size={14} className="text-gray-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium">💬 Mesaj Görünümü</p>
        <p className="mt-1">
          Seçtiğiniz renk topluluk chat'inde kullanıcı adınız ve mesajlarınızın rengini belirler.
        </p>
      </div>
    </div>
  );
}
