// =============================================================================
// PuppyTimer Web - ToiletPage (Tuvalet Takibi Sayfasi)
// Buyuk/Kucuk tuvalet kaydi, istatistikler, AI analiz
// =============================================================================

import React, { useState } from "react";
import {
  Leaf,
  Droplets,
  AlertTriangle,
  Trash2,
  Camera,
  MapPin,
  Sparkles,
  Loader2,
  X,
  ClipboardList,
  History,
} from "lucide-react";
import SegmentedControl from "../components/common/SegmentedControl";
import PhotoPicker from "../components/common/PhotoPicker";
import EmptyState from "../components/layout/EmptyState";
import { useTuvaletViewModel } from "../hooks/useTuvaletViewModel";
import { turkceTarihSaat } from "../services/dateUtils";
import { anahtarVarMi } from "../services/apiKeyStorage";
import { diskiAnalizEt } from "../services/claudeApi";
import type { DiskiAnalizi } from "../services/claudeApi";
import { kuralTabanliAnaliz } from "../services/diskiKuralAnaliz";
import {
  TuvaletTuru,
  DiskilamaSekli,
  DiskilamaMiktar,
  DiskiRenk,
  DiskiKivam,
  IdrarRenk,
  diskilamaSekliBaslik,
  diskilamaSekliListesi,
  diskilamaMiktarBaslik,
  diskilamaMiktarListesi,
  diskiRenkBaslik,
  diskiRenkRenk,
  diskiRenkListesi,
  diskiKivamBaslik,
  diskiKivamListesi,
  idrarRenkBaslik,
  idrarRenkListesi,
  tuvaletTuruBaslik,
} from "../types/enums";
import type { TuvaletKaydi } from "../types/models";

// =============================================================================
// Props
// =============================================================================

interface ToiletPageProps {
  kopekId: number;
}

// =============================================================================
// Tab options
// =============================================================================

const tabOptions = [
  { value: "0", label: "Genel Bakis" },
  { value: "1", label: "Buyuk Tuvalet" },
  { value: "2", label: "Kucuk Tuvalet" },
  { value: "3", label: "Gecmis" },
];

// =============================================================================
// Color helpers for IdrarRenk buttons
// =============================================================================

function idrarRenkRenk(r: IdrarRenk): string {
  switch (r) {
    case IdrarRenk.Normal:
      return "#eab308";
    case IdrarRenk.Koyu:
      return "#ea580c";
    case IdrarRenk.Acik:
      return "#fef08a";
    case IdrarRenk.Kirmizi:
      return "#ef4444";
  }
}

// =============================================================================
// Buyuk Tuvalet Modal State
// =============================================================================

interface BuyukTuvaletForm {
  sekil: DiskilamaSekli;
  miktar: DiskilamaMiktar;
  renk: DiskiRenk;
  kivam: DiskiKivam;
  fotoData: string | null;
  not: string;
}

const initialBuyukForm: BuyukTuvaletForm = {
  sekil: DiskilamaSekli.Normal,
  miktar: DiskilamaMiktar.Normal,
  renk: DiskiRenk.Kahverengi,
  kivam: DiskiKivam.Normal,
  fotoData: null,
  not: "",
};

// =============================================================================
// Kucuk Tuvalet Modal State
// =============================================================================

interface KucukTuvaletForm {
  renk: IdrarRenk;
  miktar: DiskilamaMiktar;
  not: string;
}

const initialKucukForm: KucukTuvaletForm = {
  renk: IdrarRenk.Normal,
  miktar: DiskilamaMiktar.Normal,
  not: "",
};

// =============================================================================
// Record Card Component
// =============================================================================

