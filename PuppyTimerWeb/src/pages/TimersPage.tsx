// =============================================================================
// PawLand - TimersPage
// Timer management with mama/su programs, add modals, and feeding history
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  Utensils,
  Droplets,
  Trash2,
  X,
  Minus,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import TimerCard from "../components/common/TimerCard";
import PageHeader from "../components/layout/PageHeader";
import { db } from "../db/database";
import { BeslenmeTuru, beslenmeTuruBaslik } from "../types/enums";
import { turkceTarihSaat } from "../services/dateUtils";
import type {
  BeslenmeProgrami,
  SuProgrami,
  BeslenmeKaydi,
} from "../types/models";

// -----------------------------------------------------------------------------
// useTimerViewModel Hook
// -----------------------------------------------------------------------------

function useTimerViewModel(kopekId: number) {
  const beslenmeProgramlari = useLiveQuery(
    () =>
      db.beslenmeProgramlari
        .where("kopekId")
        .equals(kopekId)
        .toArray()
        .then((arr) => arr.sort((a, b) => a.baslik.localeCompare(b.baslik))),
    [kopekId],
    [] as BeslenmeProgrami[]
  );

  const suProgramlari = useLiveQuery(
    () => db.suProgramlari.where("kopekId").equals(kopekId).toArray(),
    [kopekId],
    [] as SuProgrami[]
  );

  const beslenmeKayitlari = useLiveQuery(
    () =>
      db.beslenmeKayitlari
        .where("kopekId")
        .equals(kopekId)
        .reverse()
        .sortBy("tarih"),
    [kopekId],
    [] as BeslenmeKaydi[]
  );

  // Mama program ekle
  const beslenmeProgramiEkle = useCallback(
    async (
      baslik: string,
      saatAraligi: number,
      mamaMarkasi?: string,
      miktar?: string
    ) => {
      const program: BeslenmeProgrami = {
        kopekId,
        baslik,
        saatAraligi,
        aktif: true,
        mamaMarkasi: mamaMarkasi || undefined,
        miktar: miktar || undefined,
      };
      await db.beslenmeProgramlari.add(program);
    },
    [kopekId]
  );

  // Su program ekle
  const suProgramiEkle = useCallback(
    async (saatAraligi: number) => {
      const program: SuProgrami = {
        kopekId,
        saatAraligi,
        aktif: true,
      };
      await db.suProgramlari.add(program);
    },
    [kopekId]
  );

  // Mama verildi (complete timer)
  const mamaVerildi = useCallback(
    async (program: BeslenmeProgrami) => {
      if (!program.id) return;
      const simdi = Date.now();
      const hedef = simdi + program.saatAraligi * 3600 * 1000;

      // Kayit ekle
      const kayit: BeslenmeKaydi = {
        kopekId,
        tarih: simdi,
        tur: BeslenmeTuru.Mama,
        miktar: program.miktar,
      };
      await db.beslenmeKayitlari.add(kayit);

      // Programi guncelle
      await db.beslenmeProgramlari.update(program.id, {
        sonBeslenme: simdi,
        birSonrakiBeslenme: hedef,
      });
    },
    [kopekId]
  );

  // Su verildi
  const suVerildi = useCallback(
    async (program: SuProgrami) => {
      if (!program.id) return;
      const simdi = Date.now();
      const hedef = simdi + program.saatAraligi * 3600 * 1000;

      // Su kaydi
      await db.suKayitlari.add({
        kopekId,
        tarih: simdi,
      });

      // Beslenme kaydina su olarak ekle
      await db.beslenmeKayitlari.add({
        kopekId,
        tarih: simdi,
        tur: BeslenmeTuru.Su,
      });

      // Programi guncelle
      await db.suProgramlari.update(program.id, {
        sonSuVerme: simdi,
        birSonrakiSuVerme: hedef,
      });
    },
    [kopekId]
  );

  // Program sil
  const beslenmeProgramiSil = useCallback(async (id: number) => {
    await db.beslenmeProgramlari.delete(id);
  }, []);

  const suProgramiSil = useCallback(async (id: number) => {
    await db.suProgramlari.delete(id);
  }, []);

  return {
    beslenmeProgramlari,
    suProgramlari,
    beslenmeKayitlari,
    beslenmeProgramiEkle,
    suProgramiEkle,
    mamaVerildi,
    suVerildi,
    beslenmeProgramiSil,
    suProgramiSil,
  };
}

