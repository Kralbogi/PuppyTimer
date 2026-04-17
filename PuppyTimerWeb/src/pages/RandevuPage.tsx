// =============================================================================
// PawLand - Randevu Takvimi (Birleşik)
// Bakım takibi + Veteriner/kuaför randevuları tek sayfada
// =============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus, X, Check, Trash2, CalendarClock, CalendarDays,
  Scissors, Bath, Activity, Sparkles, TrendingUp, DollarSign, Calendar,
} from "lucide-react";
import { db } from "../db/database";
import type { Randevu, RandevuTuru, BakimKaydi, BakimTuru } from "../types/models";
import {
  bakimKaydiEkle,
  kopekBakimKayitlariGetir,
  sonrakiBakimOneri,
  bakimIstatistikleri,
  yakindaBakimGerekenler,
  bakimKaydiSil,
} from "../services/bakimService";
import { bakimBasariKontrol } from "../services/basariService";
import { turkceTarihSaat, turkceTarih } from "../services/dateUtils";

// =============================================================================
// Randevu Türleri (Kontrol kaldırıldı)
// =============================================================================

const TUR_BILGI: Record<RandevuTuru, { label: string; emoji: string; color: string; bg: string }> = {
  veteriner: { label: "Veteriner", emoji: "", color: "text-red-600", bg: "bg-red-50" },
  kuafor: { label: "Kuaför", emoji: "", color: "text-cyan-600", bg: "bg-cyan-50" },
  bakim: { label: "Bakım", emoji: "", color: "text-purple-600", bg: "bg-purple-50" },
  diger: { label: "Diğer", emoji: "", color: "text-gray-600", bg: "bg-gray-50" },
};

// =============================================================================
// Bakım Türleri
// =============================================================================

const BAKIM_TURLERI: Array<{
  tur: BakimTuru;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  aciklama: string;
}> = [
  { tur: "banyo", label: "Banyo", icon: Bath, color: "text-blue-600", bgColor: "bg-blue-50", aciklama: "Her 30 günde bir önerilir" },
  { tur: "tirnak", label: "Tırnak Kesimi", icon: Scissors, color: "text-orange-600", bgColor: "bg-orange-50", aciklama: "Her 21 günde bir önerilir" },
  { tur: "tras", label: "Tüy Traşı", icon: Sparkles, color: "text-purple-600", bgColor: "bg-purple-50", aciklama: "Her 60 günde bir önerilir" },
  { tur: "dis", label: "Diş Temizliği", icon: Activity, color: "text-green-600", bgColor: "bg-green-50", aciklama: "Haftada 1 kez önerilir" },
];

// =============================================================================
// Yardımcı Fonksiyonlar
// =============================================================================

function tarihFormatla(timestamp: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric", month: "long", year: "numeric", weekday: "long",
  }).format(new Date(timestamp));
}

function kalanGunHesapla(timestamp: number, saat: string): { metin: string; acil: boolean } {
  const [h, m] = saat.split(":").map(Number);
  const randevuDate = new Date(timestamp);
  randevuDate.setHours(h, m, 0, 0);
  const fark = randevuDate.getTime() - Date.now();
  if (fark < 0) return { metin: "Geçti", acil: false };
  const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
  if (gun === 0) return { metin: "Bugün!", acil: true };
  if (gun === 1) return { metin: "Yarın", acil: true };
  return { metin: `${gun} gün sonra`, acil: false };
}

// =============================================================================
// Ana Bileşen
// =============================================================================

