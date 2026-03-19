
import { CreditCard, Clock, TrendingUp } from "lucide-react";

const SAGLAYICILAR = [
  {
    ad: "Stripe",
    aciklama: "Uluslararası kredi/banka kartı ödemeleri. API anahtarı ve backend gerektirir.",
    emoji: "",
    renk: "bg-indigo-100",
    metin: "text-indigo-600",
  },
  {
    ad: "iyzico",
    aciklama: "Türkiye'de yaygın kullanılan yerel ödeme çözümü.",
    emoji: "",
    renk: "bg-orange-100",
    metin: "text-orange-600",
  },
];

const PLANLAR = [
  { ad: "Ücretsiz", fiyat: "₺0", ozellikler: ["Temel köpek takibi", "5 harita işareti"] },
  {
    ad: "Premium",
    fiyat: "₺49/ay",
    ozellikler: ["Sınırsız harita işareti", "AI analizi", "Topluluk özellikleri", "Öncelikli destek"],
  },
];

export default function OdemelerTab() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Durum uyarısı */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-2">
        <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 font-medium">
          Ödeme entegrasyonu henüz aktif değil. Bu ekran altyapı planlaması içindir.
        </p>
      </div>

      {/* Ödeme sağlayıcıları */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Ödeme Sağlayıcıları</h2>
            <p className="text-xs text-gray-500">Planlanan entegrasyonlar</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {SAGLAYICILAR.map((s) => (
            <div
              key={s.ad}
              className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.renk}`}
              >
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${s.metin}`}>{s.ad}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.aciklama}</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-200 flex-shrink-0">
                Yakında
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Planlanan abonelik kademeleri */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Abonelik Planları</h2>
            <p className="text-xs text-gray-500">Taslak fiyatlandırma</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {PLANLAR.map((p) => (
            <div
              key={p.ad}
              className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-gray-900 text-sm">{p.ad}</p>
                <span className="text-sm font-bold text-orange-500">{p.fiyat}</span>
              </div>
              <ul className="space-y-1">
                {p.ozellikler.map((o) => (
                  <li key={o} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl px-4 py-3">
        <p className="text-xs text-blue-700">
          Ödeme entegrasyonu hazır olduğunda bu panelden işlem geçmişi, abonelik yönetimi
          ve iade işlemleri yapılabilecektir.
        </p>
      </div>
    </div>
  );
}