// -----------------------------------------------------------------------------
// useTimerService Hook - Manages countdown state
// -----------------------------------------------------------------------------

function useTimerService(
  beslenmeProgramlari: BeslenmeProgrami[],
  suProgramlari: SuProgrami[]
) {
  const [kalanSureler, setKalanSureler] = useState<Record<string, number>>({});

  useEffect(() => {
    const hesapla = () => {
      const simdi = Date.now();
      const sureler: Record<string, number> = {};

      for (const p of beslenmeProgramlari) {
        if (p.aktif && p.id != null) {
          if (p.birSonrakiBeslenme) {
            sureler[`mama_${p.id}`] = Math.max(
              0,
              Math.floor((p.birSonrakiBeslenme - simdi) / 1000)
            );
          } else {
            sureler[`mama_${p.id}`] = 0;
          }
        }
      }

      for (const p of suProgramlari) {
        if (p.aktif && p.id != null) {
          if (p.birSonrakiSuVerme) {
            sureler[`su_${p.id}`] = Math.max(
              0,
              Math.floor((p.birSonrakiSuVerme - simdi) / 1000)
            );
          } else {
            sureler[`su_${p.id}`] = 0;
          }
        }
      }

      setKalanSureler(sureler);
    };

    hesapla();
    const interval = setInterval(hesapla, 1000);
    return () => clearInterval(interval);
  }, [beslenmeProgramlari, suProgramlari]);

  return { kalanSureler };
}

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
        className="warm-card rounded-2xl w-full max-w-md p-6 shadow-xl"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
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
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--color-text)' }}
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg)',
          }}
        >
          <Minus size={16} />
        </button>
        <span
          className="text-lg font-semibold min-w-[60px] text-center"
          style={{ color: 'var(--color-text)' }}
        >
          {value} {unit}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg)',
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main TimersPage Component
// -----------------------------------------------------------------------------

interface TimersPageProps {
  kopekId: number;
}

