// =============================================================================
// PuppyTimer Web - Gider Takibi Sayfası
// Köpek ile ilgili harcamaları takip et
// =============================================================================

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X, Trash2, TrendingUp, Wallet } from "lucide-react";
import { db } from "../db/database";
import { turkceTarih } from "../services/dateUtils";
import type { Gider, GiderKategori } from "../types/models";

const KATEGORI_BILGI: Record<GiderKategori, { label: string; emoji: string; color: string; bg: string }> = {
  veteriner: { label: "Veteriner", emoji: "🏥", color: "text-red-600", bg: "bg-red-50" },
  mama: { label: "Mama", emoji: "🍖", color: "text-orange-600", bg: "bg-orange-50" },
  bakim: { label: "Bakım", emoji: "✨", color: "text-cyan-600", bg: "bg-cyan-50" },
  ilac: { label: "İlaç", emoji: "💊", color: "text-pink-600", bg: "bg-pink-50" },
  oyuncak: { label: "Oyuncak", emoji: "🎾", color: "text-yellow-600", bg: "bg-yellow-50" },
  aksesuar: { label: "Aksesuar", emoji: "👗", color: "text-purple-600", bg: "bg-purple-50" },
  sigorta: { label: "Sigorta", emoji: "🛡️", color: "text-blue-600", bg: "bg-blue-50" },
  egitim: { label: "Eğitim", emoji: "🎓", color: "text-violet-600", bg: "bg-violet-50" },
  diger: { label: "Diğer", emoji: "📦", color: "text-gray-600", bg: "bg-gray-50" },
};

export const GiderTakibiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [showModal, setShowModal] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [tutar, setTutar] = useState("");
  const [kategori, setKategori] = useState<GiderKategori>("diger");
  const [not, setNot] = useState("");
  const [faturali, setFaturali] = useState(false);

  // Giderleri getir (en yeniden en eskiye)
  const giderler = useLiveQuery(
    () =>
      db.giderler
        .where("kopekId")
        .equals(kopekId)
        .reverse()
        .sortBy("tarih"),
    [kopekId]
  );

  // Aylık toplam hesapla
  const aylikIstatistik = React.useMemo(() => {
    if (!giderler) return { buAy: 0, toplamTum: 0 };

    const simdi = new Date();
    const buAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1).getTime();

    let buAy = 0;
    let toplamTum = 0;

    giderler.forEach((g) => {
      toplamTum += g.tutar;
      if (g.tarih >= buAyBaslangic) buAy += g.tutar;
    });

    return { buAy, toplamTum };
  }, [giderler]);

  // Kategoriye göre bu ay harcama
  const kategoriOzeti = React.useMemo(() => {
    if (!giderler) return [];

    const simdi = new Date();
    const buAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1).getTime();

    const ozet: Record<string, number> = {};
    giderler.forEach((g) => {
      if (g.tarih >= buAyBaslangic) {
        ozet[g.kategori] = (ozet[g.kategori] || 0) + g.tutar;
      }
    });

    return Object.entries(ozet)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([kat, toplam]) => ({
        kategori: kat as GiderKategori,
        toplam,
        ...KATEGORI_BILGI[kat as GiderKategori],
      }));
  }, [giderler]);

  // Tarihe göre grupla
  const grupluGiderler = React.useMemo(() => {
    if (!giderler || giderler.length === 0) return [];

    const gruplar = new Map<string, Gider[]>();
    giderler.forEach((g) => {
      const d = new Date(g.tarih);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (!gruplar.has(key)) gruplar.set(key, []);
      gruplar.get(key)!.push(g);
    });

    return Array.from(gruplar.entries()).map(([, items]) => ({
      tarih: items[0].tarih,
      items,
      gunToplam: items.reduce((s, g) => s + g.tutar, 0),
    }));
  }, [giderler]);

  const formTemizle = () => {
    setBaslik("");
    setTutar("");
    setKategori("diger");
    setNot("");
    setFaturali(false);
  };

  const handleKaydet = async () => {
    if (!baslik.trim() || !tutar) return;
    const tutarSayi = parseFloat(tutar.replace(",", "."));
    if (isNaN(tutarSayi) || tutarSayi <= 0) return;

    setKaydediliyor(true);
    try {
      await db.giderler.add({
        kopekId,
        tarih: Date.now(),
        kategori,
        tutar: tutarSayi,
        baslik: baslik.trim(),
        not: not.trim() || undefined,
        faturali,
      });
      setShowModal(false);
      formTemizle();
    } catch (err) {
      console.error("Gider kaydedilemedi:", err);
    } finally {
      setKaydediliyor(false);
    }
  };

  const handleSil = async (gider: Gider) => {
    if (!gider.id) return;
    const ok = window.confirm(`"${gider.baslik}" giderini silmek istiyor musunuz?`);
    if (!ok) return;
    await db.giderler.delete(gider.id);
  };

  const formatTL = (sayi: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(sayi);

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gider Takibi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Köpeğiniz için harcamalar</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 active:scale-95 transition-all"
        >
          <Plus size={22} className="text-white" />
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 shadow">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Bu Ay</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatTL(aylikIstatistik.buAy)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Toplam</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatTL(aylikIstatistik.toplamTum)}</div>
        </div>
      </div>

      {/* Bu ay kategoriler */}
      {kategoriOzeti.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Bu Ay Kategoriler</h3>
          <div className="space-y-2">
            {kategoriOzeti.map(({ kategori: kat, toplam, label, emoji, color, bg }) => {
              const yuzde = aylikIstatistik.buAy > 0 ? (toplam / aylikIstatistik.buAy) * 100 : 0;
              return (
                <div key={kat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`${bg} ${color} text-sm w-6 h-6 rounded-lg flex items-center justify-center`}>
                        {emoji}
                      </span>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatTL(toplam)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${yuzde}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gider Listesi */}
      {grupluGiderler.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz gider yok</h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            + butonuna dokunarak ilk giderinizi kaydedin
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupluGiderler.map(({ tarih, items, gunToplam }) => (
            <div key={tarih}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {turkceTarih(tarih)}
                </span>
                <span className="text-sm font-bold text-gray-700">{formatTL(gunToplam)}</span>
              </div>

              <div className="space-y-2">
                {items.map((gider) => {
                  const bilgi = KATEGORI_BILGI[gider.kategori];
                  return (
                    <div
                      key={gider.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
                    >
                      <div className={`${bilgi.bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                        {bilgi.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {gider.baslik}
                          </h4>
                          {gider.faturali && (
                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Faturalı
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${bilgi.color}`}>{bilgi.label}</span>
                          {gider.not && (
                            <span className="text-xs text-gray-400 truncate">· {gider.not}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-base font-bold text-gray-900">
                          {formatTL(gider.tutar)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSil(gider)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gider Ekleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Gider Ekle</h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); formTemizle(); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Başlık */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="ör. Yıllık aşı, Premium mama..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Tutar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
              <input
                type="number"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Kategori */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(KATEGORI_BILGI) as [GiderKategori, typeof KATEGORI_BILGI[GiderKategori]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setKategori(key)}
                      className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                        kategori === key
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <span className="text-xl">{val.emoji}</span>
                      {val.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Not */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Not <span className="text-gray-400">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Ek bilgi..."
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {/* Faturalı */}
            <div className="flex items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setFaturali(!faturali)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  faturali ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    faturali ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">Faturalı/Makbuzlu gider</span>
            </div>

            <button
              type="button"
              onClick={handleKaydet}
              disabled={kaydediliyor || !baslik.trim() || !tutar}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Gider Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiderTakibiPage;