const TuvaletKaydiKarti: React.FC<{
  kayit: TuvaletKaydi;
  onSil: (id: number) => void;
}> = ({ kayit, onSil }) => {
  const isBuyuk = kayit.tur === TuvaletTuru.Buyuk;
  const Icon = isBuyuk ? Leaf : Droplets;
  const iconColor = isBuyuk ? "text-amber-700" : "text-yellow-500";
  const bgColor = isBuyuk ? "bg-amber-50" : "bg-yellow-50";

  return (
    <div className={`${bgColor} rounded-xl p-4 mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isBuyuk ? "bg-amber-200" : "bg-yellow-200"
            }`}
          >
            <Icon size={20} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">
                {tuvaletTuruBaslik(kayit.tur)}
              </span>
              {kayit.uyariVar && (
                <AlertTriangle size={14} className="text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {turkceTarihSaat(kayit.tarih)}
            </p>

            {/* Property tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {isBuyuk && kayit.sekil && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                  {diskilamaSekliBaslik(kayit.sekil)}
                </span>
              )}
              {isBuyuk && kayit.diskiRenk && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: diskiRenkRenk(kayit.diskiRenk) }}
                  />
                  {diskiRenkBaslik(kayit.diskiRenk)}
                </span>
              )}
              {isBuyuk && kayit.kivam && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                  {diskiKivamBaslik(kayit.kivam)}
                </span>
              )}
              {kayit.miktar && isBuyuk && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                  {diskilamaMiktarBaslik(kayit.miktar)}
                </span>
              )}
              {!isBuyuk && kayit.idrarRenk && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: idrarRenkRenk(kayit.idrarRenk) }}
                  />
                  {idrarRenkBaslik(kayit.idrarRenk)}
                </span>
              )}
              {!isBuyuk && kayit.idrarMiktar && (
                <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                  {diskilamaMiktarBaslik(kayit.idrarMiktar)}
                </span>
              )}
            </div>

            {/* Icons row */}
            <div className="flex items-center gap-2 mt-2">
              {kayit.fotoData && (
                <Camera size={14} className="text-gray-400" />
              )}
              {(kayit.enlem != null && kayit.boylam != null) && (
                <MapPin size={14} className="text-gray-400" />
              )}
            </div>

            {/* Analiz sonucu */}
            {kayit.yapayZekaAnalizi && (() => {
              let analiz: DiskiAnalizi | null = null;
              try {
                analiz = JSON.parse(kayit.yapayZekaAnalizi) as DiskiAnalizi;
              } catch {
                // Eski plain text format
              }

              if (analiz && analiz.durum) {
                const bgCls =
                  analiz.durum === "acil"
                    ? "bg-red-50"
                    : analiz.durum === "dikkat"
                      ? "bg-yellow-50"
                      : "bg-green-50";
                const iconCls =
                  analiz.durum === "acil"
                    ? "text-red-500"
                    : analiz.durum === "dikkat"
                      ? "text-yellow-600"
                      : "text-green-500";
                const badgeCls =
                  analiz.durum === "acil"
                    ? "bg-red-100 text-red-700"
                    : analiz.durum === "dikkat"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700";
                const textCls =
                  analiz.durum === "acil"
                    ? "text-red-600"
                    : analiz.durum === "dikkat"
                      ? "text-yellow-700"
                      : "text-green-600";
                const durumLabel =
                  analiz.durum === "acil"
                    ? "Acil"
                    : analiz.durum === "dikkat"
                      ? "Dikkat"
                      : "Normal";

                return (
                  <div className={`mt-2 ${bgCls} rounded-lg px-3 py-2`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className={iconCls} />
                      <span className={`text-xs font-semibold ${textCls}`}>
                        Saglik Analizi
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls}`}
                      >
                        {durumLabel}
                      </span>
                    </div>
                    <p className={`text-xs ${textCls} whitespace-pre-line`}>
                      {analiz.aciklama}
                    </p>
                    {analiz.oneriler && analiz.oneriler.length > 0 && (
                      <ul className={`text-xs ${textCls} list-disc list-inside mt-1 space-y-0.5 opacity-80`}>
                        {analiz.oneriler.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              }

              // Eski plain text fallback
              return (
                <div className="mt-2 bg-purple-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700">
                      AI Analiz
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    {kayit.yapayZekaAnalizi}
                  </p>
                </div>
              );
            })()}

            {/* Note */}
            {kayit.not && (
              <p className="text-xs text-gray-500 mt-2 italic">{kayit.not}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => kayit.id && onSil(kayit.id)}
          className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Stat Card Component
// =============================================================================

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className={`${color} rounded-xl p-4 flex flex-col items-center`}>
    <div className="mb-1">{icon}</div>
    <span className="text-2xl font-bold text-gray-800">{value}</span>
    <span className="text-xs text-gray-500 mt-0.5">{label}</span>
  </div>
);

// =============================================================================
// Main ToiletPage Component
// =============================================================================

export const ToiletPage: React.FC<ToiletPageProps> = ({ kopekId }) => {
  const vm = useTuvaletViewModel(kopekId);

  const [activeTab, setActiveTab] = useState("0");
  const [showBuyukModal, setShowBuyukModal] = useState(false);
  const [showKucukModal, setShowKucukModal] = useState(false);
  const [buyukForm, setBuyukForm] = useState<BuyukTuvaletForm>(initialBuyukForm);
  const [kucukForm, setKucukForm] = useState<KucukTuvaletForm>(initialKucukForm);

  // AI analysis state for Buyuk modal
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<DiskiAnalizi | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Buyuk Tuvalet handlers
  // ---------------------------------------------------------------------------

  const openBuyukModal = () => {
    setBuyukForm(initialBuyukForm);
    setAiResult(null);
    setAiError(null);
    setAiLoading(false);
    setShowBuyukModal(true);
  };

  const saveBuyuk = async () => {
    await vm.buyukTuvaletEkle(
      buyukForm.sekil,
      buyukForm.miktar,
      buyukForm.renk,
      buyukForm.kivam,
      buyukForm.not || undefined,
      buyukForm.fotoData || undefined
    );
    setShowBuyukModal(false);
  };

  const runAiAnalysis = async () => {
    if (!buyukForm.fotoData) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await diskiAnalizEt(buyukForm.fotoData, "image/jpeg");
      setAiResult(result);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Analiz sirasinda hata olustu."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Kucuk Tuvalet handlers
  // ---------------------------------------------------------------------------

  const openKucukModal = () => {
    setKucukForm(initialKucukForm);
    setShowKucukModal(true);
  };

  const saveKucuk = async () => {
    await vm.kucukTuvaletEkle(
      kucukForm.renk,
      kucukForm.miktar,
      kucukForm.not || undefined
    );
    setShowKucukModal(false);
  };

  // ---------------------------------------------------------------------------
  // Filtered lists for tabs
  // ---------------------------------------------------------------------------

  const buyukKayitlar = vm.kayitlar.filter((k) => k.tur === TuvaletTuru.Buyuk);
  const kucukKayitlar = vm.kayitlar.filter((k) => k.tur === TuvaletTuru.Kucuk);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="px-4 py-4">
      {/* Warning banner */}
      {vm.sonUyarilar.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Dikkat! Son kayitlarda uyari var
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {vm.sonUyarilar.length} kayitta anormal bulgu tespit edildi.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={openBuyukModal}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3.5 rounded-2xl transition-colors"
        >
          <Leaf size={20} />
          Buyuk Tuvalet
        </button>
        <button
          type="button"
          onClick={openKucukModal}
          className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
        >
          <Droplets size={20} />
          Kucuk Tuvalet
        </button>
      </div>

      {/* Segmented Control */}
      <div className="flex justify-center mb-4">
        <SegmentedControl
          options={tabOptions}
          selected={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ================================================================== */}
      {/* Tab 0: Genel Bakis */}
      {/* ================================================================== */}
      {activeTab === "0" && (
        <div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label="Buyuk Tuvalet"
              value={vm.bugunBuyukSayisi}
              icon={<Leaf size={22} className="text-amber-700" />}
              color="bg-amber-50"
            />
            <StatCard
              label="Kucuk Tuvalet"
              value={vm.bugunKucukSayisi}
              icon={<Droplets size={22} className="text-yellow-500" />}
              color="bg-yellow-50"
            />
            <StatCard
              label="Toplam"
              value={vm.bugunKayitlar.length}
              icon={<ClipboardList size={22} className="text-blue-500" />}
              color="bg-blue-50"
            />
            <StatCard
              label="Uyari"
              value={vm.sonUyarilar.length}
              icon={<AlertTriangle size={22} className="text-red-500" />}
              color="bg-red-50"
            />
          </div>

          {/* Today's records */}
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Bugunun Kayitlari
          </h3>
          {vm.bugunKayitlar.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Bugun henuz kayit yok.
            </div>
          ) : (
            vm.bugunKayitlar.map((kayit) => (
              <TuvaletKaydiKarti
                key={kayit.id}
                kayit={kayit}
                onSil={vm.kayitSil}
              />
            ))
          )}

          {/* Recent warnings */}
          {vm.sonUyarilar.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Son Uyarilar
              </h3>
              {vm.sonUyarilar.map((kayit) => (
                <TuvaletKaydiKarti
                  key={kayit.id}
                  kayit={kayit}
                  onSil={vm.kayitSil}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 1: Buyuk Tuvalet */}
      {/* ================================================================== */}
      {activeTab === "1" && (
        <div>
          {buyukKayitlar.length === 0 ? (
            <EmptyState
              icon={Leaf}
              title="Buyuk Tuvalet Kaydi Yok"
              description="Henuz buyuk tuvalet kaydi eklenmedi."
            />
          ) : (
            buyukKayitlar.map((kayit) => (
              <TuvaletKaydiKarti
                key={kayit.id}
                kayit={kayit}
                onSil={vm.kayitSil}
              />
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 2: Kucuk Tuvalet */}
      {/* ================================================================== */}
      {activeTab === "2" && (
        <div>
          {kucukKayitlar.length === 0 ? (
            <EmptyState
              icon={Droplets}
              title="Kucuk Tuvalet Kaydi Yok"
              description="Henuz kucuk tuvalet kaydi eklenmedi."
            />
          ) : (
            kucukKayitlar.map((kayit) => (
              <TuvaletKaydiKarti
                key={kayit.id}
                kayit={kayit}
                onSil={vm.kayitSil}
              />
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Tab 3: Gecmis */}
      {/* ================================================================== */}
      {activeTab === "3" && (
        <div>
          {vm.kayitlar.length === 0 ? (
            <EmptyState
              icon={History}
              title="Gecmis Kayit Yok"
              description="Henuz tuvalet kaydi eklenmedi."
            />
          ) : (
            vm.kayitlar.map((kayit) => (
              <TuvaletKaydiKarti
                key={kayit.id}
                kayit={kayit}
                onSil={vm.kayitSil}
              />
            ))
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Buyuk Tuvalet Modal */}
      {/* ================================================================== */}
      {showBuyukModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Buyuk Tuvalet
              </h2>
              <button
                type="button"
                onClick={() => setShowBuyukModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* DiskilamaSekli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diskilama Sekli
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {diskilamaSekliListesi.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setBuyukForm((prev) => ({ ...prev, sekil: s }))
                      }
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        buyukForm.sekil === s
                          ? "bg-amber-100 border-amber-400 text-amber-800"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {diskilamaSekliBaslik(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* DiskilamaMiktar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miktar
                </label>
                <SegmentedControl
                  options={diskilamaMiktarListesi.map((m) => ({
                    value: m,
                    label: diskilamaMiktarBaslik(m),
                  }))}
                  selected={buyukForm.miktar}
                  onChange={(v) =>
                    setBuyukForm((prev) => ({
                      ...prev,
                      miktar: v as DiskilamaMiktar,
                    }))
                  }
                />
              </div>

              {/* DiskiRenk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {diskiRenkListesi.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setBuyukForm((prev) => ({ ...prev, renk: r }))
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        buyukForm.renk === r
                          ? "bg-amber-100 border-amber-400 text-amber-800"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: diskiRenkRenk(r) }}
                      />
                      {diskiRenkBaslik(r)}
                    </button>
                  ))}
                </div>
              </div>

              {/* DiskiKivam */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kivam
                </label>
                <SegmentedControl
                  options={diskiKivamListesi.map((k) => ({
                    value: k,
                    label: diskiKivamBaslik(k),
                  }))}
                  selected={buyukForm.kivam}
                  onChange={(v) =>
                    setBuyukForm((prev) => ({
                      ...prev,
                      kivam: v as DiskiKivam,
                    }))
                  }
                />
              </div>

              {/* Canli kural analizi onizleme */}
              {(() => {
                const onizle = kuralTabanliAnaliz({
                  kopekId,
                  tarih: Date.now(),
                  tur: TuvaletTuru.Buyuk,
                  sekil: buyukForm.sekil,
                  miktar: buyukForm.miktar,
                  diskiRenk: buyukForm.renk,
                  kivam: buyukForm.kivam,
                  uyariVar: false,
                });
                const isAcil = onizle.durum === "acil";
                const isDikkat = onizle.durum === "dikkat";
                const isNormal = onizle.durum === "normal";
                const borderCls = isAcil
                  ? "bg-red-50 border-red-200"
                  : isDikkat
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200";
                const iconCls = isAcil
                  ? "text-red-500"
                  : isDikkat
                    ? "text-yellow-600"
                    : "text-green-500";
                const titleCls = isAcil
                  ? "text-red-700"
                  : isDikkat
                    ? "text-yellow-700"
                    : "text-green-700";
                const textCls = isAcil
                  ? "text-red-600"
                  : isDikkat
                    ? "text-yellow-700"
                    : "text-green-600";
                const listCls = isAcil
                  ? "text-red-500"
                  : isDikkat
                    ? "text-yellow-600"
                    : "text-green-500";
                const durumLabel = isAcil
                  ? "Acil Uyari"
                  : isDikkat
                    ? "Dikkat"
                    : "Normal";
                const DurumIcon = isNormal ? Sparkles : AlertTriangle;
                return (
                  <div className={`rounded-xl px-4 py-3 border ${borderCls}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <DurumIcon size={14} className={iconCls} />
                      <span className={`text-xs font-semibold ${titleCls}`}>
                        Saglik Analizi — {durumLabel}
                      </span>
                    </div>
                    <p className={`text-xs whitespace-pre-line ${textCls}`}>
                      {onizle.aciklama}
                    </p>
                    {onizle.oneriler.length > 0 && (
                      <ul
                        className={`text-xs list-disc list-inside mt-1.5 space-y-0.5 ${listCls}`}
                      >
                        {onizle.oneriler.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* PhotoPicker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotograf (Opsiyonel)
                </label>
                <PhotoPicker
                  fotoData={buyukForm.fotoData}
                  onChange={(data) =>
                    setBuyukForm((prev) => ({ ...prev, fotoData: data }))
                  }
                />
              </div>

              {/* AI Analysis Button */}
              {buyukForm.fotoData && anahtarVarMi() && (
                <div>
                  <button
                    type="button"
                    onClick={runAiAnalysis}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-2.5 rounded-xl transition-colors"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Analiz Ediliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        AI ile Analiz Et
                      </>
                    )}
                  </button>

                  {aiError && (
                    <div className="mt-2 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">
                      {aiError}
                    </div>
                  )}

                  {aiResult && (
                    <div className="mt-2 bg-purple-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-purple-500" />
                        <span className="text-sm font-semibold text-purple-700">
                          Analiz Sonucu
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            aiResult.durum === "normal"
                              ? "bg-green-100 text-green-700"
                              : aiResult.durum === "dikkat"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {aiResult.durum === "normal"
                            ? "Normal"
                            : aiResult.durum === "dikkat"
                            ? "Dikkat"
                            : "Acil"}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 mb-2">
                        {aiResult.aciklama}
                      </p>
                      {aiResult.oneriler && aiResult.oneriler.length > 0 && (
                        <ul className="text-xs text-purple-500 list-disc list-inside space-y-0.5">
                          {aiResult.oneriler.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Not */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Not
                </label>
                <textarea
                  value={buyukForm.not}
                  onChange={(e) =>
                    setBuyukForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBuyukModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveBuyuk}
                className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Kucuk Tuvalet Modal */}
      {/* ================================================================== */}
      {showKucukModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Kucuk Tuvalet
              </h2>
              <button
                type="button"
                onClick={() => setShowKucukModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* IdrarRenk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idrar Rengi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {idrarRenkListesi.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setKucukForm((prev) => ({ ...prev, renk: r }))
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        kucukForm.renk === r
                          ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: idrarRenkRenk(r) }}
                      />
                      {idrarRenkBaslik(r)}
                    </button>
                  ))}
                </div>
              </div>

              {/* DiskilamaMiktar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miktar
                </label>
                <SegmentedControl
                  options={diskilamaMiktarListesi.map((m) => ({
                    value: m,
                    label: diskilamaMiktarBaslik(m),
                  }))}
                  selected={kucukForm.miktar}
                  onChange={(v) =>
                    setKucukForm((prev) => ({
                      ...prev,
                      miktar: v as DiskilamaMiktar,
                    }))
                  }
                />
              </div>

              {/* Canli kural analizi onizleme */}
              {(() => {
                const onizle = kuralTabanliAnaliz({
                  kopekId,
                  tarih: Date.now(),
                  tur: TuvaletTuru.Kucuk,
                  idrarRenk: kucukForm.renk,
                  idrarMiktar: kucukForm.miktar,
                  uyariVar: false,
                });
                const isAcil = onizle.durum === "acil";
                const isDikkat = onizle.durum === "dikkat";
                const isNormal = onizle.durum === "normal";
                const borderCls = isAcil
                  ? "bg-red-50 border-red-200"
                  : isDikkat
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200";
                const iconCls = isAcil
                  ? "text-red-500"
                  : isDikkat
                    ? "text-yellow-600"
                    : "text-green-500";
                const titleCls = isAcil
                  ? "text-red-700"
                  : isDikkat
                    ? "text-yellow-700"
                    : "text-green-700";
                const textCls = isAcil
                  ? "text-red-600"
                  : isDikkat
                    ? "text-yellow-700"
                    : "text-green-600";
                const listCls = isAcil
                  ? "text-red-500"
                  : isDikkat
                    ? "text-yellow-600"
                    : "text-green-500";
                const durumLabel = isAcil
                  ? "Acil Uyari"
                  : isDikkat
                    ? "Dikkat"
                    : "Normal";
                const DurumIcon = isNormal ? Sparkles : AlertTriangle;
                return (
                  <div className={`rounded-xl px-4 py-3 border ${borderCls}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <DurumIcon size={14} className={iconCls} />
                      <span className={`text-xs font-semibold ${titleCls}`}>
                        Saglik Analizi — {durumLabel}
                      </span>
                    </div>
                    <p className={`text-xs whitespace-pre-line ${textCls}`}>
                      {onizle.aciklama}
                    </p>
                    {onizle.oneriler.length > 0 && (
                      <ul
                        className={`text-xs list-disc list-inside mt-1.5 space-y-0.5 ${listCls}`}
                      >
                        {onizle.oneriler.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* Not */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Not
                </label>
                <textarea
                  value={kucukForm.not}
                  onChange={(e) =>
                    setKucukForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowKucukModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveKucuk}
                className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors"
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

export default ToiletPage;
