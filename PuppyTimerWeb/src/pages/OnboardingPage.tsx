// =============================================================================
// PawLand - OnboardingPage
// 4-step wizard: Welcome -> Photo -> Dog Info -> Complete
// =============================================================================

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Utensils,
  Footprints,
  Heart,
  Leaf,
  MapPin,
} from "lucide-react";
import PhotoPicker from "../components/common/PhotoPicker";
import SegmentedControl from "../components/common/SegmentedControl";
import BreedSelector from "../components/common/BreedSelector";
import { db } from "../db/database";
import { Cinsiyet } from "../types/enums";
import type { Kopek } from "../types/models";
import { cartoonFiltresiUygula } from "../services/cartoonFilter";
import { kopekFirestoreKaydet } from "../services/kopekSenkronizasyon";
import { premiumMi } from "../services/premiumService";

// -----------------------------------------------------------------------------
// useOnboarding Hook
// -----------------------------------------------------------------------------

interface OnboardingState {
  step: number;
  fotoData: string | null;
  ad: string;
  irk: string;
  cinsiyet: Cinsiyet;
  dogumTarihi: string;
  agirlik: string;
  saving: boolean;
  error: string | null;
  savedDogId: number | null;
  savedDogName: string;
}

function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    step: 0,
    fotoData: null,
    ad: "",
    irk: "",
    cinsiyet: Cinsiyet.Erkek,
    dogumTarihi: "",
    agirlik: "",
    saving: false,
    error: null,
    savedDogId: null,
    savedDogName: "",
  });

  const setField = useCallback(
    <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const ileri = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }));
  }, []);

  const geri = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }, []);

  const kaydet = useCallback(async () => {
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      // Köpek sayısı kontrolü (Normal: 1, Premium: 3)
      const mevcutKopekSayisi = await db.kopekler.count();
      const isPremium = await premiumMi();
      const maxKopekSayisi = isPremium ? 3 : 1;

      if (mevcutKopekSayisi >= maxKopekSayisi) {
        const message = isPremium
          ? `En fazla ${maxKopekSayisi} köpek ekleyebilirsiniz. Yeni köpek eklemek için mevcut bir köpeği silin.`
          : `Free kullanıcılar sadece 1 köpek ekleyebilir. Premium'a geçerek 3 köpek ekleyebilirsiniz.`;
        setState((prev) => ({ ...prev, saving: false, error: message }));
        return null;
      }

      // Foto varsa cartoon avatar olustur (daha küçük boyutta)
      let avatarData: string | undefined;
      if (state.fotoData) {
        try {
          avatarData = await cartoonFiltresiUygula(state.fotoData, 256);
        } catch {
          // Cartoon filtresi basarisiz olursa devam et
        }
      }

      const yeniKopek: Kopek = {
        ad: state.ad.trim(),
        irk: state.irk.trim(),
        cinsiyet: state.cinsiyet,
        fotoData: state.fotoData ?? undefined,
        avatarData,
        dogumTarihi: state.dogumTarihi
          ? new Date(state.dogumTarihi).getTime()
          : undefined,
        agirlik: state.agirlik ? parseFloat(state.agirlik) : undefined,
        olusturmaTarihi: Date.now(),
      };
      const id = await db.kopekler.add(yeniKopek);

      // Firestore'a da kaydet
      const kopekWithId = { ...yeniKopek, id };
      await kopekFirestoreKaydet(kopekWithId);

      setState((prev) => ({
        ...prev,
        saving: false,
        savedDogId: id,
        savedDogName: yeniKopek.ad,
        step: 3,
      }));
      return id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
      setState((prev) => ({ ...prev, saving: false, error: message }));
      return null;
    }
  }, [state.ad, state.irk, state.cinsiyet, state.fotoData, state.dogumTarihi, state.agirlik]);

  return { state, setField, ileri, geri, kaydet };
}

// -----------------------------------------------------------------------------
// Progress Bar Component
// -----------------------------------------------------------------------------

