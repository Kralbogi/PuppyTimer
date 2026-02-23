// =============================================================================
// PuppyTimer Web - useOnboarding Hook
// OnboardingViewModel'in React karsiligi
// Yeni kopek ekleme sihirbazi (onboarding akisi)
// =============================================================================

import { useState, useCallback } from 'react';
import { db } from '../db/database';
import { Cinsiyet } from '../types/enums';
import type { Kopek } from '../types/models';
import { kopekFotoAnalizEt, type KopekAnalizi } from '../services/claudeApi';
import { anahtarVarMi } from '../services/apiKeyStorage';

export function useOnboarding() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [adim, setAdim] = useState(0);
  const [kopekAdi, setKopekAdi] = useState('');
  const [kopekIrk, setKopekIrk] = useState('');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>(Cinsiyet.Erkek);
  const [dogumTarihi, setDogumTarihi] = useState<number | undefined>(undefined);
  const [agirlik, setAgirlik] = useState<number | undefined>(undefined);
  const [fotoData, setFotoData] = useState<string | undefined>(undefined);
  const [kopekAnalizi, setKopekAnalizi] = useState<KopekAnalizi | undefined>(undefined);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Navigasyon
  // ---------------------------------------------------------------------------

  const ileriGit = useCallback(() => {
    setAdim((prev) => Math.min(prev + 1, 3));
  }, []);

  const geriGit = useCallback(() => {
    setAdim((prev) => Math.max(prev - 1, 0));
  }, []);

  // ---------------------------------------------------------------------------
  // Foto Analiz (Claude AI)
  // ---------------------------------------------------------------------------

  const fotoAnalizEt = useCallback(async (): Promise<void> => {
    if (!fotoData) return;

    // API anahtari kontrolu
    if (!anahtarVarMi()) return;

    setYukleniyor(true);
    setHata(null);

    try {
      // Base64 verisinden data URI prefix'ini temizle ve MIME tipini tespit et
      const raw = fotoData.includes(',') ? fotoData.split(',')[1] : fotoData;
      let mediaType = 'image/jpeg';
      if (raw.startsWith('iVBOR')) mediaType = 'image/png';
      else if (raw.startsWith('R0lG')) mediaType = 'image/gif';
      else if (raw.startsWith('UklG')) mediaType = 'image/webp';

      const analiz = await kopekFotoAnalizEt(raw, mediaType);
      setKopekAnalizi(analiz);
      // Irk bilgisini otomatik doldur
      if (analiz.irk) {
        setKopekIrk(analiz.irk);
      }
    } catch (err) {
      setHata(
        err instanceof Error
          ? `AI analiz yapilamadi: ${err.message}`
          : 'AI analiz yapilamadi.'
      );
    } finally {
      setYukleniyor(false);
    }
  }, [fotoData]);

  // ---------------------------------------------------------------------------
  // Kaydet
  // ---------------------------------------------------------------------------

  const kaydet = useCallback(async (): Promise<number> => {
    const yeniKopek: Kopek = {
      ad: kopekAdi.trim(),
      irk: kopekIrk.trim(),
      cinsiyet,
      olusturmaTarihi: Date.now(),
    };

    if (fotoData) {
      yeniKopek.fotoData = fotoData;
    }

    if (dogumTarihi !== undefined) {
      yeniKopek.dogumTarihi = dogumTarihi;
    }

    if (agirlik !== undefined) {
      yeniKopek.agirlik = agirlik;
    }

    if (kopekAnalizi) {
      yeniKopek.irkTanimi = kopekAnalizi.genel;
      yeniKopek.renkTanimi = kopekAnalizi.renk;
    }

    const id = await db.kopekler.add(yeniKopek);
    return id;
  }, [kopekAdi, kopekIrk, cinsiyet, dogumTarihi, agirlik, fotoData, kopekAnalizi]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    adim,
    kopekAdi,
    kopekIrk,
    cinsiyet,
    dogumTarihi,
    agirlik,
    fotoData,
    kopekAnalizi,
    yukleniyor,
    hata,

    // Setters
    setKopekAdi,
    setKopekIrk,
    setCinsiyet,
    setDogumTarihi,
    setAgirlik,
    setFotoData,

    // Actions
    ileriGit,
    geriGit,
    fotoAnalizEt,
    kaydet,
  };
}
