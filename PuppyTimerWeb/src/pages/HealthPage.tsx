// =============================================================================
// PawLand - HealthPage (Saglik Takibi Sayfasi)
// Asilar, veteriner ziyaretleri, ilac takibi, saglik notlari
// =============================================================================

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Syringe,
  Stethoscope,
  Pill,
  StickyNote,
  Trash2,
  Plus,
  X,
  Calendar,
  CalendarDays,
  CheckCircle,
  Phone,
  Mail,
  Building,
  MapPin,
  Repeat,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
  Scissors,
} from "lucide-react";
import SegmentedControl from "../components/common/SegmentedControl";
import EmptyState from "../components/layout/EmptyState";
import { useSaglikViewModel } from "../hooks/useSaglikViewModel";
import { useAsiTekrariViewModel } from "../hooks/useAsiTekrariViewModel";
import AsiTimerCard from "../components/health/AsiTimerCard";
import VeterinerSelector from "../components/health/VeterinerSelector";
import { turkceTarihSaat, turkceTarih, goreceli } from "../services/dateUtils";
import {
  SaglikKategorisi,
  saglikKategorisiBaslik,
  saglikKategorisiListesi,
  asiTekrarAraligiBaslik,
  asiTekrarAraligiListesi,
  AsiTekrarAraligi,
} from "../types/enums";
import { db } from "../db/database";

// =============================================================================
// Props
// =============================================================================

interface HealthPageProps {
  kopekId: number;
}

// =============================================================================
// Tab Options
// =============================================================================

const tabOptions = [
  { value: "0", label: "Genel" },
  { value: "1", label: "Aşılar" },
  { value: "2", label: "Veteriner" },
  { value: "3", label: "İlaçlar" },
  { value: "4", label: "Notlar" },
];

// =============================================================================
// Category color helper
// =============================================================================

function kategoriRenk(k: SaglikKategorisi): string {
  switch (k) {
    case SaglikKategorisi.Genel:
      return "bg-blue-100 text-blue-700";
    case SaglikKategorisi.Allerji:
      return "bg-red-100 text-red-700";
    case SaglikKategorisi.Diyet:
      return "bg-green-100 text-green-700";
    case SaglikKategorisi.Davranis:
      return "bg-purple-100 text-purple-700";
    case SaglikKategorisi.Diger:
      return "bg-gray-100 text-gray-700";
  }
}

// =============================================================================
// Stat Card
// =============================================================================

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon }) => (
  <div
    className={`rounded-xl p-4 flex flex-col items-center border`}
    style={{
      background: 'rgba(245, 230, 211, 0.35)',
      borderColor: 'var(--color-border-light)',
    }}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</span>
    <span className="text-xs mt-0.5 text-center" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
  </div>
);

// =============================================================================
// Main HealthPage Component
// =============================================================================