const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex gap-2 px-6 pt-6 pb-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full transition-colors duration-300"
          style={{
            background: i <= currentStep ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step 0: Welcome
// -----------------------------------------------------------------------------

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const features = [
    { icon: Utensils, label: "Mama / Su Takibi", color: "text-orange-500" },
    { icon: Footprints, label: "Yürüyüş", color: "text-green-500" },
    { icon: Heart, label: "Sağlık", color: "text-red-500" },
    { icon: Leaf, label: "Tuvalet", color: "text-amber-600" },
    { icon: MapPin, label: "Harita", color: "text-blue-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center">
      <div className="mb-6 flex justify-center">
        <img src="/pawlandlogo.png" alt="PawLand" className="w-24 h-24 object-contain" />
      </div>
      <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
        PawLand'e Hoş Geldiniz!
      </h1>
      <p className="mb-8 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
        Köpeğinizin bakımını kolayca takip edin.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-10">
        {features.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm border"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
          >
            <f.icon size={22} className={f.color} />
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{f.label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full max-w-sm flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-2xl smooth-transition active:scale-[0.98] text-lg"
        style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
      >
        Başlayalım
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step 1: Photo
// -----------------------------------------------------------------------------

const PhotoStep: React.FC<{
  fotoData: string | null;
  onChange: (data: string | null) => void;
  onSkip: () => void;
  onNext: () => void;
}> = ({ fotoData, onChange, onSkip, onNext }) => {
  return (
    <div className="flex flex-col items-center flex-1 px-6 py-8">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        Fotoğraf Ekleyin
      </h2>
      <p className="mb-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
        Köpeğinizin bir fotoğrafını ekleyin. İsterseniz bu adımı atlayabilirsiniz.
      </p>

      <div className="w-full max-w-sm mb-10">
        <PhotoPicker fotoData={fotoData} onChange={onChange} />
      </div>

      <div className="w-full max-w-sm flex gap-3 mt-auto">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3 rounded-2xl border font-medium transition-colors smooth-transition"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}
        >
          Atla
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold smooth-transition active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
        >
          İleri
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step 2: Dog Info
// -----------------------------------------------------------------------------

const DogInfoStep: React.FC<{
  ad: string;
  irk: string;
  cinsiyet: Cinsiyet;
  dogumTarihi: string;
  agirlik: string;
  saving: boolean;
  error: string | null;
  onChangeAd: (v: string) => void;
  onChangeIrk: (v: string) => void;
  onChangeCinsiyet: (v: Cinsiyet) => void;
  onChangeDogumTarihi: (v: string) => void;
  onChangeAgirlik: (v: string) => void;
  onBack: () => void;
  onSave: () => void;
}> = ({
  ad,
  irk,
  cinsiyet,
  dogumTarihi,
  agirlik,
  saving,
  error,
  onChangeAd,
  onChangeIrk,
  onChangeCinsiyet,
  onChangeDogumTarihi,
  onChangeAgirlik,
  onBack,
  onSave,
}) => {
  const isValid = ad.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 px-6 py-8">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
        Köpek Bilgileri
      </h2>
      <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Köpeğinizin temel bilgilerini girin.
      </p>

      <div className="space-y-5 flex-1">
        {/* Ad */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            Ad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={ad}
            onChange={(e) => onChangeAd(e.target.value)}
            placeholder="Köpeğinizin adı"
            className="w-full px-4 py-3 rounded-xl border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* Irk */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            Irk
          </label>
          <BreedSelector
            value={irk}
            onChange={onChangeIrk}
            placeholder="Cins seçiniz..."
          />
        </div>

        {/* Cinsiyet */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            Cinsiyet
          </label>
          <SegmentedControl
            options={[
              { value: Cinsiyet.Erkek, label: "Erkek" },
              { value: Cinsiyet.Disi, label: "Dişi" },
            ]}
            selected={cinsiyet}
            onChange={(v) => onChangeCinsiyet(v as Cinsiyet)}
          />
        </div>

        {/* Dogum Tarihi */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            Doğum Tarihi
          </label>
          <input
            type="date"
            value={dogumTarihi}
            onChange={(e) => onChangeDogumTarihi(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* Agirlik */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            Ağırlık (kg)
          </label>
          <input
            type="number"
            value={agirlik}
            onChange={(e) => onChangeAgirlik(e.target.value)}
            placeholder="Örnek: 12.5"
            min="0"
            step="0.1"
            className="w-full px-4 py-3 rounded-xl border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-medium transition-colors smooth-transition"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}
        >
          <ChevronLeft size={18} />
          Geri
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!isValid || saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold smooth-transition active:scale-[0.98]"
          style={isValid && !saving ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' } : undefined}
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step 3: Complete
// -----------------------------------------------------------------------------

const CompleteStep: React.FC<{
  dogName: string;
  onStart: () => void;
}> = ({ dogName, onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Tebrikler!</h2>
      <p className="text-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{dogName}</span>{" "}
        kaydedildi.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="w-full max-w-sm flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-2xl smooth-transition active:scale-[0.98] text-lg"
        style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
      >
        Başla
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main OnboardingPage Component
// -----------------------------------------------------------------------------

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setField, ileri, geri, kaydet } = useOnboarding();

  const handleStart = () => {
    if (state.savedDogId) {
      navigate(`/dog/${state.savedDogId}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: 'var(--color-bg)' }}>
      <ProgressBar currentStep={state.step} totalSteps={4} />

      <div className="flex-1 flex flex-col">
        {state.step === 0 && <WelcomeStep onNext={ileri} />}

        {state.step === 1 && (
          <PhotoStep
            fotoData={state.fotoData}
            onChange={(data) => setField("fotoData", data)}
            onSkip={ileri}
            onNext={ileri}
          />
        )}

        {state.step === 2 && (
          <DogInfoStep
            ad={state.ad}
            irk={state.irk}
            cinsiyet={state.cinsiyet}
            dogumTarihi={state.dogumTarihi}
            agirlik={state.agirlik}
            saving={state.saving}
            error={state.error}
            onChangeAd={(v) => setField("ad", v)}
            onChangeIrk={(v) => setField("irk", v)}
            onChangeCinsiyet={(v) => setField("cinsiyet", v)}
            onChangeDogumTarihi={(v) => setField("dogumTarihi", v)}
            onChangeAgirlik={(v) => setField("agirlik", v)}
            onBack={geri}
            onSave={kaydet}
          />
        )}

        {state.step === 3 && (
          <CompleteStep dogName={state.savedDogName} onStart={handleStart} />
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