export const TimersPage: React.FC<TimersPageProps> = ({ kopekId }) => {
  const {
    beslenmeProgramlari,
    suProgramlari,
    beslenmeKayitlari,
    beslenmeProgramiEkle,
    suProgramiEkle,
    mamaVerildi,
    suVerildi,
    beslenmeProgramiSil,
    suProgramiSil,
  } = useTimerViewModel(kopekId);

  const { kalanSureler } = useTimerService(
    beslenmeProgramlari,
    suProgramlari
  );

  // Modal state
  const [showMamaModal, setShowMamaModal] = useState(false);
  const [showSuModal, setShowSuModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mama form state
  const [mamaBaslik, setMamaBaslik] = useState("");
  const [mamaSaatAraligi, setMamaSaatAraligi] = useState(4);
  const [mamaMarkasi, setMamaMarkasi] = useState("");
  const [mamaMiktar, setMamaMiktar] = useState("");

  // Su form state
  const [suSaatAraligi, setSuSaatAraligi] = useState(2);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleMamaEkle = async () => {
    if (!mamaBaslik.trim()) return;
    await beslenmeProgramiEkle(
      mamaBaslik.trim(),
      mamaSaatAraligi,
      mamaMarkasi.trim() || undefined,
      mamaMiktar.trim() || undefined
    );
    setShowMamaModal(false);
    setMamaBaslik("");
    setMamaSaatAraligi(4);
    setMamaMarkasi("");
    setMamaMiktar("");
  };

  const handleSuEkle = async () => {
    await suProgramiEkle(suSaatAraligi);
    setShowSuModal(false);
    setSuSaatAraligi(2);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const aktifProgramlar = beslenmeProgramlari.filter((p) => p.aktif);
  const aktifSuProgramlar = suProgramlari.filter((p) => p.aktif);
  const hasPrograms = aktifProgramlar.length > 0 || aktifSuProgramlar.length > 0;
  const recentHistory = beslenmeKayitlari.slice(0, 20);

  return (
    <div className="px-4 py-2 space-y-6" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(224, 122, 47, 0.03) 100%)' }}>
      {/* Header */}
      <PageHeader
        title="Zamanlayıcılar"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowMamaModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-xl smooth-transition card-hover-lift active:scale-95"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={16} />
              Mama
            </button>
            <button
              type="button"
              onClick={() => setShowSuModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-xl smooth-transition card-hover-lift active:scale-95"
              style={{ background: 'var(--color-accent-warm)' }}
            >
              <Plus size={16} />
              Su
            </button>
          </div>
        }
      />

      {/* Timer Cards Grid */}
      {hasPrograms ? (
        <div className="grid grid-cols-2 gap-4">
          {aktifProgramlar.map((program) => {
            const key = `mama_${program.id}`;
            const remaining = kalanSureler[key] ?? 0;
            const total = program.saatAraligi * 3600;
            const subtitle = [program.mamaMarkasi, program.miktar]
              .filter(Boolean)
              .join(" - ");

            return (
              <div key={key} className="relative">
                <TimerCard
                  title={program.baslik}
                  remaining={remaining}
                  total={total}
                  color="#f97316"
                  onComplete={() => mamaVerildi(program)}
                  subtitle={subtitle || undefined}
                />
                <button
                  type="button"
                  onClick={() => program.id && beslenmeProgramiSil(program.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {aktifSuProgramlar.map((program) => {
            const key = `su_${program.id}`;
            const remaining = kalanSureler[key] ?? 0;
            const total = program.saatAraligi * 3600;

            return (
              <div key={key} className="relative">
                <TimerCard
                  title="Su Hatırlatıcı"
                  remaining={remaining}
                  total={total}
                  color="#3b82f6"
                  onComplete={() => suVerildi(program)}
                  subtitle={`Her ${program.saatAraligi} saatte`}
                />
                <button
                  type="button"
                  onClick={() => program.id && suProgramiSil(program.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="mb-3" style={{ color: 'var(--color-border)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-muted)' }}>Aktif zamanlayıcı yok</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
            Mama veya su programı eklemek için yukarıdaki butonları kullanın.
          </p>
        </div>
      )}

      {/* Beslenme Gecmisi */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-lg font-bold mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Beslenme Geçmişi
          {showHistory ? (
            <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} />
          ) : (
            <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>

        {showHistory && (
          <div className="space-y-2">
            {recentHistory.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Henüz beslenme kaydı yok.
              </p>
            ) : (
              recentHistory.map((kayit) => (
                <div
                  key={kayit.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 soft-shadow"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-light)',
                  }}
                >
                  {kayit.tur === BeslenmeTuru.Mama ? (
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <Utensils size={18} className="text-orange-500" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <Droplets size={18} className="text-blue-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {beslenmeTuruBaslik(kayit.tur)}
                    </span>
                    {kayit.miktar && (
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                        {kayit.miktar}
                      </span>
                    )}
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {turkceTarihSaat(kayit.tarih)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mama Ekle Modal */}
      <Modal
        show={showMamaModal}
        onClose={() => setShowMamaModal(false)}
        title="Mama Programı Ekle"
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mamaBaslik}
              onChange={(e) => setMamaBaslik(e.target.value)}
              placeholder="Örnek: Sabah Maması"
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <NumberStepper
            value={mamaSaatAraligi}
            min={1}
            max={24}
            label="Saat Aralığı"
            unit="saat"
            onChange={setMamaSaatAraligi}
          />

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              Mama Markası
            </label>
            <input
              type="text"
              value={mamaMarkasi}
              onChange={(e) => setMamaMarkasi(e.target.value)}
              placeholder="Opsiyonel"
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              Miktar
            </label>
            <input
              type="text"
              value={mamaMiktar}
              onChange={(e) => setMamaMiktar(e.target.value)}
              placeholder="Örnek: 200g"
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleMamaEkle}
            disabled={!mamaBaslik.trim()}
            className="w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
          >
            Ekle
          </button>
        </div>
      </Modal>

      {/* Su Ekle Modal */}
      <Modal
        show={showSuModal}
        onClose={() => setShowSuModal(false)}
        title="Su Programı Ekle"
      >
        <div className="space-y-4">
          <NumberStepper
            value={suSaatAraligi}
            min={1}
            max={24}
            label="Saat Aralığı"
            unit="saat"
            onChange={setSuSaatAraligi}
          />

          <button
            type="button"
            onClick={handleSuEkle}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            Ekle
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TimersPage;