export const HealthPage: React.FC<HealthPageProps> = ({ kopekId }) => {
  const vm = useSaglikViewModel(kopekId);
  const asiTekrarVm = useAsiTekrariViewModel(kopekId);
  const kopek = useLiveQuery(() => db.kopekler.get(kopekId), [kopekId]);

  const [activeTab, setActiveTab] = useState("0");

  // -- Asi Modal State
  const [showAsiModal, setShowAsiModal] = useState(false);
  const [asiForm, setAsiForm] = useState({
    asiAdi: "",
    tarih: "",
    sonrakiTarih: "",
    veterinerAdi: "",
    veterinerId: undefined as number | undefined,
    not: "",
  });

  // -- Veteriner Modal State
  const [showVetModal, setShowVetModal] = useState(false);
  const [vetForm, setVetForm] = useState({
    neden: "",
    tarih: "",
    teshis: "",
    tedavi: "",
    veterinerAdi: "",
    veterinerTelefon: "",
    veterinerEposta: "",
    klinikAdi: "",
    klinikAdresi: "",
    maliyet: "",
    not: "",
  });

  // -- Ilac Modal State
  const [showIlacModal, setShowIlacModal] = useState(false);
  const [ilacForm, setIlacForm] = useState({
    ilacAdi: "",
    doz: "",
    baslangicTarihi: "",
    bitisTarihi: "",
    saatAraligi: "8",
    not: "",
  });

  // -- Not Modal State
  const [showNotModal, setShowNotModal] = useState(false);
  const [notForm, setNotForm] = useState({
    baslik: "",
    icerik: "",
    kategori: SaglikKategorisi.Genel as SaglikKategorisi,
  });

  // -- Asi Tekrar Modal State
  const [showTekrarModal, setShowTekrarModal] = useState(false);
  const [tekrarForm, setTekrarForm] = useState({
    asiAdi: "",
    tekrarAraligi: AsiTekrarAraligi.Aylik as AsiTekrarAraligi,
    sonUygulamaTarihi: "",
    veterinerAdi: "",
    not: "",
  });

  // -- Kilo Modal State
  const [showKiloModal, setShowKiloModal] = useState(false);
  const [kiloForm, setKiloForm] = useState({
    agirlik: "",
    tarih: "",
    not: "",
  });

  // -- Kilo Tarih Aralığı State
  const [kiloTarihBaslangic, setKiloTarihBaslangic] = useState("");
  const [kiloTarihBitis, setKiloTarihBitis] = useState("");

  // -- Not Filter State
  const [notFiltre, setNotFiltre] = useState<SaglikKategorisi | null>(null);

  // -- Filtered notes
  const filtrelenmisNotlar = useMemo(() => {
    if (notFiltre === null) return vm.notlar;
    return vm.notlar.filter((n) => n.kategori === notFiltre);
  }, [vm.notlar, notFiltre]);

  // -- Filtered kilo records by date range
  const filtrelenmisKiloKayitlari = useMemo(() => {
    let kayitlar = [...vm.kiloKayitlari];
    if (kiloTarihBaslangic) {
      const baslangicMs = new Date(kiloTarihBaslangic).getTime();
      kayitlar = kayitlar.filter((k) => k.tarih >= baslangicMs);
    }
    if (kiloTarihBitis) {
      const bitisMs = new Date(kiloTarihBitis).getTime() + 24 * 60 * 60 * 1000 - 1;
      kayitlar = kayitlar.filter((k) => k.tarih <= bitisMs);
    }
    return kayitlar;
  }, [vm.kiloKayitlari, kiloTarihBaslangic, kiloTarihBitis]);

  // ---------------------------------------------------------------------------
  // Asi handlers
  // ---------------------------------------------------------------------------

  const openAsiModal = () => {
    setAsiForm({ asiAdi: "", tarih: "", sonrakiTarih: "", veterinerAdi: "", veterinerId: undefined, not: "" });
    setShowAsiModal(true);
  };

  const saveAsi = async () => {
    if (!asiForm.asiAdi.trim() || !asiForm.tarih) return;
    await vm.asiEkle(
      asiForm.asiAdi.trim(),
      new Date(asiForm.tarih).getTime(),
      asiForm.sonrakiTarih ? new Date(asiForm.sonrakiTarih).getTime() : undefined,
      asiForm.veterinerAdi.trim() || undefined,
      asiForm.not.trim() || undefined
    );
    setShowAsiModal(false);
  };

  // ---------------------------------------------------------------------------
  // Veteriner handlers
  // ---------------------------------------------------------------------------

  const openVetModal = () => {
    setVetForm({ neden: "", tarih: "", teshis: "", tedavi: "", veterinerAdi: "", veterinerTelefon: "", veterinerEposta: "", klinikAdi: "", klinikAdresi: "", maliyet: "", not: "" });
    setShowVetModal(true);
  };

  const saveVet = async () => {
    if (!vetForm.neden.trim() || !vetForm.tarih) return;
    await vm.ziyaretEkle(
      new Date(vetForm.tarih).getTime(),
      vetForm.neden.trim(),
      vetForm.teshis.trim() || undefined,
      vetForm.tedavi.trim() || undefined,
      vetForm.veterinerAdi.trim() || undefined,
      vetForm.maliyet ? parseFloat(vetForm.maliyet) : undefined,
      vetForm.not.trim() || undefined,
      vetForm.veterinerTelefon.trim() || undefined,
      vetForm.veterinerEposta.trim() || undefined,
      vetForm.klinikAdi.trim() || undefined,
      vetForm.klinikAdresi.trim() || undefined
    );
    setShowVetModal(false);
  };

  // ---------------------------------------------------------------------------
  // Ilac handlers
  // ---------------------------------------------------------------------------

  const openIlacModal = () => {
    setIlacForm({ ilacAdi: "", doz: "", baslangicTarihi: "", bitisTarihi: "", saatAraligi: "8", not: "" });
    setShowIlacModal(true);
  };

  const saveIlac = async () => {
    if (!ilacForm.ilacAdi.trim() || !ilacForm.doz.trim() || !ilacForm.baslangicTarihi) return;
    const saatAraligi = Math.max(1, Math.min(24, parseInt(ilacForm.saatAraligi) || 8));
    await vm.ilacEkle(
      ilacForm.ilacAdi.trim(),
      ilacForm.doz.trim(),
      new Date(ilacForm.baslangicTarihi).getTime(),
      saatAraligi,
      ilacForm.bitisTarihi ? new Date(ilacForm.bitisTarihi).getTime() : undefined,
      ilacForm.not.trim() || undefined
    );
    setShowIlacModal(false);
  };

  // ---------------------------------------------------------------------------
  // Not handlers
  // ---------------------------------------------------------------------------

  const openNotModal = () => {
    setNotForm({ baslik: "", icerik: "", kategori: SaglikKategorisi.Genel });
    setShowNotModal(true);
  };

  const saveNot = async () => {
    if (!notForm.baslik.trim() || !notForm.icerik.trim()) return;
    await vm.notEkle(notForm.baslik.trim(), notForm.icerik.trim(), notForm.kategori);
    setShowNotModal(false);
  };

  // ---------------------------------------------------------------------------
  // Asi Tekrar handlers
  // ---------------------------------------------------------------------------

  const openTekrarModal = () => {
    setTekrarForm({
      asiAdi: "",
      tekrarAraligi: AsiTekrarAraligi.Aylik,
      sonUygulamaTarihi: "",
      veterinerAdi: "",
      not: "",
    });
    setShowTekrarModal(true);
  };

  const saveTekrar = async () => {
    if (!tekrarForm.asiAdi.trim() || !tekrarForm.sonUygulamaTarihi) return;
    await asiTekrarVm.tekrarEkle(
      tekrarForm.asiAdi.trim(),
      tekrarForm.tekrarAraligi,
      new Date(tekrarForm.sonUygulamaTarihi).getTime(),
      tekrarForm.veterinerAdi.trim() || undefined,
      tekrarForm.not.trim() || undefined
    );
    setShowTekrarModal(false);
  };

  // ---------------------------------------------------------------------------
  // Kilo handlers
  // ---------------------------------------------------------------------------

  const openKiloModal = () => {
    setKiloForm({ agirlik: "", tarih: "", not: "" });
    setShowKiloModal(true);
  };

  const saveKilo = async () => {
    const agirlik = parseFloat(kiloForm.agirlik);
    if (!agirlik || agirlik <= 0 || !kiloForm.tarih) return;
    await vm.kiloEkle(
      agirlik,
      new Date(kiloForm.tarih).getTime(),
      kiloForm.not.trim() || undefined
    );
    setShowKiloModal(false);
  };

  // -- Kilo degisim hesaplama
  const sonKilo = vm.kiloKayitlari.length > 0 ? vm.kiloKayitlari[0] : null;
  const oncekiKilo = vm.kiloKayitlari.length > 1 ? vm.kiloKayitlari[1] : null;
  const kiloDegisim = sonKilo && oncekiKilo ? sonKilo.agirlik - oncekiKilo.agirlik : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="px-4 py-4" style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      {/* Segmented Control */}
      <div className="flex justify-center mb-4">
        <SegmentedControl
          options={tabOptions}
          selected={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ================================================================== */}
      {/* Tab 0: Genel */}
      {/* ================================================================== */}
      {activeTab === "0" && (
        <div>
          {/* Kisir Durumu */}
          {kopek && (
            <div
              className="rounded-2xl p-4 mb-6 border soft-shadow"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Sol: ikon + başlık */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="p-3 rounded-xl flex-shrink-0 smooth-transition"
                    style={{
                      background: kopek.kisir
                        ? 'rgba(224, 122, 47, 0.12)'
                        : 'rgba(232, 221, 208, 0.5)',
                    }}
                  >
                    <Scissors
                      size={20}
                      style={{ color: kopek.kisir ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      Kısırlaştırma Durumu
                    </h3>
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{ color: kopek.kisir ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                    >
                      {kopek.kisir ? '✓ Kısırlaştırılmış' : '✗ Kısırlaştırılmamış'}
                    </p>
                  </div>
                </div>

                {/* Sağ: toggle switch */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!kopek.id) return;
                    await db.kopekler.update(kopek.id, { kisir: !kopek.kisir });
                  }}
                  className="relative flex-shrink-0 smooth-transition active:scale-95"
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: kopek.kisir
                      ? 'linear-gradient(135deg, #ff8c42, #e07a2f)'
                      : 'var(--color-border)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                  }}
                  aria-checked={!!kopek.kisir}
                  role="switch"
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: kopek.kisir ? 27 : 3,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                      transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label="Aşı Sayısı"
              value={vm.asilar.length}
              icon={<Syringe size={22} style={{ color: 'var(--color-primary)' }} />}
              color=""
            />
            <StatCard
              label="Vet. Ziyaret"
              value={vm.ziyaretler.length}
              icon={<Stethoscope size={22} style={{ color: 'var(--color-accent-warm)' }} />}
              color=""
            />
            <StatCard
              label="Aktif İlaç"
              value={vm.aktifIlaclar.length}
              icon={<Pill size={22} style={{ color: 'var(--color-primary)' }} />}
              color=""
            />
            <StatCard
              label="Not"
              value={vm.notlar.length}
              icon={<StickyNote size={22} style={{ color: 'var(--color-accent-warm)' }} />}
              color=""
            />
          </div>

          {/* Upcoming vaccines */}
          {vm.yaklasanAsilar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Calendar size={18} className="text-blue-500" />
                Yaklaşan Aşılar
              </h3>
              {vm.yaklasanAsilar.map((asi) => (
                <div
                  key={asi.id}
                  className="bg-blue-50 rounded-xl px-4 py-3 mb-2 flex items-center gap-3"
                >
                  <Syringe size={18} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{asi.asiAdi}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Sonraki: {asi.sonrakiTarih ? turkceTarih(asi.sonrakiTarih) : "-"}{" "}
                      {asi.sonrakiTarih ? `(${goreceli(asi.sonrakiTarih)})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active medications */}
          {vm.aktifIlaclar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Pill size={18} className="text-purple-500" />
                Aktif İlaçlar
              </h3>
              {vm.aktifIlaclar.map((ilac) => (
                <div
                  key={ilac.id}
                  className="bg-purple-50 rounded-xl px-4 py-3 mb-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Pill size={18} className="text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{ilac.ilacAdi}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {ilac.doz} - Her {ilac.saatAraligi} saatte
                      </p>
                    </div>
                  </div>
                  {ilac.birSonrakiDoz && (
                    <span className="text-xs text-purple-600 flex-shrink-0">
                      {goreceli(ilac.birSonrakiDoz)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Last vet visit */}
          {vm.ziyaretler.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Stethoscope size={18} className="text-green-500" />
                Son Veteriner Ziyareti
              </h3>
              <div className="bg-green-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                    {vm.ziyaretler[0].neden}
                  </p>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {turkceTarih(vm.ziyaretler[0].tarih)}
                  {vm.ziyaretler[0].veterinerAdi &&
                    ` - ${vm.ziyaretler[0].veterinerAdi}`}
                </p>
                {vm.ziyaretler[0].teshis && (
                  <p className="text-xs text-green-600 mt-1">
                    Teşhis: {vm.ziyaretler[0].teshis}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Kilo Takibi */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Weight size={18} className="text-amber-500" />
                Kilo Takibi
              </h3>
              <button
                type="button"
                onClick={openKiloModal}
                className="flex items-center gap-1 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                <Plus size={14} />
                Kilo Ekle
              </button>
            </div>

            {sonKilo ? (
              <>
                {/* Güncel kilo kartı */}
                <div className="bg-amber-50 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Güncel Kilo</p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {sonKilo.agirlik.toFixed(1)}{" "}
                        <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>kg</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {turkceTarih(sonKilo.tarih)}
                      </p>
                    </div>
                    {kiloDegisim !== null && (
                      <div
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                          kiloDegisim > 0
                            ? "bg-red-100 text-red-600"
                            : kiloDegisim < 0
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {kiloDegisim > 0 ? (
                          <TrendingUp size={14} />
                        ) : kiloDegisim < 0 ? (
                          <TrendingDown size={14} />
                        ) : (
                          <Minus size={14} />
                        )}
                        <span className="text-sm font-semibold">
                          {kiloDegisim > 0 ? "+" : ""}
                          {kiloDegisim.toFixed(1)} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarih Aralığı Filtresi */}
                <div className="rounded-xl border p-3 mb-3" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays size={14} className="text-amber-500" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Tarih Aralığı</span>
                    {(kiloTarihBaslangic || kiloTarihBitis) && (
                      <button
                        type="button"
                        onClick={() => { setKiloTarihBaslangic(""); setKiloTarihBitis(""); }}
                        className="ml-auto text-xs font-medium"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={kiloTarihBaslangic}
                      onChange={(e) => setKiloTarihBaslangic(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-amber-400"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                    <input
                      type="date"
                      value={kiloTarihBitis}
                      onChange={(e) => setKiloTarihBitis(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-amber-400"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                {/* Kilo Grafiği (SVG) */}
                {filtrelenmisKiloKayitlari.length >= 2 && (() => {
                  const chartData = [...filtrelenmisKiloKayitlari].reverse();
                  const agirliklar = chartData.map((k) => k.agirlik);
                  const minKilo = Math.min(...agirliklar);
                  const maxKilo = Math.max(...agirliklar);
                  const kiloAraligi = maxKilo - minKilo || 1;
                  const svgW = 320;
                  const svgH = 160;
                  const padX = 40;
                  const padY = 20;
                  const drawW = svgW - padX * 2;
                  const drawH = svgH - padY * 2;

                  const noktalar = chartData.map((k, i) => ({
                    x: padX + (chartData.length > 1 ? (i / (chartData.length - 1)) * drawW : drawW / 2),
                    y: padY + drawH - ((k.agirlik - minKilo) / kiloAraligi) * drawH,
                    agirlik: k.agirlik,
                    tarih: k.tarih,
                  }));

                  const cizgiPath = noktalar.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" ");

                  return (
                    <div className="rounded-xl border p-3 mb-3" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Kilo Değişim Grafiği</h4>
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
                        {/* Yatay kılavuz çizgileri */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = padY + drawH - ratio * drawH;
                          const val = minKilo + ratio * kiloAraligi;
                          return (
                            <g key={ratio}>
                              <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#e8ddd0" strokeWidth="1" />
                              <text x={padX - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#8a7560">
                                {val.toFixed(1)}
                              </text>
                            </g>
                          );
                        })}
                        {/* Çizgi */}
                        <path d={cizgiPath} fill="none" stroke="#e07a2f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Noktalar */}
                        {noktalar.map((n, i) => (
                          <g key={i}>
                            <circle cx={n.x} cy={n.y} r="4" fill="#e07a2f" stroke="white" strokeWidth="2" />
                            <text x={n.x} y={n.y - 8} textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="600">
                              {n.agirlik.toFixed(1)}
                            </text>
                          </g>
                        ))}
                        {/* Tarih etiketleri (ilk ve son) */}
                        {noktalar.length > 0 && (
                          <>
                            <text x={noktalar[0].x} y={svgH - 4} textAnchor="start" fontSize="7" fill="#8a7560">
                              {new Date(noktalar[0].tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                            </text>
                            <text x={noktalar[noktalar.length - 1].x} y={svgH - 4} textAnchor="end" fontSize="7" fill="#8a7560">
                              {new Date(noktalar[noktalar.length - 1].tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                            </text>
                          </>
                        )}
                      </svg>
                    </div>
                  );
                })()}

                {/* Kilo geçmişi */}
                {filtrelenmisKiloKayitlari.length > 0 && (
                  <div className="space-y-2">
                    {filtrelenmisKiloKayitlari.slice(0, 10).map((kayit, index) => {
                      const onceki = filtrelenmisKiloKayitlari[index + 1];
                      const fark = onceki ? kayit.agirlik - onceki.agirlik : null;
                      return (
                        <div
                          key={kayit.id}
                          className="border rounded-xl px-4 py-3 flex items-center justify-between"
                          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Weight size={14} className="text-amber-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                                {kayit.agirlik.toFixed(1)} kg
                              </p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {turkceTarih(kayit.tarih)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {fark !== null && fark !== 0 && (
                              <span
                                className={`text-xs font-medium ${
                                  fark > 0 ? "text-red-500" : "text-green-500"
                                }`}
                              >
                                {fark > 0 ? "+" : ""}
                                {fark.toFixed(1)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => kayit.id && vm.kiloSil(kayit.id)}
                              className="p-1 transition-colors"
                              style={{ color: 'var(--color-border)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-amber-50 rounded-xl p-6 text-center">
                <Weight size={32} className="text-amber-300 mx-auto mb-2" />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Henüz kilo kaydı eklenmedi.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 1: Asilar */}
      {/* ================================================================== */}
      {activeTab === "1" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={openTekrarModal}
              className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Repeat size={16} />
              Tekrar Ekle
            </button>
            <button
              type="button"
              onClick={openAsiModal}
              className="flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              <Plus size={16} />
              Aşı Ekle
            </button>
          </div>

          {/* Asi Tekrarlari */}
          {asiTekrarVm.tekrarlar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Repeat size={18} className="text-blue-500" />
                Asi Tekrarlari
              </h3>
              {asiTekrarVm.tekrarlar.map((tekrar) => (
                <AsiTimerCard
                  key={tekrar.id}
                  tekrar={tekrar}
                  onTamamla={asiTekrarVm.tamamla}
                  onSil={asiTekrarVm.tekrarSil}
                  onToggle={asiTekrarVm.tekrarDuraklatToggle}
                />
              ))}
            </div>
          )}

          {vm.asilar.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="Aşı Kaydı Yok"
              description="Henüz aşı kaydı eklenmedi."
            />
          ) : (
            vm.asilar.map((asi) => (
              <div
                key={asi.id}
                className="rounded-xl p-4 mb-3"
                style={{ background: '#eff6ff' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <Syringe size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{asi.asiAdi}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {turkceTarih(asi.tarih)}
                      </p>
                      {asi.sonrakiTarih && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          Sonraki: {turkceTarih(asi.sonrakiTarih)}
                        </p>
                      )}
                      {asi.veterinerAdi && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Dr. {asi.veterinerAdi}
                        </p>
                      )}
                      {asi.not && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>{asi.not}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => asi.id && vm.asiSil(asi.id)}
                    className="p-2 transition-colors flex-shrink-0"
                    style={{ color: 'var(--color-border)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 2: Veteriner */}
      {/* ================================================================== */}
      {activeTab === "2" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={openVetModal}
              className="flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              <Plus size={16} />
              Ziyaret Ekle
            </button>
          </div>

          {vm.ziyaretler.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="Veteriner Ziyareti Yok"
              description="Henüz veteriner ziyareti eklenmedi."
            />
          ) : (
            vm.ziyaretler.map((ziyaret) => (
              <div
                key={ziyaret.id}
                className="rounded-xl p-4 mb-3"
                style={{ background: '#f0fdf4' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={20} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ziyaret.neden}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {turkceTarih(ziyaret.tarih)}
                      </p>
                      {ziyaret.teshis && (
                        <p className="text-xs text-green-700 mt-1">
                          <span className="font-medium">Teşhis:</span> {ziyaret.teshis}
                        </p>
                      )}
                      {ziyaret.tedavi && (
                        <p className="text-xs text-green-600 mt-0.5">
                          <span className="font-medium">Tedavi:</span> {ziyaret.tedavi}
                        </p>
                      )}
                      {ziyaret.veterinerAdi && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Dr. {ziyaret.veterinerAdi}
                        </p>
                      )}
                      {ziyaret.klinikAdi && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building size={10} style={{ color: 'var(--color-text-muted)' }} />
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{ziyaret.klinikAdi}</p>
                        </div>
                      )}
                      {ziyaret.klinikAdresi && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} style={{ color: 'var(--color-text-muted)' }} />
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{ziyaret.klinikAdresi}</p>
                        </div>
                      )}
                      {ziyaret.veterinerTelefon && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-green-500" />
                          <a
                            href={`tel:${ziyaret.veterinerTelefon}`}
                            className="text-xs text-green-600 underline"
                          >
                            {ziyaret.veterinerTelefon}
                          </a>
                        </div>
                      )}
                      {ziyaret.veterinerEposta && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail size={10} className="text-blue-500" />
                          <a
                            href={`mailto:${ziyaret.veterinerEposta}`}
                            className="text-xs text-blue-600 underline"
                          >
                            {ziyaret.veterinerEposta}
                          </a>
                        </div>
                      )}
                      {ziyaret.maliyet != null && ziyaret.maliyet > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Maliyet: {ziyaret.maliyet.toFixed(2)} TL
                        </p>
                      )}
                      {ziyaret.not && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>{ziyaret.not}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => ziyaret.id && vm.ziyaretSil(ziyaret.id)}
                    className="p-2 transition-colors flex-shrink-0"
                    style={{ color: 'var(--color-border)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 3: Ilaclar */}
      {/* ================================================================== */}
      {activeTab === "3" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={openIlacModal}
              className="flex items-center gap-2 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              <Plus size={16} />
              İlaç Ekle
            </button>
          </div>

          {vm.ilaclar.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="İlaç Kaydı Yok"
              description="Henüz ilaç kaydı eklenmedi."
            />
          ) : (
            vm.ilaclar.map((ilac) => (
              <div
                key={ilac.id}
                className={`rounded-xl p-4 mb-3 ${
                  ilac.aktif ? "bg-purple-50" : ""
                }`}
                style={!ilac.aktif ? { background: 'var(--color-bg)' } : {}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        ilac.aktif ? "bg-purple-200" : "bg-gray-200"
                      }`}
                    >
                      <Pill
                        size={20}
                        className={ilac.aktif ? "text-purple-600" : "text-gray-400"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ilac.ilacAdi}</p>
                        {ilac.aktif && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        Doz: {ilac.doz} - Her {ilac.saatAraligi} saatte
                      </p>
                      {ilac.sonDoz && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Son doz: {turkceTarihSaat(ilac.sonDoz)}
                        </p>
                      )}
                      {ilac.birSonrakiDoz && ilac.aktif && (
                        <p className="text-xs text-purple-600 mt-0.5">
                          Sonraki doz: {goreceli(ilac.birSonrakiDoz)}
                        </p>
                      )}
                      {ilac.not && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>{ilac.not}</p>
                      )}

                      {/* Doz Verildi button */}
                      {ilac.aktif && (
                        <button
                          type="button"
                          onClick={() => ilac.id && vm.ilacDozVerildi(ilac.id)}
                          className="mt-2 flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
                        >
                          <CheckCircle size={14} />
                          Doz Verildi
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => ilac.id && vm.ilacSil(ilac.id)}
                    className="p-2 transition-colors flex-shrink-0"
                    style={{ color: 'var(--color-border)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 4: Notlar */}
      {/* ================================================================== */}
      {activeTab === "4" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            {/* Filter buttons */}
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setNotFiltre(null)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  notFiltre === null
                    ? "text-white"
                    : ""
                }`}
                style={
                  notFiltre === null
                    ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }
                    : { background: 'var(--color-bg)', color: 'var(--color-text-muted)' }
                }
              >
                Tümü
              </button>
              {saglikKategorisiListesi.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNotFiltre(k)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                    notFiltre === k ? "text-white" : ""
                  }`}
                  style={
                    notFiltre === k
                      ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }
                      : { background: 'var(--color-bg)', color: 'var(--color-text-muted)' }
                  }
                >
                  {saglikKategorisiBaslik(k)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openNotModal}
              className="flex items-center gap-1 text-white font-medium px-3 py-2 rounded-xl transition-colors text-sm flex-shrink-0 ml-2"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              <Plus size={16} />
              Ekle
            </button>
          </div>

          {filtrelenmisNotlar.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="Not Bulunamadı"
              description="Seçilen kategoride not bulunmuyor."
            />
          ) : (
            filtrelenmisNotlar.map((not) => (
              <div
                key={not.id}
                className="border rounded-xl p-4 mb-3 soft-shadow"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${kategoriRenk(
                          not.kategori
                        )}`}
                      >
                        {saglikKategorisiBaslik(not.kategori)}
                      </span>
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{not.baslik}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{not.icerik}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      {turkceTarihSaat(not.tarih)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => not.id && vm.notSil(not.id)}
                    className="p-2 transition-colors flex-shrink-0"
                    style={{ color: 'var(--color-border)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Asi Modal */}
      {/* ================================================================== */}
      {showAsiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Aşı Ekle</h2>
              <button
                type="button"
                onClick={() => setShowAsiModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Aşı Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={asiForm.asiAdi}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, asiAdi: e.target.value }))
                  }
                  placeholder="Örnek: Kuduz Aşısı"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={asiForm.tarih}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Sonraki Tarih
                </label>
                <input
                  type="date"
                  value={asiForm.sonrakiTarih}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, sonrakiTarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <VeterinerSelector
                selectedVeterinerId={asiForm.veterinerId}
                selectedVeterinerAdi={asiForm.veterinerAdi}
                onSelect={(veterinerId, veterinerAdi) => {
                  setAsiForm((prev) => ({
                    ...prev,
                    veterinerId,
                    veterinerAdi: veterinerAdi || "",
                  }));
                }}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Not
                </label>
                <textarea
                  value={asiForm.not}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowAsiModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveAsi}
                disabled={!asiForm.asiAdi.trim() || !asiForm.tarih}
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Veteriner Modal */}
      {/* ================================================================== */}
      {showVetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Veteriner Ziyareti Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowVetModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Neden <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vetForm.neden}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, neden: e.target.value }))
                  }
                  placeholder="Ziyaret nedeni..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={vetForm.tarih}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Teşhis
                </label>
                <input
                  type="text"
                  value={vetForm.teshis}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, teshis: e.target.value }))
                  }
                  placeholder="Veteriner teshisi..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Tedavi
                </label>
                <input
                  type="text"
                  value={vetForm.tedavi}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, tedavi: e.target.value }))
                  }
                  placeholder="Uygulanan tedavi..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Veteriner Adı
                </label>
                <input
                  type="text"
                  value={vetForm.veterinerAdi}
                  onChange={(e) =>
                    setVetForm((prev) => ({
                      ...prev,
                      veterinerAdi: e.target.value,
                    }))
                  }
                  placeholder="Dr. ..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={vetForm.veterinerTelefon}
                  onChange={(e) =>
                    setVetForm((prev) => ({
                      ...prev,
                      veterinerTelefon: e.target.value,
                    }))
                  }
                  placeholder="0532 123 45 67"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  E-posta
                </label>
                <input
                  type="email"
                  value={vetForm.veterinerEposta}
                  onChange={(e) =>
                    setVetForm((prev) => ({
                      ...prev,
                      veterinerEposta: e.target.value,
                    }))
                  }
                  placeholder="doktor@klinik.com"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Klinik Adı
                </label>
                <input
                  type="text"
                  value={vetForm.klinikAdi}
                  onChange={(e) =>
                    setVetForm((prev) => ({
                      ...prev,
                      klinikAdi: e.target.value,
                    }))
                  }
                  placeholder="Klinik adi..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Klinik Adresi
                </label>
                <input
                  type="text"
                  value={vetForm.klinikAdresi}
                  onChange={(e) =>
                    setVetForm((prev) => ({
                      ...prev,
                      klinikAdresi: e.target.value,
                    }))
                  }
                  placeholder="Adres..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Maliyet (TL)
                </label>
                <input
                  type="number"
                  value={vetForm.maliyet}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, maliyet: e.target.value }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Not
                </label>
                <textarea
                  value={vetForm.not}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowVetModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveVet}
                disabled={!vetForm.neden.trim() || !vetForm.tarih}
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Ilac Modal */}
      {/* ================================================================== */}
      {showIlacModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>İlaç Ekle</h2>
              <button
                type="button"
                onClick={() => setShowIlacModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  İlaç Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ilacForm.ilacAdi}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, ilacAdi: e.target.value }))
                  }
                  placeholder="İlaç adı..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Doz <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ilacForm.doz}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, doz: e.target.value }))
                  }
                  placeholder="Örnek: 1 tablet, 5ml"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={ilacForm.baslangicTarihi}
                  onChange={(e) =>
                    setIlacForm((prev) => ({
                      ...prev,
                      baslangicTarihi: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={ilacForm.bitisTarihi}
                  onChange={(e) =>
                    setIlacForm((prev) => ({
                      ...prev,
                      bitisTarihi: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Saat Aralığı (1-24) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={ilacForm.saatAraligi}
                  onChange={(e) =>
                    setIlacForm((prev) => ({
                      ...prev,
                      saatAraligi: e.target.value,
                    }))
                  }
                  min="1"
                  max="24"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Not
                </label>
                <textarea
                  value={ilacForm.not}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowIlacModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveIlac}
                disabled={
                  !ilacForm.ilacAdi.trim() ||
                  !ilacForm.doz.trim() ||
                  !ilacForm.baslangicTarihi
                }
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Not Modal */}
      {/* ================================================================== */}
      {showNotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Sağlık Notu Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowNotModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={notForm.baslik}
                  onChange={(e) =>
                    setNotForm((prev) => ({ ...prev, baslik: e.target.value }))
                  }
                  placeholder="Not başlığı..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  İçerik <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notForm.icerik}
                  onChange={(e) =>
                    setNotForm((prev) => ({ ...prev, icerik: e.target.value }))
                  }
                  placeholder="Not içeriği..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Kategori
                </label>
                <SegmentedControl
                  options={saglikKategorisiListesi.map((k) => ({
                    value: k,
                    label: saglikKategorisiBaslik(k),
                  }))}
                  selected={notForm.kategori}
                  onChange={(v) =>
                    setNotForm((prev) => ({
                      ...prev,
                      kategori: v as SaglikKategorisi,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowNotModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveNot}
                disabled={!notForm.baslik.trim() || !notForm.icerik.trim()}
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Asi Tekrar Modal */}
      {/* ================================================================== */}
      {showTekrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Aşı Tekrarı Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowTekrarModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Aşı Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tekrarForm.asiAdi}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({ ...prev, asiAdi: e.target.value }))
                  }
                  placeholder="Örnek: Dış Parazit"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Tekrar Aralığı
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {asiTekrarAraligiListesi.map((aralik) => (
                    <button
                      key={aralik}
                      type="button"
                      onClick={() =>
                        setTekrarForm((prev) => ({ ...prev, tekrarAraligi: aralik }))
                      }
                      className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={
                        tekrarForm.tekrarAraligi === aralik
                          ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                          : { background: 'var(--color-bg)', color: 'var(--color-text-muted)' }
                      }
                    >
                      {asiTekrarAraligiBaslik(aralik)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Son Uygulama Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tekrarForm.sonUygulamaTarihi}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({
                      ...prev,
                      sonUygulamaTarihi: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Veteriner Adı
                </label>
                <input
                  type="text"
                  value={tekrarForm.veterinerAdi}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({
                      ...prev,
                      veterinerAdi: e.target.value,
                    }))
                  }
                  placeholder="Dr. ..."
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Not
                </label>
                <textarea
                  value={tekrarForm.not}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowTekrarModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveTekrar}
                disabled={!tekrarForm.asiAdi.trim() || !tekrarForm.sonUygulamaTarihi}
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Kilo Modal */}
      {/* ================================================================== */}
      {showKiloModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Kilo Kaydi Ekle</h2>
              <button
                type="button"
                onClick={() => setShowKiloModal(false)}
                className="p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Agirlik (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={kiloForm.agirlik}
                  onChange={(e) =>
                    setKiloForm((prev) => ({ ...prev, agirlik: e.target.value }))
                  }
                  placeholder="0.0"
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={kiloForm.tarih}
                  onChange={(e) =>
                    setKiloForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Not
                </label>
                <textarea
                  value={kiloForm.not}
                  onChange={(e) =>
                    setKiloForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all resize-none text-sm"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button
                type="button"
                onClick={() => setShowKiloModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveKilo}
                disabled={!kiloForm.agirlik || !kiloForm.tarih}
                className="flex-1 py-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthPage;
