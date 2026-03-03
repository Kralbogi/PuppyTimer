// =============================================================================
// PuppyTimer Web - Randevu Takvimi
// Veteriner / kuaför / kontrol randevusu oluştur ve takip et
// =============================================================================

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X, Check, Trash2, CalendarClock } from "lucide-react";
import { db } from "../db/database";
import type { Randevu, RandevuTuru } from "../types/models";

const TUR_BILGI: Record<RandevuTuru, { label: string; emoji: string; color: string; bg: string }> = {
  veteriner: { label: "Veteriner", emoji: "🏥", color: "text-red-600", bg: "bg-red-50" },
  kuafor: { label: "Kuaför", emoji: "✂️", color: "text-cyan-600", bg: "bg-cyan-50" },
  kontrol: { label: "Kontrol", emoji: "🩺", color: "text-blue-600", bg: "bg-blue-50" },
  diger: { label: "Diğer", emoji: "📅", color: "text-gray-600", bg: "bg-gray-50" },
};

function tarihFormatla(timestamp: number): string {
  const d = new Date(timestamp);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(d);
}

function kalanGunHesapla(timestamp: number, saat: string): { metin: string; acil: boolean } {
  const [h, m] = saat.split(":").map(Number);
  const randevuDate = new Date(timestamp);
  randevuDate.setHours(h, m, 0, 0);

  const simdi = new Date();
  const fark = randevuDate.getTime() - simdi.getTime();

  if (fark < 0) return { metin: "Geçti", acil: false };
  const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
  if (gun === 0) return { metin: "Bugün!", acil: true };
  if (gun === 1) return { metin: "Yarın", acil: true };
  return { metin: `${gun} gün sonra`, acil: false };
}

export const RandevuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [showModal, setShowModal] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [tur, setTur] = useState<RandevuTuru>("veteriner");
  const [tarihStr, setTarihStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
  });
  const [saat, setSaat] = useState("10:00");
  const [not, setNot] = useState("");

  // Tüm randevular (tarihe göre artan)
  const randevular = useLiveQuery(
    () => db.randevular.where("kopekId").equals(kopekId).sortBy("tarih"),
    [kopekId]
  );

  const simdi = Date.now();
  const yaklaşanlar = randevular?.filter((r) => !r.tamamlandi && r.tarih >= simdi - 24 * 60 * 60 * 1000) ?? [];
  const gecmisler = randevular?.filter((r) => r.tamamlandi || r.tarih < simdi - 24 * 60 * 60 * 1000) ?? [];

  const formTemizle = () => {
    setBaslik("");
    setTur("veteriner");
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setTarihStr(d.toISOString().split("T")[0]);
    setSaat("10:00");
    setNot("");
  };

  const handleKaydet = async () => {
    if (!baslik.trim()) return;
    setKaydediliyor(true);
    try {
      const tarihMs = new Date(tarihStr).getTime();
      await db.randevular.add({
        kopekId,
        tarih: tarihMs,
        saat,
        tur,
        baslik: baslik.trim(),
        not: not.trim() || undefined,
        tamamlandi: false,
        olusturmaTarihi: Date.now(),
      });
      setShowModal(false);
      formTemizle();
    } catch (err) {
      console.error("Randevu kaydedilemedi:", err);
    } finally {
      setKaydediliyor(false);
    }
  };

  const handleTamamla = async (r: Randevu) => {
    if (!r.id) return;
    await db.randevular.update(r.id, { tamamlandi: !r.tamamlandi });
  };

  const handleSil = async (r: Randevu) => {
    if (!r.id) return;
    const ok = window.confirm(`"${r.baslik}" randevusunu silmek istiyor musunuz?`);
    if (!ok) return;
    await db.randevular.delete(r.id);
  };

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Randevu Takvimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Veteriner ve kuaför randevuları</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 active:scale-95 transition-all"
        >
          <Plus size={22} className="text-white" />
        </button>
      </div>

      {/* Yaklaşan Randevular */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Yaklaşan ({yaklaşanlar.length})
        </h2>

        {yaklaşanlar.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm text-gray-500">Yaklaşan randevu yok</p>
            <p className="text-xs text-gray-400 mt-1">+ butonuna dokunarak ekleyin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {yaklaşanlar.map((r) => {
              const bilgi = TUR_BILGI[r.tur];
              const kalan = kalanGunHesapla(r.tarih, r.saat);
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-4 ${
                    kalan.acil ? "border-orange-300 shadow-sm" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${bilgi.bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                      {bilgi.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{r.baslik}</h4>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            kalan.acil
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {kalan.metin}
                        </span>
                      </div>
                      <p className={`text-xs ${bilgi.color} mt-0.5`}>{bilgi.label}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CalendarClock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {tarihFormatla(r.tarih)} · {r.saat}
                        </span>
                      </div>
                      {r.not && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{r.not}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => handleTamamla(r)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={13} />
                      Tamamlandı
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSil(r)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Geçmiş Randevular */}
      {gecmisler.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Geçmiş ({gecmisler.length})
          </h2>
          <div className="space-y-2">
            {gecmisler
              .slice()
              .reverse()
              .map((r) => {
                const bilgi = TUR_BILGI[r.tur];
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-60"
                  >
                    <div className={`${bilgi.bg} w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                      {r.tamamlandi ? "✅" : bilgi.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-700 text-sm truncate">{r.baslik}</h4>
                      <p className="text-xs text-gray-400">
                        {tarihFormatla(r.tarih)} · {r.saat}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSil(r)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Randevu Ekleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Randevu Ekle</h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); formTemizle(); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tür */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Randevu Türü</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(TUR_BILGI) as [RandevuTuru, typeof TUR_BILGI[RandevuTuru]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTur(key)}
                      className={`py-2 px-1 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                        tur === key
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <span className="text-xl">{val.emoji}</span>
                      <span className="truncate w-full text-center">{val.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Başlık */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="ör. Yıllık aşı kontrolü, Tırnak bakımı..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Tarih + Saat */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                <input
                  type="date"
                  value={tarihStr}
                  onChange={(e) => setTarihStr(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                <input
                  type="time"
                  value={saat}
                  onChange={(e) => setSaat(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* Not */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Not <span className="text-gray-400">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Veteriner adı, adres, hazırlık bilgisi..."
                maxLength={150}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <button
              type="button"
              onClick={handleKaydet}
              disabled={kaydediliyor || !baslik.trim()}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Randevu Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RandevuPage;
