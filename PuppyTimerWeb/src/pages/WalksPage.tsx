// =============================================================================
// PuppyTimer Web - WalksPage
// Walk tracking with active walk, today's walks, programs, and history
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Play,
  Square,
  Plus,
  X,
  Minus,
  CheckCircle,
  Clock,
  Footprints,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { HavaDurumuWidget } from "../components/walks/HavaDurumuWidget";
import { db } from "../db/database";
import { turkceSaat, turkceTarih, bugunMu } from "../services/dateUtils";
import { yuruyusBasariKontrol } from "../services/basariService";
import type { YuruyusProgrami, YuruyusKaydi } from "../types/models";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const GUN_LABELS = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];
// Swift weekday: 2=Mon..7=Sat, 1=Sun -> we map to [2,3,4,5,6,7,1]
const GUN_VALUES = [2, 3, 4, 5, 6, 7, 1];

// -----------------------------------------------------------------------------
// useYuruyusViewModel Hook
// -----------------------------------------------------------------------------

function useYuruyusViewModel(kopekId: number) {
  const programlar = useLiveQuery(
    () =>
      db.yuruyusProgramlari
        .where("kopekId")
        .equals(kopekId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.baslik.localeCompare(b.baslik))),
    [kopekId],
    [] as YuruyusProgrami[]
  );

  const kayitlar = useLiveQuery(
    () =>
      db.yuruyusKayitlari
        .where("kopekId")
        .equals(kopekId)
        .reverse()
        .sortBy("baslamaTarihi"),
    [kopekId],
    [] as YuruyusKaydi[]
  );

  const bugunYuruyusler = useMemo(
    () => kayitlar.filter((k) => bugunMu(k.baslamaTarihi)),
    [kayitlar]
  );

  const aktifYuruyus = useMemo(
    () => kayitlar.find((k) => !k.tamamlandi && !k.bitisTarihi),
    [kayitlar]
  );

  // Program ekle
  const programEkle = useCallback(
    async (baslik: string, saat: number, gunler: number[], sure: number) => {
      const program: YuruyusProgrami = {
        kopekId,
        baslik,
        saat,
        gunler,
        sure,
        aktif: true,
      };
      await db.yuruyusProgramlari.add(program);
    },
    [kopekId]
  );

  // Program sil
  const programSil = useCallback(async (id: number) => {
    await db.yuruyusProgramlari.delete(id);
  }, []);

  // Program toggle
  const programToggle = useCallback(async (program: YuruyusProgrami) => {
    if (!program.id) return;
    await db.yuruyusProgramlari.update(program.id, {
      aktif: !program.aktif,
    });
  }, []);

  // Yuruyusu baslat
  const yuruyusuBaslat = useCallback(async () => {
    const kayit: YuruyusKaydi = {
      kopekId,
      baslamaTarihi: Date.now(),
      tamamlandi: false,
    };
    const id = await db.yuruyusKayitlari.add(kayit);
    return id;
  }, [kopekId]);

  // Yuruyusu bitir
  const yuruyusuBitir = useCallback(async (kayit: YuruyusKaydi) => {
    if (!kayit.id) return;
    const bitisTarihi = Date.now();
    const sure = Math.floor((bitisTarihi - kayit.baslamaTarihi) / 60000);
    await db.yuruyusKayitlari.update(kayit.id, {
      bitisTarihi,
      sure,
      tamamlandi: true,
    });

    // Başarı kontrolü
    await yuruyusBasariKontrol(kopekId);
  }, [kopekId]);

  // Kayit sil
  const kayitSil = useCallback(async (id: number) => {
    await db.yuruyusKayitlari.delete(id);
  }, []);

  return {
    programlar,
    kayitlar,
    bugunYuruyusler,
    aktifYuruyus,
    programEkle,
    programSil,
    programToggle,
    yuruyusuBaslat,
    yuruyusuBitir,
    kayitSil,
  };
}

// -----------------------------------------------------------------------------
// Elapsed Timer Component
// -----------------------------------------------------------------------------

