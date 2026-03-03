// =============================================================================
// PuppyTimer Web - HealthPage (Saglik Takibi Sayfasi)
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
  { value: "1", label: "Asilar" },
  { value: "2", label: "Veteriner" },
  { value: "3", label: "Ilaclar" },
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
}> = ({ label, value, icon, color }) => (
  <div className={`${color} rounded-xl p-4 flex flex-col items-center`}>
    <div className="mb-1">{icon}</div>
    <span className="text-2xl font-bold text-gray-800">{value}</span>
    <span className="text-xs text-gray-500 mt-0.5 text-center">{label}</span>
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

  // -- Not Filter State
  const [notFiltre, setNotFiltre] = useState<SaglikKategorisi | null>(null);

  // -- Filtered notes
  const filtrelenmisNotlar = useMemo(() => {
    if (notFiltre === null) return vm.notlar;
    return vm.notlar.filter((n) => n.kategori === notFiltre);
  }, [vm.notlar, notFiltre]);

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
    <div className="px-4 py-4">
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
            <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <Scissors size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kısırlaştırma Durumu</h3>
                    <p className="text-xs text-gray-500">
                      Köpeğiniz {kopek.kisir ? "kısırlaştırılmış" : "kısırlaştırılmamış"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!kopek.id) return;
                    await db.kopekler.update(kopek.id, { kisir: !kopek.kisir });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    kopek.kisir
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {kopek.kisir ? "Evet" : "Hayır"}
                </button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label="Asi Sayisi"
              value={vm.asilar.length}
              icon={<Syringe size={22} className="text-blue-500" />}
              color="bg-blue-50"
            />
            <StatCard
              label="Vet. Ziyaret"
              value={vm.ziyaretler.length}
              icon={<Stethoscope size={22} className="text-green-500" />}
              color="bg-green-50"
            />
            <StatCard
              label="Aktif Ilac"
              value={vm.aktifIlaclar.length}
              icon={<Pill size={22} className="text-purple-500" />}
              color="bg-purple-50"
            />
            <StatCard
              label="Not"
              value={vm.notlar.length}
              icon={<StickyNote size={22} className="text-orange-500" />}
              color="bg-orange-50"
            />
          </div>

          {/* Upcoming vaccines */}
          {vm.yaklasanAsilar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                Yaklasan Asilar
              </h3>
              {vm.yaklasanAsilar.map((asi) => (
                <div
                  key={asi.id}
                  className="bg-blue-50 rounded-xl px-4 py-3 mb-2 flex items-center gap-3"
                >
                  <Syringe size={18} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{asi.asiAdi}</p>
                    <p className="text-xs text-gray-500">
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
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Pill size={18} className="text-purple-500" />
                Aktif Ilaclar
              </h3>
              {vm.aktifIlaclar.map((ilac) => (
                <div
                  key={ilac.id}
                  className="bg-purple-50 rounded-xl px-4 py-3 mb-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Pill size={18} className="text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{ilac.ilacAdi}</p>
                      <p className="text-xs text-gray-500">
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
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Stethoscope size={18} className="text-green-500" />
                Son Veteriner Ziyareti
              </h3>
              <div className="bg-green-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {vm.ziyaretler[0].neden}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {turkceTarih(vm.ziyaretler[0].tarih)}
                  {vm.ziyaretler[0].veterinerAdi &&
                    ` - ${vm.ziyaretler[0].veterinerAdi}`}
                </p>
                {vm.ziyaretler[0].teshis && (
                  <p className="text-xs text-green-600 mt-1">
                    Teshis: {vm.ziyaretler[0].teshis}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Kilo Takibi */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Weight size={18} className="text-amber-500" />
                Kilo Takibi
              </h3>
              <button
                type="button"
                onClick={openKiloModal}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                <Plus size={14} />
                Kilo Ekle
              </button>
            </div>

            {sonKilo ? (
              <>
                {/* Guncel kilo karti */}
                <div className="bg-amber-50 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Guncel Kilo</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {sonKilo.agirlik.toFixed(1)}{" "}
                        <span className="text-base font-normal text-gray-500">kg</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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

                {/* Kilo gecmisi */}
                {vm.kiloKayitlari.length > 1 && (
                  <div className="space-y-2">
                    {vm.kiloKayitlari.slice(1, 6).map((kayit, index) => {
                      const onceki = vm.kiloKayitlari[index]; // index = 0 means comparing with kiloKayitlari[0]
                      const fark = onceki.agirlik - kayit.agirlik;
                      return (
                        <div
                          key={kayit.id}
                          className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Weight size={14} className="text-amber-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {kayit.agirlik.toFixed(1)} kg
                              </p>
                              <p className="text-xs text-gray-400">
                                {turkceTarih(kayit.tarih)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {fark !== 0 && (
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
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
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
                <p className="text-sm text-gray-500">
                  Henuz kilo kaydi eklenmedi.
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
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Asi Ekle
            </button>
          </div>

          {/* Asi Tekrarlari */}
          {asiTekrarVm.tekrarlar.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
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
              title="Asi Kaydi Yok"
              description="Henuz asi kaydi eklenmedi."
            />
          ) : (
            vm.asilar.map((asi) => (
              <div
                key={asi.id}
                className="bg-blue-50 rounded-xl p-4 mb-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <Syringe size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{asi.asiAdi}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {turkceTarih(asi.tarih)}
                      </p>
                      {asi.sonrakiTarih && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          Sonraki: {turkceTarih(asi.sonrakiTarih)}
                        </p>
                      )}
                      {asi.veterinerAdi && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Dr. {asi.veterinerAdi}
                        </p>
                      )}
                      {asi.not && (
                        <p className="text-xs text-gray-500 mt-1 italic">{asi.not}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => asi.id && vm.asiSil(asi.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
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
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Ziyaret Ekle
            </button>
          </div>

          {vm.ziyaretler.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="Veteriner Ziyareti Yok"
              description="Henuz veteriner ziyareti eklenmedi."
            />
          ) : (
            vm.ziyaretler.map((ziyaret) => (
              <div
                key={ziyaret.id}
                className="bg-green-50 rounded-xl p-4 mb-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={20} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{ziyaret.neden}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {turkceTarih(ziyaret.tarih)}
                      </p>
                      {ziyaret.teshis && (
                        <p className="text-xs text-green-700 mt-1">
                          <span className="font-medium">Teshis:</span> {ziyaret.teshis}
                        </p>
                      )}
                      {ziyaret.tedavi && (
                        <p className="text-xs text-green-600 mt-0.5">
                          <span className="font-medium">Tedavi:</span> {ziyaret.tedavi}
                        </p>
                      )}
                      {ziyaret.veterinerAdi && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Dr. {ziyaret.veterinerAdi}
                        </p>
                      )}
                      {ziyaret.klinikAdi && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building size={10} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{ziyaret.klinikAdi}</p>
                        </div>
                      )}
                      {ziyaret.klinikAdresi && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{ziyaret.klinikAdresi}</p>
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          Maliyet: {ziyaret.maliyet.toFixed(2)} TL
                        </p>
                      )}
                      {ziyaret.not && (
                        <p className="text-xs text-gray-500 mt-1 italic">{ziyaret.not}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => ziyaret.id && vm.ziyaretSil(ziyaret.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
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
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Ilac Ekle
            </button>
          </div>

          {vm.ilaclar.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Ilac Kaydi Yok"
              description="Henuz ilac kaydi eklenmedi."
            />
          ) : (
            vm.ilaclar.map((ilac) => (
              <div
                key={ilac.id}
                className={`rounded-xl p-4 mb-3 ${
                  ilac.aktif ? "bg-purple-50" : "bg-gray-50"
                }`}
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
                        <p className="font-semibold text-gray-800">{ilac.ilacAdi}</p>
                        {ilac.aktif && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Doz: {ilac.doz} - Her {ilac.saatAraligi} saatte
                      </p>
                      {ilac.sonDoz && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Son doz: {turkceTarihSaat(ilac.sonDoz)}
                        </p>
                      )}
                      {ilac.birSonrakiDoz && ilac.aktif && (
                        <p className="text-xs text-purple-600 mt-0.5">
                          Sonraki doz: {goreceli(ilac.birSonrakiDoz)}
                        </p>
                      )}
                      {ilac.not && (
                        <p className="text-xs text-gray-500 mt-1 italic">{ilac.not}</p>
                      )}

                      {/* Doz Verildi button */}
                      {ilac.aktif && (
                        <button
                          type="button"
                          onClick={() => ilac.id && vm.ilacDozVerildi(ilac.id)}
                          className="mt-2 flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
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
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
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
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tumu
              </button>
              {saglikKategorisiListesi.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNotFiltre(k)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                    notFiltre === k
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {saglikKategorisiBaslik(k)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openNotModal}
              className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-2 rounded-xl transition-colors text-sm flex-shrink-0 ml-2"
            >
              <Plus size={16} />
              Ekle
            </button>
          </div>

          {filtrelenmisNotlar.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="Not Bulunamadi"
              description="Secilen kategoride not bulunmuyor."
            />
          ) : (
            filtrelenmisNotlar.map((not) => (
              <div
                key={not.id}
                className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm"
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
                    <p className="font-semibold text-gray-800">{not.baslik}</p>
                    <p className="text-sm text-gray-600 mt-1">{not.icerik}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {turkceTarihSaat(not.tarih)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => not.id && vm.notSil(not.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Asi Ekle</h2>
              <button
                type="button"
                onClick={() => setShowAsiModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asi Adi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={asiForm.asiAdi}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, asiAdi: e.target.value }))
                  }
                  placeholder="Ornek: Kuduz Asisi"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={asiForm.tarih}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sonraki Tarih
                </label>
                <input
                  type="date"
                  value={asiForm.sonrakiTarih}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, sonrakiTarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={asiForm.not}
                  onChange={(e) =>
                    setAsiForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAsiModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveAsi}
                disabled={!asiForm.asiAdi.trim() || !asiForm.tarih}
                className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Veteriner Ziyareti Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowVetModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Neden <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vetForm.neden}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, neden: e.target.value }))
                  }
                  placeholder="Ziyaret nedeni..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={vetForm.tarih}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Teshis
                </label>
                <input
                  type="text"
                  value={vetForm.teshis}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, teshis: e.target.value }))
                  }
                  placeholder="Veteriner teshisi..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tedavi
                </label>
                <input
                  type="text"
                  value={vetForm.tedavi}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, tedavi: e.target.value }))
                  }
                  placeholder="Uygulanan tedavi..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Veteriner Adi
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Klinik Adi
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={vetForm.not}
                  onChange={(e) =>
                    setVetForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowVetModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveVet}
                disabled={!vetForm.neden.trim() || !vetForm.tarih}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Ilac Ekle</h2>
              <button
                type="button"
                onClick={() => setShowIlacModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ilac Adi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ilacForm.ilacAdi}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, ilacAdi: e.target.value }))
                  }
                  placeholder="Ilac adi..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Doz <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ilacForm.doz}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, doz: e.target.value }))
                  }
                  placeholder="Ornek: 1 tablet, 5ml"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Baslangic Tarihi <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bitis Tarihi
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Saat Araligi (1-24) <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={ilacForm.not}
                  onChange={(e) =>
                    setIlacForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowIlacModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveIlac}
                disabled={
                  !ilacForm.ilacAdi.trim() ||
                  !ilacForm.doz.trim() ||
                  !ilacForm.baslangicTarihi
                }
                className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Saglik Notu Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowNotModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Baslik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={notForm.baslik}
                  onChange={(e) =>
                    setNotForm((prev) => ({ ...prev, baslik: e.target.value }))
                  }
                  placeholder="Not basligi..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Icerik <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notForm.icerik}
                  onChange={(e) =>
                    setNotForm((prev) => ({ ...prev, icerik: e.target.value }))
                  }
                  placeholder="Not icerigi..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowNotModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveNot}
                disabled={!notForm.baslik.trim() || !notForm.icerik.trim()}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Asi Tekrari Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowTekrarModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asi Adi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tekrarForm.asiAdi}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({ ...prev, asiAdi: e.target.value }))
                  }
                  placeholder="Ornek: Dis Parazit"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tekrar Araligi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {asiTekrarAraligiListesi.map((aralik) => (
                    <button
                      key={aralik}
                      type="button"
                      onClick={() =>
                        setTekrarForm((prev) => ({ ...prev, tekrarAraligi: aralik }))
                      }
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        tekrarForm.tekrarAraligi === aralik
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {asiTekrarAraligiBaslik(aralik)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Veteriner Adi
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={tekrarForm.not}
                  onChange={(e) =>
                    setTekrarForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowTekrarModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveTekrar}
                disabled={!tekrarForm.asiAdi.trim() || !tekrarForm.sonUygulamaTarihi}
                className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Kilo Kaydi Ekle</h2>
              <button
                type="button"
                onClick={() => setShowKiloModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={kiloForm.tarih}
                  onChange={(e) =>
                    setKiloForm((prev) => ({ ...prev, tarih: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={kiloForm.not}
                  onChange={(e) =>
                    setKiloForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowKiloModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveKilo}
                disabled={!kiloForm.agirlik || !kiloForm.tarih}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
