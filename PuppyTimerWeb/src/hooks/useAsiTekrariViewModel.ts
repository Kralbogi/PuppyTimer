// =============================================================================
// PawLand - useAsiTekrariViewModel Hook
// Asi tekrar zamanlayicisi yonetimi
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../db/database';
import { asiTekrarAraligiMs } from '../types/enums';
import type { AsiTekrarAraligi } from '../types/enums';
import type { AsiTekrari } from '../types/models';

export function useAsiTekrariViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const tekrarlar = useLiveQuery(
    () =>
      db.asiTekrarlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => a.sonrakiTarih - b.sonrakiTarih)),
    [kopekId],
    []
  );

  const aktifTekrarlar = useLiveQuery(
    () =>
      db.asiTekrarlari
        .where('kopekId')
        .equals(kopekId)
        .filter((t) => t.aktif)
        .toArray()
        .then((items) => items.sort((a, b) => a.sonrakiTarih - b.sonrakiTarih)),
    [kopekId],
    []
  );

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  const tekrarEkle = useCallback(
    async (
      asiAdi: string,
      tekrarAraligi: AsiTekrarAraligi,
      sonUygulamaTarihi: number,
      veterinerAdi?: string,
      not?: string
    ): Promise<number> => {
      const sonrakiTarih = sonUygulamaTarihi + asiTekrarAraligiMs(tekrarAraligi);
      const kayit: AsiTekrari = {
        kopekId,
        asiAdi,
        tekrarAraligi,
        sonUygulamaTarihi,
        sonrakiTarih,
        veterinerAdi,
        not,
        aktif: true,
      };
      const id = await db.asiTekrarlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  const tamamla = useCallback(
    async (tekrarId: number): Promise<void> => {
      const tekrar = await db.asiTekrarlari.get(tekrarId);
      if (!tekrar) return;

      const simdi = Date.now();
      const yeniSonrakiTarih = simdi + asiTekrarAraligiMs(tekrar.tekrarAraligi);

      // Asi tekrarini guncelle
      await db.asiTekrarlari.update(tekrarId, {
        sonUygulamaTarihi: simdi,
        sonrakiTarih: yeniSonrakiTarih,
      });

      // AsiKaydi olustur
      await db.asiKayitlari.add({
        kopekId: tekrar.kopekId,
        asiAdi: tekrar.asiAdi,
        tarih: simdi,
        sonrakiTarih: yeniSonrakiTarih,
        veterinerAdi: tekrar.veterinerAdi,
        not: `Otomatik kayit - ${tekrar.asiAdi} tekrari`,
      });
    },
    []
  );

  const tekrarSil = useCallback(async (id: number): Promise<void> => {
    await db.asiTekrarlari.delete(id);
  }, []);

  const tekrarDuraklatToggle = useCallback(async (id: number): Promise<void> => {
    const tekrar = await db.asiTekrarlari.get(id);
    if (!tekrar) return;
    await db.asiTekrarlari.update(id, { aktif: !tekrar.aktif });
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    tekrarlar,
    aktifTekrarlar,
    tekrarEkle,
    tamamla,
    tekrarSil,
    tekrarDuraklatToggle,
  };
}
