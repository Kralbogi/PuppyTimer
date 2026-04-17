// =============================================================================
// PawLand - useTimerViewModel Hook
// ZamanlayiciViewModel'in React karsiligi
// Beslenme ve su programlari, zamanlayici islemleri
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../db/database';
import { BeslenmeTuru } from '../types/enums';
import type { BeslenmeProgrami, BeslenmeKaydi, SuProgrami, SuKaydi } from '../types/models';

export function useTimerViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const beslenmeProgramlari = useLiveQuery(
    () => db.beslenmeProgramlari.where('kopekId').equals(kopekId).toArray(),
    [kopekId],
    []
  );

  const suProgramlari = useLiveQuery(
    () => db.suProgramlari.where('kopekId').equals(kopekId).toArray(),
    [kopekId],
    []
  );

  const beslenmeKayitlari = useLiveQuery(
    () =>
      db.beslenmeKayitlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((kayitlar) =>
          kayitlar
            .sort((a, b) => b.tarih - a.tarih)
            .slice(0, 20)
        ),
    [kopekId],
    []
  );

  // ---------------------------------------------------------------------------
  // Mama Verildi
  // ---------------------------------------------------------------------------

  const mamaVerildi = useCallback(
    async (programId: number): Promise<void> => {
      const program = await db.beslenmeProgramlari.get(programId);
      if (!program) return;

      const simdi = Date.now();
      const birSonrakiBeslenme = simdi + program.saatAraligi * 3600 * 1000;

      // Programi guncelle
      await db.beslenmeProgramlari.update(programId, {
        sonBeslenme: simdi,
        birSonrakiBeslenme,
      });

      // Beslenme kaydi olustur
      const kayit: BeslenmeKaydi = {
        kopekId,
        tarih: simdi,
        tur: BeslenmeTuru.Mama,
        miktar: program.miktar,
      };
      await db.beslenmeKayitlari.add(kayit);
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Su Verildi
  // ---------------------------------------------------------------------------

  const suVerildi = useCallback(
    async (programId: number): Promise<void> => {
      const program = await db.suProgramlari.get(programId);
      if (!program) return;

      const simdi = Date.now();
      const birSonrakiSuVerme = simdi + program.saatAraligi * 3600 * 1000;

      // Programi guncelle
      await db.suProgramlari.update(programId, {
        sonSuVerme: simdi,
        birSonrakiSuVerme,
      });

      // Su kaydi olustur
      const kayit: SuKaydi = {
        kopekId,
        tarih: simdi,
      };
      await db.suKayitlari.add(kayit);
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Beslenme Programi Ekle
  // ---------------------------------------------------------------------------

  const beslenmeProgramiEkle = useCallback(
    async (
      baslik: string,
      saatAraligi: number,
      mamaMarkasi?: string,
      miktar?: string
    ): Promise<number> => {
      const program: BeslenmeProgrami = {
        kopekId,
        baslik,
        saatAraligi,
        aktif: true,
        mamaMarkasi,
        miktar,
      };
      const id = await db.beslenmeProgramlari.add(program);
      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Su Programi Ekle
  // ---------------------------------------------------------------------------

  const suProgramiEkle = useCallback(
    async (saatAraligi: number): Promise<number> => {
      const program: SuProgrami = {
        kopekId,
        saatAraligi,
        aktif: true,
      };
      const id = await db.suProgramlari.add(program);
      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Program Sil
  // ---------------------------------------------------------------------------

  const programSil = useCallback(
    async (id: number, type: 'beslenme' | 'su'): Promise<void> => {
      if (type === 'beslenme') {
        await db.beslenmeProgramlari.delete(id);
      } else {
        await db.suProgramlari.delete(id);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    beslenmeProgramlari,
    suProgramlari,
    beslenmeKayitlari,
    mamaVerildi,
    suVerildi,
    beslenmeProgramiEkle,
    suProgramiEkle,
    programSil,
  };
}
