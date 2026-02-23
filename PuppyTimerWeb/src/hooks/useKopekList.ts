// =============================================================================
// PuppyTimer Web - useKopekList Hook
// KopekListViewModel'in React karsiligi
// Kopek listesi CRUD islemleri
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Kopek } from '../types/models';
import type { Cinsiyet } from '../types/enums';

export function useKopekList() {
  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const kopekler = useLiveQuery(
    () => db.kopekler.orderBy('ad').toArray(),
    [],
    []
  );

  // ---------------------------------------------------------------------------
  // Kopek Ekle
  // ---------------------------------------------------------------------------

  async function kopekEkle(
    ad: string,
    irk: string,
    cinsiyet: Cinsiyet
  ): Promise<number> {
    const yeniKopek: Kopek = {
      ad,
      irk,
      cinsiyet,
      olusturmaTarihi: Date.now(),
    };
    const id = await db.kopekler.add(yeniKopek);
    return id;
  }

  // ---------------------------------------------------------------------------
  // Kopek Sil - Cascade delete (tum alt tablolar dahil)
  // ---------------------------------------------------------------------------

  async function kopekSil(id: number): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.beslenmeProgramlari,
        db.beslenmeKayitlari,
        db.suProgramlari,
        db.suKayitlari,
        db.yuruyusProgramlari,
        db.yuruyusKayitlari,
        db.tuvaletKayitlari,
        db.asiKayitlari,
        db.veterinerZiyaretleri,
        db.ilacTakipleri,
        db.saglikNotlari,
        db.haritaIsaretcileri,
        db.kopekler,
      ],
      async () => {
        await db.beslenmeProgramlari.where('kopekId').equals(id).delete();
        await db.beslenmeKayitlari.where('kopekId').equals(id).delete();
        await db.suProgramlari.where('kopekId').equals(id).delete();
        await db.suKayitlari.where('kopekId').equals(id).delete();
        await db.yuruyusProgramlari.where('kopekId').equals(id).delete();
        await db.yuruyusKayitlari.where('kopekId').equals(id).delete();
        await db.tuvaletKayitlari.where('kopekId').equals(id).delete();
        await db.asiKayitlari.where('kopekId').equals(id).delete();
        await db.veterinerZiyaretleri.where('kopekId').equals(id).delete();
        await db.ilacTakipleri.where('kopekId').equals(id).delete();
        await db.saglikNotlari.where('kopekId').equals(id).delete();
        await db.haritaIsaretcileri.where('kopekId').equals(id).delete();
        await db.kopekler.delete(id);
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    kopekler,
    kopekEkle,
    kopekSil,
  };
}
