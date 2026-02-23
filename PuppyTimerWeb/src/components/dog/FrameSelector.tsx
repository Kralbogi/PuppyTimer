// =============================================================================
// PuppyTimer Web - Çerçeve Seçici (Premium Özellik)
// Harita marker çerçevesi seçme
// =============================================================================

import { Crown } from "lucide-react";
import { CerceveTipi, cerceveTipiBaslik, cerceveTipiEmoji, cerceveTipiAciklama, premiumCerceveler } from "../../types/enums";

interface FrameSelectorProps {
  seciliCerceve?: CerceveTipi;
  onChange: (cerceve: CerceveTipi) => void;
  isPremium: boolean;
}

export default function FrameSelector({
  seciliCerceve = CerceveTipi.Normal,
  onChange,
  isPremium,
}: FrameSelectorProps) {
  const handleSelect = (cerceve: CerceveTipi) => {
    if (!isPremium && cerceve !== CerceveTipi.Normal) {
      alert("Premium çerçeveler sadece Premium üyeler için! Premium'a geçin.");
      return;
    }

    onChange(cerceve);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Harita Çerçevesi</h3>
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
            Harita profilinize özel çerçeveler eklemek için Premium'a geçin.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Normal Çerçeve */}
        <button
          type="button"
          onClick={() => handleSelect(CerceveTipi.Normal)}
          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
            seciliCerceve === CerceveTipi.Normal
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="text-2xl mb-1">{cerceveTipiEmoji(CerceveTipi.Normal)}</div>
          <div className="text-xs font-medium text-gray-900">{cerceveTipiBaslik(CerceveTipi.Normal)}</div>
          <div className="text-[10px] text-gray-500">{cerceveTipiAciklama(CerceveTipi.Normal)}</div>

          {seciliCerceve === CerceveTipi.Normal && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        {/* Premium Çerçeveler */}
        {premiumCerceveler.map((cerceve) => {
          const secili = seciliCerceve === cerceve;

          return (
            <button
              key={cerceve}
              type="button"
              onClick={() => handleSelect(cerceve)}
              disabled={!isPremium}
              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                secili
                  ? "border-orange-500 bg-orange-50"
                  : isPremium
                  ? "border-gray-200 bg-white hover:border-gray-300"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="text-2xl mb-1">{cerceveTipiEmoji(cerceve)}</div>
              <div className="text-xs font-medium text-gray-900">{cerceveTipiBaslik(cerceve)}</div>
              <div className="text-[10px] text-gray-500">{cerceveTipiAciklama(cerceve)}</div>

              {secili && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {!isPremium && (
                <div className="absolute top-2 right-2">
                  <Crown size={14} className="text-gray-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium">🗺️ Harita Gösterimi</p>
        <p className="mt-1">
          Seçtiğiniz çerçeve topluluk haritasında köpeğinizin profil resminin etrafında görünecek.
        </p>
      </div>
    </div>
  );
}
