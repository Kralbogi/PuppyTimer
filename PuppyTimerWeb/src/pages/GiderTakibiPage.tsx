// =============================================================================
// PawLand - Gider Takibi Sayfası
// Köpek ile ilgili harcamaları takip et
// =============================================================================

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X, Trash2, TrendingUp, Wallet, CalendarDays } from "lucide-react";
import { db } from "../db/database";
import { turkceTarih } from "../services/dateUtils";
import type { Gider, GiderKategori } from "../types/models";

const KATEGORI_BILGI: Record<GiderKategori, { label: string; emoji: string; color: string; bg: string }> = {
  veteriner: { label: "Veteriner", emoji: "", color: "text-red-600", bg: "bg-red-50" },
  mama: { label: "Mama", emoji: "", color: "text-orange-600", bg: "bg-orange-50" },
  bakim: { label: "Bakım", emoji: "", color: "text-cyan-600", bg: "bg-cyan-50" },
  ilac: { label: "İlaç", emoji: "", color: "text-pink-600", bg: "bg-pink-50" },
  oyuncak: { label: "Oyuncak", emoji: "", color: "text-yellow-600", bg: "bg-yellow-50" },
  aksesuar: { label: "Aksesuar", emoji: "", color: "text-purple-600", bg: "bg-purple-50" },
  sigorta: { label: "Sigorta", emoji: "", color: "text-blue-600", bg: "bg-blue-50" },
  egitim: { label: "Eğitim", emoji: "", color: "text-violet-600", bg: "bg-violet-50" },
  diger: { label: "Diğer", emoji: "", color: "text-gray-600", bg: "bg-gray-50" },
};

