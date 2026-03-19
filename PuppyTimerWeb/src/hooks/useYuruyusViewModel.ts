// =============================================================================
// PawLand - useYuruyusViewModel Hook
// YuruyusViewModel'in React karsiligi
// Yuruyus programlari ve kayitlari yonetimi
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { db } from '../db/database';
import type { YuruyusProgrami, YuruyusKaydi } from '../types/models';

// Gunu baslangicina sifirlar (00:00:00.000)
function bugunBaslangic(): number {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return bugun.getTime();
}

export function useYuruyusViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const programlar = useLiveQuery(
    () => db.yuruyusProgramlari.where('kopekId').equals(kopekId).toArray(),
    [kopekId],
    []
  );

  const kayitlar = useLiveQuery(
    () =>
      db.yuruyusKayitlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.baslamaTarihi - a.baslamaTarihi)),
    [kopekId],
    []
  );

  const aktifYuruyus = useLiveQuery(
    () =>
      db.yuruyusKayitlari
        .where('[kopekId+tamamlandi]')
        .equals([kopekId, 0])
        .first()
        .catch(() =>
          // Bileşik index yoksa fallback
          db.yuruyusKayitlari
            .where('kopekId')
            .equals(kopekId)
            .toArray()
            .then((items) => items.find((k) => k.tamamlandi === false) ?? null)
        ),
    [kopekId],
    null
  );

  // ---------------------------------------------------------------------------
  // Computed: Bugunun yuruyusleri
  // ---------------------------------------------------------------------------

  const bugunYuruyusler = useMemo(() => {
    const baslangic = bugunBaslangic();
    return kayitlar.filter((k) => k.baslamaTarihi >= baslangic);
  }, [kayitlar]);

  // ---------------------------------------------------------------------------
  // Program Ekle
  // ---------------------------------------------------------------------------

  const programEkle = useCallback(
    async (
      baslik: string,
      saat: number,
      gunler: number[],
      sure: number
    ): Promise<number> => {
      const program: YuruyusProgrami = {
        kopekId,
        baslik,
        saat,
        gunler,
        sure,
        aktif: true,
      };
      const id = await db.yuruyusProgramlari.add(program);
      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Yuruyusu Baslat
  // ---------------------------------------------------------------------------

  const yuruyusuBaslat = useCallback(async (): Promise<number> => {
    const kayit: YuruyusKaydi = {
      kopekId,
      baslamaTarihi: Date.now(),
      tamamlandi: false,
    };
    const id = await db.yuruyusKayitlari.add(kayit);
    return id;
  }, [kopekId]);

  // ---------------------------------------------------------------------------
  // Yuruyusu Bitir
  // ---------------------------------------------------------------------------

  const yuruyusuBitir = useCallback(
    async (kayitId: number): Promise<void> => {
      const kayit = await db.yuruyusKayitlari.get(kayitId);
      if (!kayit) return;

      const bitisTarihi = Date.now();
      const sure = Math.round((bitisTarihi - kayit.baslamaTarihi) / 60000); // dakika

      await db.yuruyusKayitlari.update(kayitId, {
        bitisTarihi,
        sure,
        tamamlandi: true,
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Silme Islemleri
  // ---------------------------------------------------------------------------

  const programSil = useCallback(async (id: number): Promise<void> => {
    await db.yuruyusProgramlari.delete(id);
  }, []);

  const kayitSil = useCallback(async (id: number): Promise<void> => {
    await db.yuruyusKayitlari.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    programlar,
    kayitlar,
    aktifYuruyus,
    bugunYuruyusler,
    programEkle,
    yuruyusuBaslat,
    yuruyusuBitir,
    programSil,
    kayitSil,
  };
}
