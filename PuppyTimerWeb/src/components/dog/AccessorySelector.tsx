// =============================================================================
// PuppyTimer Web - Aksesuar Seçici (Premium Özellik)
// Köpeğe takı ve kıyafet ekleme
// =============================================================================

import { Crown } from "lucide-react";

export type Aksesuar = "hat" | "collar" | "glasses" | "bandana" | "bow" | "scarf";

interface AccessorySelectorProps {
  seciliAksesuarlar: string[];
  onChange: (aksesuarlar: string[]) => void;
  isPremium: boolean;
}

const AKSESUARLAR: { id: Aksesuar; label: string; emoji: string; aciklama: string }[] = [
  { id: "hat", label: "Şapka", emoji: "🎩", aciklama: "Şık bir şapka" },
  { id: "collar", label: "Tasma", emoji: "🎀", aciklama: "Renkli tasma" },
  { id: "glasses", label: "Gözlük", emoji: "🕶️", aciklama: "Havalı gözlük" },
  { id: "bandana", label: "Bandana", emoji: "🧣", aciklama: "Renkli bandana" },
  { id: "bow", label: "Fiyonk", emoji: "🎀", aciklama: "Sevimli fiyonk" },
  { id: "scarf", label: "Atkı", emoji: "🧶", aciklama: "Sıcak atkı" },
];

export default function AccessorySelector({
  seciliAksesuarlar,
  onChange,
  isPremium,
}: AccessorySelectorProps) {
  const handleToggle = (id: string) => {
    if (!isPremium) {
      alert("Aksesuarlar premium özelliğidir. Premium'a geçin!");
      return;
    }

    if (seciliAksesuarlar.includes(id)) {
      onChange(seciliAksesuarlar.filter((a) => a !== id));
    } else {
      onChange([...seciliAksesuarlar, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Aksesuarlar</h3>
        {!isPremium && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <Crown size={12} />
            <span>Premium</span>
          </div>
        )}
      </div>

      {!isPremium && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
          <p className="font-medium">🎨 Premium özellik!</p>
          <p className="mt-1">
            Köpeğinize özel aksesuarlar eklemek için Premium'a geçin.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {AKSESUARLAR.map((aksesuar) => {
          const secili = seciliAksesuarlar.includes(aksesuar.id);

          return (
            <button
              key={aksesuar.id}
              type="button"
              onClick={() => handleToggle(aksesuar.id)}
              disabled={!isPremium}
              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                secili
                  ? "border-orange-500 bg-orange-50"
                  : isPremium
                  ? "border-gray-200 bg-white hover:border-gray-300"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="text-2xl mb-1">{aksesuar.emoji}</div>
              <div className="text-xs font-medium text-gray-900">{aksesuar.label}</div>
              <div className="text-[10px] text-gray-500">{aksesuar.aciklama}</div>

              {secili && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium">🚧 Geliştirme Aşamasında</p>
        <p className="mt-1">
          Aksesuarlar kaydediliyor ancak 3D gösterimi yakında eklenecek!
        </p>
      </div>
    </div>
  );
}