const ElapsedTimer: React.FC<{ baslamaTarihi: number }> = ({
  baslamaTarihi,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const hesapla = () => {
      const fark = Math.floor((Date.now() - baslamaTarihi) / 1000);
      setElapsed(fark);
    };
    hesapla();
    const interval = setInterval(hesapla, 1000);
    return () => clearInterval(interval);
  }, [baslamaTarihi]);

  const saat = Math.floor(elapsed / 3600);
  const dakika = Math.floor((elapsed % 3600) / 60);
  const saniye = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="text-3xl font-mono font-bold text-green-600">
      {pad(saat)}:{pad(dakika)}:{pad(saniye)}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Modal Component
// -----------------------------------------------------------------------------

const Modal: React.FC<{
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Number Stepper Component
// -----------------------------------------------------------------------------

const NumberStepper: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit: string;
  onChange: (v: number) => void;
}> = ({ value, min, max, step = 1, label, unit, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={16} />
        </button>
        <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-center">
          {value} {unit}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Day Selector Component
// -----------------------------------------------------------------------------

const DaySelector: React.FC<{
  selected: number[];
  onChange: (days: number[]) => void;
}> = ({ selected, onChange }) => {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Gunler
      </label>
      <div className="flex gap-1.5">
        {GUN_LABELS.map((label, i) => {
          const dayVal = GUN_VALUES[i];
          const isSelected = selected.includes(dayVal);
          return (
            <button
              key={dayVal}
              type="button"
              onClick={() => toggle(dayVal)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Duration format helper
// -----------------------------------------------------------------------------

function formatSure(dakika?: number): string {
  if (dakika == null || dakika <= 0) return "-";
  if (dakika < 60) return `${dakika} dk`;
  const saat = Math.floor(dakika / 60);
  const dk = dakika % 60;
  return dk > 0 ? `${saat} sa ${dk} dk` : `${saat} sa`;
}

function formatTimeRange(baslama: number, bitis?: number): string {
  const start = turkceSaat(baslama);
  if (bitis) {
    const end = turkceSaat(bitis);
    return `${start} - ${end}`;
  }
  return `${start} - ...`;
}

function saatToString(timestamp: number): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// -----------------------------------------------------------------------------
// Main WalksPage Component
// -----------------------------------------------------------------------------

interface WalksPageProps {
  kopekId: number;
}

export const WalksPage: React.FC<WalksPageProps> = ({ kopekId }) => {
  const {
    programlar,
    kayitlar,
    bugunYuruyusler,
    aktifYuruyus,
    programEkle,
    programSil,
    programToggle,
    yuruyusuBaslat,
    yuruyusuBitir,
  } = useYuruyusViewModel(kopekId);

  // Modal state
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Program form state
  const [programBaslik, setProgramBaslik] = useState("");
  const [programSaat, setProgramSaat] = useState("08:00");
  const [programSure, setProgramSure] = useState(30);
  const [programGunler, setProgramGunler] = useState<number[]>([
    2, 3, 4, 5, 6, 7, 1,
  ]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBaslat = async () => {
    await yuruyusuBaslat();
  };

  const handleBitir = async () => {
    if (aktifYuruyus) {
      await yuruyusuBitir(aktifYuruyus);
    }
  };

  const handleProgramEkle = async () => {
    if (!programBaslik.trim() || programGunler.length === 0) return;

    // Convert HH:mm to timestamp (today's date with that time)
    const [saat, dakika] = programSaat.split(":").map(Number);
    const d = new Date();
    d.setHours(saat, dakika, 0, 0);

    await programEkle(
      programBaslik.trim(),
      d.getTime(),
      programGunler,
      programSure
    );
    setShowProgramModal(false);
    setProgramBaslik("");
    setProgramSaat("08:00");
    setProgramSure(30);
    setProgramGunler([2, 3, 4, 5, 6, 7, 1]);
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const gecmisKayitlar = kayitlar.filter((k) => k.tamamlandi).slice(0, 20);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="px-4 py-2 space-y-6">
      {/* Header */}
      <PageHeader title="Yuruyus" />

      {/* Hava Durumu Widget */}
      <HavaDurumuWidget />

      {/* Big Start/Stop Button */}
      <div className="flex flex-col items-center gap-4">
        {aktifYuruyus ? (
          <>
            <div className="flex flex-col items-center gap-2 bg-green-50 rounded-2xl px-6 py-5 w-full border border-green-200">
              <span className="text-sm text-green-600 font-medium">
                Yuruyus devam ediyor
              </span>
              <span className="text-xs text-gray-500">
                Baslangic: {turkceSaat(aktifYuruyus.baslamaTarihi)}
              </span>
              <ElapsedTimer baslamaTarihi={aktifYuruyus.baslamaTarihi} />
            </div>
            <button
              type="button"
              onClick={handleBitir}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-red-500/25"
            >
              <Square size={22} />
              Yuruyusu Bitir
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleBaslat}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-green-500/25"
          >
            <Play size={22} />
            Yuruyuse Basla
          </button>
        )}
      </div>

      {/* Bugunun Yuruyusleri */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Bugunun Yuruyusleri
        </h2>
        {bugunYuruyusler.length === 0 ? (
          <div className="bg-gray-50 rounded-xl py-6 text-center">
            <Footprints size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Bugun henuz yuruyus yapilmadi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bugunYuruyusler.map((kayit) => (
              <div
                key={kayit.id}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  {kayit.tamamlandi ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Clock size={18} className="text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">
                    {formatTimeRange(kayit.baslamaTarihi, kayit.bitisTarihi ?? undefined)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {formatSure(kayit.sure)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yuruyus Programlari */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Yuruyus Programlari
          </h2>
          <button
            type="button"
            onClick={() => setShowProgramModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={14} />
            Ekle
          </button>
        </div>

        {programlar.length === 0 ? (
          <div className="bg-gray-50 rounded-xl py-6 text-center">
            <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Henuz yuruyus programi eklenmemis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programlar.map((program) => (
              <div
                key={program.id}
                className={`bg-white rounded-xl px-4 py-3 shadow-sm border transition-colors ${
                  program.aktif ? "border-green-200" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-800">
                      {program.baslik}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {saatToString(program.saat)}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">
                        {program.sure} dk
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => programToggle(program)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {program.aktif ? (
                        <ToggleRight size={28} className="text-green-500" />
                      ) : (
                        <ToggleLeft size={28} className="text-gray-300" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => program.id && programSil(program.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Day badges */}
                <div className="flex gap-1">
                  {GUN_LABELS.map((label, i) => {
                    const dayVal = GUN_VALUES[i];
                    const isActive = program.gunler.includes(dayVal);
                    return (
                      <span
                        key={dayVal}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-50 text-gray-300"
                        }`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yuruyus Gecmisi */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3"
        >
          Yuruyus Gecmisi
          {showHistory ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </button>

        {showHistory && (
          <div className="space-y-2">
            {gecmisKayitlar.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                Henuz yuruyus gecmisi yok.
              </p>
            ) : (
              gecmisKayitlar.map((kayit) => (
                <div
                  key={kayit.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 block">
                      {turkceTarih(kayit.baslamaTarihi)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeRange(
                        kayit.baslamaTarihi,
                        kayit.bitisTarihi ?? undefined
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      {formatSure(kayit.sure)}
                    </span>
                    {kayit.tamamlandi && (
                      <CheckCircle size={14} className="text-green-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Program Ekle Modal */}
      <Modal
        show={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        title="Yuruyus Programi Ekle"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Baslik <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={programBaslik}
              onChange={(e) => setProgramBaslik(e.target.value)}
              placeholder="Ornek: Sabah Yuruyusu"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Saat
            </label>
            <input
              type="time"
              value={programSaat}
              onChange={(e) => setProgramSaat(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
            />
          </div>

          <NumberStepper
            value={programSure}
            min={5}
            max={180}
            step={5}
            label="Sure"
            unit="dk"
            onChange={setProgramSure}
          />

          <DaySelector selected={programGunler} onChange={setProgramGunler} />

          <button
            type="button"
            onClick={handleProgramEkle}
            disabled={!programBaslik.trim() || programGunler.length === 0}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            Ekle
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WalksPage;