export const RandevuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  // Tab state: "randevular" | "bakim"
  const [aktifSekme, setAktifSekme] = useState<"randevular" | "bakim">("randevular");

  // ---- Randevu State ----
  const [showRandevuModal, setShowRandevuModal] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [baslik, setBaslik] = useState("");
  const [tur, setTur] = useState<RandevuTuru>("veteriner");
  const [tarihStr, setTarihStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [saat, setSaat] = useState("10:00");
  const [randevuNot, setRandevuNot] = useState("");

  // ---- Bakım State ----
  const [showBakimModal, setShowBakimModal] = useState(false);
  const [secilenBakimTur, setSecilenBakimTur] = useState<BakimTuru>("banyo");
  const [profesyonel, setProfesyonel] = useState(false);
  const [bakimMaliyet, setBakimMaliyet] = useState("");
  const [bakimNot, setBakimNot] = useState("");
  const [bakimKayitlar, setBakimKayitlar] = useState<BakimKaydi[]>([]);
  const [yakindakiler, setYakindakiler] = useState<BakimKaydi[]>([]);
  const [bakimIstat, setBakimIstat] = useState<any>(null);

  // ---- Bakım Tarih Aralığı ----
  const [bakimTarihBaslangic, setBakimTarihBaslangic] = useState("");
  const [bakimTarihBitis, setBakimTarihBitis] = useState("");

  // ---- Randevu Verileri ----
  const randevular = useLiveQuery(
    () => db.randevular.where("kopekId").equals(kopekId).sortBy("tarih"),
    [kopekId]
  );

  const simdi = Date.now();
  const yaklasanRandevular = randevular?.filter((r) => !r.tamamlandi && r.tarih >= simdi - 24 * 60 * 60 * 1000) ?? [];
  const gecmisRandevular = randevular?.filter((r) => r.tamamlandi || r.tarih < simdi - 24 * 60 * 60 * 1000) ?? [];

  // ---- Bakım Verileri ----
  useEffect(() => {
    bakimYukle();
  }, [kopekId]);

  const bakimYukle = async () => {
    if (!kopekId) return;
    const data = await kopekBakimKayitlariGetir(kopekId);
    setBakimKayitlar(data);
    const yakindaki = await yakindaBakimGerekenler(kopekId);
    setYakindakiler(yakindaki);
    const stats = await bakimIstatistikleri(kopekId);
    setBakimIstat(stats);
  };

  // Bakım kayıtlarını tarih aralığına göre filtrele
  const filtreliBakimKayitlar = useMemo(() => {
    let sonuc = bakimKayitlar;
    if (bakimTarihBaslangic) {
      const baslangicMs = new Date(bakimTarihBaslangic).getTime();
      sonuc = sonuc.filter((k) => k.tarih >= baslangicMs);
    }
    if (bakimTarihBitis) {
      const bitisMs = new Date(bakimTarihBitis).getTime() + 24 * 60 * 60 * 1000 - 1;
      sonuc = sonuc.filter((k) => k.tarih <= bitisMs);
    }
    return sonuc;
  }, [bakimKayitlar, bakimTarihBaslangic, bakimTarihBitis]);

  const bakimTarihFiltreAktif = bakimTarihBaslangic || bakimTarihBitis;

  // ---- Randevu Handlers ----
  const randevuFormTemizle = () => {
    setBaslik("");
    setTur("veteriner");
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setTarihStr(d.toISOString().split("T")[0]);
    setSaat("10:00");
    setRandevuNot("");
  };

  const handleRandevuKaydet = async () => {
    if (!baslik.trim()) return;
    setKaydediliyor(true);
    try {
      await db.randevular.add({
        kopekId,
        tarih: new Date(tarihStr).getTime(),
        saat,
        tur,
        baslik: baslik.trim(),
        not: randevuNot.trim() || undefined,
        tamamlandi: false,
        olusturmaTarihi: Date.now(),
      });
      setShowRandevuModal(false);
      randevuFormTemizle();
    } catch (err) {
      console.error("Randevu kaydedilemedi:", err);
    } finally {
      setKaydediliyor(false);
    }
  };

  const handleRandevuTamamla = async (r: Randevu) => {
    if (!r.id) return;
    await db.randevular.update(r.id, { tamamlandi: !r.tamamlandi });
  };

  const handleRandevuSil = async (r: Randevu) => {
    if (!r.id) return;
    if (!window.confirm(`"${r.baslik}" randevusunu silmek istiyor musunuz?`)) return;
    await db.randevular.delete(r.id);
  };

  // ---- Bakım Handlers ----
  const handleBakimEkle = async () => {
    if (!kopekId) return;
    await bakimKaydiEkle({
      kopekId,
      bakimTuru: secilenBakimTur,
      tarih: Date.now(),
      sonrakiTarih: sonrakiBakimOneri(secilenBakimTur),
      profesyonel,
      maliyet: bakimMaliyet ? parseFloat(bakimMaliyet) : undefined,
      not: bakimNot || undefined,
    });
    await bakimBasariKontrol(kopekId);
    await bakimYukle();
    setShowBakimModal(false);
    setProfesyonel(false);
    setBakimMaliyet("");
    setBakimNot("");
  };

  const handleBakimSil = async (kayitId: number) => {
    if (!confirm("Bu bakım kaydını silmek istediğinizden emin misiniz?")) return;
    await bakimKaydiSil(kayitId);
    await bakimYukle();
  };

  const getTurBilgi = (tur: BakimTuru) => BAKIM_TURLERI.find((t) => t.tur === tur)!;

  return (
    <div className="pb-24 px-4 pt-6" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Randevu Takvimi</h1>
        <button
          type="button"
          onClick={() => aktifSekme === "randevular" ? setShowRandevuModal(true) : setShowBakimModal(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 smooth-transition"
          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
        >
          <Plus size={22} className="text-white" />
        </button>
      </div>

      {/* Sekme Seçici */}
      <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-border-light)' }}>
        <button
          type="button"
          onClick={() => setAktifSekme("randevular")}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium smooth-transition"
          style={
            aktifSekme === "randevular"
              ? { background: 'var(--color-bg-card)', color: 'var(--color-text)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: 'var(--color-text-muted)' }
          }
        >
          Randevular
        </button>
        <button
          type="button"
          onClick={() => setAktifSekme("bakim")}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium smooth-transition"
          style={
            aktifSekme === "bakim"
              ? { background: 'var(--color-bg-card)', color: 'var(--color-text)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: 'var(--color-text-muted)' }
          }
        >
          Bakım
        </button>
      </div>

      {/* ================================================================ */}
      {/* RANDEVULAR SEKMESİ */}
      {/* ================================================================ */}
      {aktifSekme === "randevular" && (
        <>
          {/* Yaklaşan Randevular */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Yaklaşan ({yaklasanRandevular.length})
            </h2>
            {yaklasanRandevular.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
                <div className="text-4xl mb-2"></div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Yaklaşan randevu yok</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>+ butonuna dokunarak ekleyin</p>
              </div>
            ) : (
              <div className="space-y-3">
                {yaklasanRandevular.map((r) => {
                  const bilgi = TUR_BILGI[r.tur] || TUR_BILGI.diger;
                  const kalan = kalanGunHesapla(r.tarih, r.saat);
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border p-4 soft-shadow"
                      style={{
                        background: 'var(--color-bg-card)',
                        borderColor: kalan.acil ? '#f5a76b' : 'var(--color-border-light)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${bilgi.bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{bilgi.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.baslik}</h4>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={
                                kalan.acil
                                  ? { background: 'rgba(224,122,47,0.12)', color: 'var(--color-primary)' }
                                  : { background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }
                              }
                            >
                              {kalan.metin}
                            </span>
                          </div>
                          <p className={`text-xs ${bilgi.color} mt-0.5`}>{bilgi.label}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <CalendarClock size={12} style={{ color: 'var(--color-text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tarihFormatla(r.tarih)} · {r.saat}</span>
                          </div>
                          {r.not && <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>{r.not}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                        <button type="button" onClick={() => handleRandevuTamamla(r)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Check size={13} /> Tamamlandı
                        </button>
                        <button type="button" onClick={() => handleRandevuSil(r)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} /> Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Geçmiş Randevular */}
          {gecmisRandevular.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>Geçmiş ({gecmisRandevular.length})</h2>
              <div className="space-y-2">
                {gecmisRandevular.slice().reverse().map((r) => {
                  const bilgi = TUR_BILGI[r.tur] || TUR_BILGI.diger;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border p-4 flex items-center gap-3 opacity-60"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
                    >
                      <div className={`${bilgi.bg} w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{r.tamamlandi ? "" : bilgi.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{r.baslik}</h4>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tarihFormatla(r.tarih)} · {r.saat}</p>
                      </div>
                      <button type="button" onClick={() => handleRandevuSil(r)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* BAKIM SEKMESİ */}
      {/* ================================================================ */}
      {aktifSekme === "bakim" && (
        <>
          {/* Yaklaşan bakımlar */}
          {yakindakiler.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-orange-600" />
                <h3 className="font-semibold text-orange-900">Yaklaşan Bakımlar</h3>
              </div>
              {yakindakiler.map((kayit) => {
                const turBilgi = getTurBilgi(kayit.bakimTuru);
                const Icon = turBilgi.icon;
                return (
                  <div key={kayit.id} className="flex items-center gap-3 mt-2">
                    <Icon size={16} className={turBilgi.color} />
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>{turBilgi.label} - {turkceTarih(kayit.sonrakiTarih!)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* İstatistikler */}
          {bakimIstat && (
            <div className="rounded-2xl border p-4 mb-4 soft-shadow" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-indigo-600" />
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>İstatistikler</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{bakimIstat.toplamKayit}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Toplam Bakım</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{bakimIstat.profesyonelSayisi}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Profesyonel</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{bakimIstat.evdeSayisi}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Evde Yapılan</div>
                </div>
                <div className="rounded-xl p-3 flex items-center gap-1" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                  <DollarSign size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{bakimIstat.toplamMaliyet}₺</div>
                </div>
              </div>
            </div>
          )}

          {/* Tarih Aralığı Filtresi */}
          <div className="rounded-2xl border p-4 mb-4 soft-shadow" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} className="text-purple-500" />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tarih Aralığı</h3>
              {bakimTarihFiltreAktif && (
                <button type="button" onClick={() => { setBakimTarihBaslangic(""); setBakimTarihBitis(""); }} className="ml-auto text-xs text-purple-500 hover:text-purple-600 font-medium">Temizle</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Başlangıç</label>
                <input
                  type="date"
                  value={bakimTarihBaslangic}
                  onChange={(e) => setBakimTarihBaslangic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Bitiş</label>
                <input
                  type="date"
                  value={bakimTarihBitis}
                  onChange={(e) => setBakimTarihBitis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
          </div>

          {/* Bakım türleri - Hızlı ekleme */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {BAKIM_TURLERI.map((bt) => {
              const Icon = bt.icon;
              const sayi = bakimIstat?.turlereSayilar[bt.tur] || 0;
              return (
                <button
                  key={bt.tur}
                  onClick={() => { setSecilenBakimTur(bt.tur); setShowBakimModal(true); }}
                  className={`${bt.bgColor} rounded-2xl p-4 text-left smooth-transition hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={24} className={bt.color} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>{sayi}×</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{bt.label}</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{bt.aciklama}</p>
                </button>
              );
            })}
          </div>

          {/* Geçmiş bakım kayıtları */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Geçmiş Kayıtlar</h3>
            {filtreliBakimKayitlar.length === 0 ? (
              <div className="text-center py-12">
                <Scissors size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <p style={{ color: 'var(--color-text-muted)' }}>{bakimTarihFiltreAktif ? "Bu aralıkta bakım kaydı yok" : "Henüz bakım kaydı yok"}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>{bakimTarihFiltreAktif ? "Farklı bir tarih aralığı seçin" : "Yukarıdaki butonlardan ekleyin"}</p>
              </div>
            ) : (
              filtreliBakimKayitlar.map((kayit) => {
                const turBilgi = getTurBilgi(kayit.bakimTuru);
                const Icon = turBilgi.icon;
                return (
                  <div key={kayit.id} className="rounded-2xl border p-4 soft-shadow" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`${turBilgi.bgColor} w-10 h-10 rounded-full flex items-center justify-center`}>
                          <Icon size={18} className={turBilgi.color} />
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{turBilgi.label}</h4>
                          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{turkceTarihSaat(kayit.tarih)}</p>
                          {kayit.profesyonel && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Profesyonel</span>
                          )}
                          {kayit.maliyet && <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Maliyet: {kayit.maliyet}₺</p>}
                          {kayit.not && <p className="text-sm mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>"{kayit.not}"</p>}
                          {kayit.sonrakiTarih && <p className="text-xs mt-2 text-orange-600">Sonraki: {turkceTarih(kayit.sonrakiTarih)}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleBakimSil(kayit.id!)} className="text-red-500 hover:text-red-700 text-sm">Sil</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* RANDEVU EKLEME MODALI */}
      {/* ================================================================ */}
      {showRandevuModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Randevu Ekle</h3>
              <button
                type="button"
                onClick={() => { setShowRandevuModal(false); randevuFormTemizle(); }}
                className="p-2 rounded-full smooth-transition"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Randevu Türü</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(TUR_BILGI) as [RandevuTuru, typeof TUR_BILGI[RandevuTuru]][]).map(([key, val]) => (
                  <button key={key} type="button" onClick={() => setTur(key)}
                    className="py-2 px-1 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 smooth-transition"
                    style={
                      tur === key
                        ? { borderColor: 'var(--color-primary)', background: 'rgba(224,122,47,0.08)', color: 'var(--color-primary)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }
                    }
                  >
                    <span className="text-xl">{val.emoji}</span>
                    <span className="truncate w-full text-center">{val.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Başlık *</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="ör. Yıllık aşı kontrolü, Tırnak bakımı..."
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tarih *</label>
                <input
                  type="date"
                  value={tarihStr}
                  onChange={(e) => setTarihStr(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Saat *</label>
                <input
                  type="time"
                  value={saat}
                  onChange={(e) => setSaat(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Not <span style={{ color: 'var(--color-text-muted)' }}>(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={randevuNot}
                onChange={(e) => setRandevuNot(e.target.value)}
                placeholder="Veteriner adı, adres, hazırlık bilgisi..."
                maxLength={150}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            <button
              type="button"
              onClick={handleRandevuKaydet}
              disabled={kaydediliyor || !baslik.trim()}
              className="w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 smooth-transition"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              {kaydediliyor ? "Kaydediliyor..." : "Randevu Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* BAKIM EKLEME MODALI */}
      {/* ================================================================ */}
      {showBakimModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowBakimModal(false)}>
          <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6" style={{ background: 'var(--color-bg-card)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>{getTurBilgi(secilenBakimTur).label} Ekle</h2>

            <label className="flex items-center gap-3 mb-4">
              <input type="checkbox" checked={profesyonel} onChange={(e) => setProfesyonel(e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>Profesyonel berber/veteriner</span>
            </label>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Maliyet (₺) - İsteğe bağlı</label>
              <input
                type="number"
                value={bakimMaliyet}
                onChange={(e) => setBakimMaliyet(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl focus:outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Not - İsteğe bağlı</label>
              <textarea
                value={bakimNot}
                onChange={(e) => setBakimNot(e.target.value)}
                placeholder="Detaylar..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBakimModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium smooth-transition"
                style={{ background: 'var(--color-border-light)', color: 'var(--color-text)' }}
              >
                İptal
              </button>
              <button
                onClick={handleBakimEkle}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RandevuPage;
