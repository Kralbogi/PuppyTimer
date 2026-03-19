// =============================================================================
// PawLand - useTuvaletViewModel Hook
// TuvaletViewModel'in React karsiligi
// Tuvalet kayitlari, istatistikler ve yapay zeka analizi
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useCallback, useMemo } from 'react';
import { db } from '../db/database';
import { TuvaletTuru } from '../types/enums';
import type {
  DiskilamaSekli,
  DiskilamaMiktar,
  DiskiRenk,
  DiskiKivam,
  IdrarRenk,
} from '../types/enums';
import type { TuvaletKaydi } from '../types/models';
import { diskiAnalizEt } from '../services/claudeApi';
import { kuralTabanliAnaliz } from '../services/diskiKuralAnaliz';

// Base64 gorsel verisinden MIME tipini tespit et
function gorselMimeType(base64: string): string {
  // data:image/... prefix'i varsa ayikla
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  if (raw.startsWith('iVBOR')) return 'image/png';
  if (raw.startsWith('R0lG')) return 'image/gif';
  if (raw.startsWith('UklG')) return 'image/webp';
  return 'image/jpeg';
}

// Base64 verisinden data URI prefix'ini temizle
function temizBase64(base64: string): string {
  return base64.includes(',') ? base64.split(',')[1] : base64;
}

// Gunu baslangicina sifirlar (00:00:00.000)
function bugunBaslangic(): number {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return bugun.getTime();
}

export function useTuvaletViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [analizYapiliyor, setAnalizYapiliyor] = useState(false);
  const [analizSonucu, setAnalizSonucu] = useState<{
    durum: string;
    aciklama: string;
    oneriler: string[];
    uyariMi: boolean;
  } | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const kayitlar = useLiveQuery(
    () =>
      db.tuvaletKayitlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const bugunKayitlar = useMemo(() => {
    const baslangic = bugunBaslangic();
    return kayitlar.filter((k) => k.tarih >= baslangic);
  }, [kayitlar]);

  const bugunBuyukSayisi = useMemo(
    () => bugunKayitlar.filter((k) => k.tur === TuvaletTuru.Buyuk).length,
    [bugunKayitlar]
  );

  const bugunKucukSayisi = useMemo(
    () => bugunKayitlar.filter((k) => k.tur === TuvaletTuru.Kucuk).length,
    [bugunKayitlar]
  );

  const sonUyarilar = useMemo(
    () => kayitlar.filter((k) => k.uyariVar).slice(0, 5),
    [kayitlar]
  );

  // ---------------------------------------------------------------------------
  // Buyuk Tuvalet Ekle
  // ---------------------------------------------------------------------------

  const buyukTuvaletEkle = useCallback(
    async (
      sekil: DiskilamaSekli,
      miktar: DiskilamaMiktar,
      renk: DiskiRenk,
      kivam: DiskiKivam,
      not?: string,
      fotoData?: string,
      enlem?: number,
      boylam?: number
    ): Promise<number> => {
      const kayit: TuvaletKaydi = {
        kopekId,
        tarih: Date.now(),
        tur: TuvaletTuru.Buyuk,
        sekil,
        miktar,
        diskiRenk: renk,
        kivam,
        not,
        fotoData,
        enlem,
        boylam,
        uyariVar: false,
      };

      // Kural tabanli analiz
      const analiz = kuralTabanliAnaliz(kayit);
      kayit.uyariVar = analiz.uyariMi;
      kayit.yapayZekaAnalizi = JSON.stringify(analiz);

      const id = await db.tuvaletKayitlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Kucuk Tuvalet Ekle
  // ---------------------------------------------------------------------------

  const kucukTuvaletEkle = useCallback(
    async (
      renk: IdrarRenk,
      miktar: DiskilamaMiktar,
      not?: string,
      enlem?: number,
      boylam?: number
    ): Promise<number> => {
      const kayit: TuvaletKaydi = {
        kopekId,
        tarih: Date.now(),
        tur: TuvaletTuru.Kucuk,
        idrarRenk: renk,
        idrarMiktar: miktar,
        not,
        enlem,
        boylam,
        uyariVar: false,
      };

      // Kural tabanli analiz
      const analiz = kuralTabanliAnaliz(kayit);
      kayit.uyariVar = analiz.uyariMi;
      kayit.yapayZekaAnalizi = JSON.stringify(analiz);

      const id = await db.tuvaletKayitlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Yapay Zeka Analizi
  // ---------------------------------------------------------------------------

  const yapayZekaAnaliziBaslat = useCallback(
    async (kayitId: number): Promise<void> => {
      const kayit = await db.tuvaletKayitlari.get(kayitId);
      if (!kayit) {
        setHata('Kayıt bulunamadı.');
        return;
      }

      if (!kayit.fotoData) {
        setHata('Analiz için fotoğraf gerekli.');
        return;
      }

      setAnalizYapiliyor(true);
      setHata(null);
      setAnalizSonucu(null);

      try {
        const raw = temizBase64(kayit.fotoData);
        const mediaType = gorselMimeType(kayit.fotoData);
        const sonuc = await diskiAnalizEt(raw, mediaType);

        await db.tuvaletKayitlari.update(kayitId, {
          yapayZekaAnalizi: JSON.stringify(sonuc),
          uyariVar: sonuc.uyariMi,
        });

        setAnalizSonucu(sonuc);
      } catch (err) {
        setHata(err instanceof Error ? err.message : 'Analiz sırasında hata oluştu.');
      } finally {
        setAnalizYapiliyor(false);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Kayit Sil
  // ---------------------------------------------------------------------------

  const kayitSil = useCallback(async (id: number): Promise<void> => {
    await db.tuvaletKayitlari.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    kayitlar,
    bugunKayitlar,
    bugunBuyukSayisi,
    bugunKucukSayisi,
    sonUyarilar,
    buyukTuvaletEkle,
    kucukTuvaletEkle,
    yapayZekaAnaliziBaslat,
    kayitSil,
    analizYapiliyor,
    analizSonucu,
    hata,
  };
}
