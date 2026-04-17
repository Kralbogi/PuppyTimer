// =============================================================================
// PawLand - useTakvimViewModel Hook
// Aylik foto takvim yonetimi
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';
import { db } from '../db/database';
import type { TakvimFoto } from '../types/models';

const AY_ADLARI = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
];

export function useTakvimViewModel(kopekId: number) {
  const [seciliYil, setSeciliYil] = useState(new Date().getFullYear());

  // ---------------------------------------------------------------------------
  // Reactive Query
  // ---------------------------------------------------------------------------

  const fotolar = useLiveQuery(
    () =>
      db.takvimFotolari
        .where('[kopekId+yil]')
        .equals([kopekId, seciliYil])
        .toArray()
        .catch(() =>
          db.takvimFotolari
            .where('kopekId')
            .equals(kopekId)
            .filter((f) => f.yil === seciliYil)
            .toArray()
        ),
    [kopekId, seciliYil],
    []
  );

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const aylikFotoMap = useMemo(() => {
    const map = new Map<number, TakvimFoto>();
    for (const foto of fotolar) {
      map.set(foto.ay, foto);
    }
    return map;
  }, [fotolar]);

  const takvimTamamMi = useMemo(
    () => aylikFotoMap.size === 12,
    [aylikFotoMap]
  );

  const doluAySayisi = useMemo(
    () => aylikFotoMap.size,
    [aylikFotoMap]
  );

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  const fotoEkle = useCallback(
    async (ay: number, fotoData: string, aciklama?: string): Promise<number> => {
      // Ayni ay icin varsa sil
      const mevcut = await db.takvimFotolari
        .where('kopekId')
        .equals(kopekId)
        .filter((f) => f.yil === seciliYil && f.ay === ay)
        .first();
      if (mevcut?.id) {
        await db.takvimFotolari.delete(mevcut.id);
      }

      const kayit: TakvimFoto = {
        kopekId,
        yil: seciliYil,
        ay,
        fotoData,
        aciklama,
        tarih: Date.now(),
      };
      return db.takvimFotolari.add(kayit);
    },
    [kopekId, seciliYil]
  );

  const fotoSil = useCallback(async (id: number): Promise<void> => {
    await db.takvimFotolari.delete(id);
  }, []);

  const yilDegistir = useCallback((yil: number) => {
    setSeciliYil(yil);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    seciliYil,
    fotolar,
    aylikFotoMap,
    takvimTamamMi,
    doluAySayisi,
    ayAdlari: AY_ADLARI,
    fotoEkle,
    fotoSil,
    yilDegistir,
  };
}