export const GiderTakibiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [showModal, setShowModal] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Tarih aralığı state
  const [tarihBaslangic, setTarihBaslangic] = useState("");
  const [tarihBitis, setTarihBitis] = useState("");

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

  // Tarih aralığına göre filtrele
  const filtrelenmisGiderler = React.useMemo(() => {
    if (!giderler) return [];
    let sonuc = giderler;

    if (tarihBaslangic) {
      const baslangicMs = new Date(tarihBaslangic).getTime();
      sonuc = sonuc.filter((g) => g.tarih >= baslangicMs);
    }
    if (tarihBitis) {
      const bitisMs = new Date(tarihBitis).getTime() + 24 * 60 * 60 * 1000 - 1;
      sonuc = sonuc.filter((g) => g.tarih <= bitisMs);
    }

    return sonuc;
  }, [giderler, tarihBaslangic, tarihBitis]);

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

  // Filtreli toplam hesapla
  const filtreliToplam = React.useMemo(() => {
    return filtrelenmisGiderler.reduce((s, g) => s + g.tutar, 0);
  }, [filtrelenmisGiderler]);

  // Kategoriye göre harcama (filtreli)
  const kategoriOzeti = React.useMemo(() => {
    if (!filtrelenmisGiderler.length) return [];

    const ozet: Record<string, number> = {};
    filtrelenmisGiderler.forEach((g) => {
      ozet[g.kategori] = (ozet[g.kategori] || 0) + g.tutar;
    });

    return Object.entries(ozet)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([kat, toplam]) => ({
        kategori: kat as GiderKategori,
        toplam,
        ...KATEGORI_BILGI[kat as GiderKategori],
      }));
  }, [filtrelenmisGiderler]);

  // Tarihe göre grupla (filtreli)
  const grupluGiderler = React.useMemo(() => {
    if (!filtrelenmisGiderler.length) return [];

    const gruplar = new Map<string, Gider[]>();
    filtrelenmisGiderler.forEach((g) => {
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
  }, [filtrelenmisGiderler]);

  const tarihFiltreAktif = tarihBaslangic || tarihBitis;

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
    <div className="pb-24 px-4 pt-6" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Gider Takibi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Köpeğiniz için harcamalar</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 smooth-transition"
          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
        >
          <Plus size={22} className="text-white" />
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-orange-400/80 to-orange-500/70 rounded-2xl p-4 shadow">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Bu Ay</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatTL(aylikIstatistik.buAy)}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-4 shadow">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-white/80" />
            <span className="text-xs text-white/80">Toplam</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatTL(aylikIstatistik.toplamTum)}</div>
        </div>
      </div>

      {/* Tarih Aralığı Filtresi */}
      <div className="rounded-2xl p-4 mb-6 border soft-shadow" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tarih Aralığı</h3>
          {tarihFiltreAktif && (
            <button
              type="button"
              onClick={() => { setTarihBaslangic(""); setTarihBitis(""); }}
              className="ml-auto text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Temizle
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Başlangıç</label>
            <input
              type="date"
              value={tarihBaslangic}
              onChange={(e) => setTarihBaslangic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-400"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Bitiş</label>
            <input
              type="date"
              value={tarihBitis}
              onChange={(e) => setTarihBitis(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-400"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>
        {tarihFiltreAktif && (
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Seçilen aralık toplamı</span>
            <span className="text-sm font-bold text-orange-600">{formatTL(filtreliToplam)}</span>
          </div>
        )}
      </div>

      {/* Kategoriler */}
      {kategoriOzeti.length > 0 && (
        <div className="rounded-2xl border p-4 mb-6 soft-shadow" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            {tarihFiltreAktif ? "Seçilen Aralık Kategorileri" : "Bu Ay Kategoriler"}
          </h3>
          <div className="space-y-2">
            {kategoriOzeti.map(({ kategori: kat, toplam, label, emoji, color, bg }) => {
              const referansToplam = tarihFiltreAktif ? filtreliToplam : aylikIstatistik.buAy;
              const yuzde = referansToplam > 0 ? (toplam / referansToplam) * 100 : 0;
              return (
                <div key={kat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`${bg} ${color} text-sm w-6 h-6 rounded-lg flex items-center justify-center`}>
                        {emoji}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatTL(toplam)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
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
          <div className="text-6xl mb-4"></div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            {tarihFiltreAktif ? "Bu aralıkta gider yok" : "Henüz gider yok"}
          </h3>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            {tarihFiltreAktif ? "Farklı bir tarih aralığı seçin" : "+ butonuna dokunarak ilk giderinizi kaydedin"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupluGiderler.map(({ tarih, items, gunToplam }) => (
            <div key={tarih}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {turkceTarih(tarih)}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{formatTL(gunToplam)}</span>
              </div>

              <div className="space-y-2">
                {items.map((gider) => {
                  const bilgi = KATEGORI_BILGI[gider.kategori];
                  return (
                    <div
                      key={gider.id}
                      className="rounded-2xl border p-4 flex items-center gap-3 soft-shadow"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
                    >
                      <div className={`${bilgi.bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                        {bilgi.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
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
                            <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>· {gider.not}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
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
          <div className="rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Gider Ekle</h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); formTemizle(); }}
                className="p-2 rounded-full smooth-transition"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Başlık */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Başlık *</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="ör. Yıllık aşı, Premium mama..."
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Tutar */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tutar (₺) *</label>
              <input
                type="number"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Kategori */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(KATEGORI_BILGI) as [GiderKategori, typeof KATEGORI_BILGI[GiderKategori]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setKategori(key)}
                      className="py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 smooth-transition"
                      style={
                        kategori === key
                          ? { borderColor: 'var(--color-primary)', background: 'rgba(224,122,47,0.08)', color: 'var(--color-primary)' }
                          : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }
                      }
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Not <span style={{ color: 'var(--color-text-muted)' }}>(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Ek bilgi..."
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
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
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>Faturalı/Makbuzlu gider</span>
            </div>

            <button
              type="button"
              onClick={handleKaydet}
              disabled={kaydediliyor || !baslik.trim() || !tutar}
              className="w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 smooth-transition"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
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
