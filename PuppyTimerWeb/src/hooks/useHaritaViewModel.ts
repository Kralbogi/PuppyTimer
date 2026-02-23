// =============================================================================
// PuppyTimer Web - useHaritaViewModel Hook
// HaritaViewModel'in React karsiligi
// Harita isaretcileri, filtreleme ve tuvalet kaydi entegrasyonu
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useCallback, useMemo } from 'react';
import { db } from '../db/database';
import { IsaretciTuru, TuvaletTuru, DiskilamaMiktar, DiskiRenk, DiskiKivam, IdrarRenk } from '../types/enums';
import type { HaritaIsaretci, TuvaletKaydi } from '../types/models';

// Istanbul varsayilan konum
export const varsayilanKonum = { lat: 41.0082, lng: 28.9784 };

export function useHaritaViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [secilenFiltreler, setSecilenFiltreler] = useState<Set<IsaretciTuru>>(
    new Set<IsaretciTuru>()
  );

  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const isaretciler = useLiveQuery(
    () =>
      db.haritaIsaretcileri
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  // ---------------------------------------------------------------------------
  // Computed: Filtrelenmis isaretciler
  // ---------------------------------------------------------------------------

  const filtrelenmisIsaretciler = useMemo(() => {
    // Bos set = hepsini goster
    if (secilenFiltreler.size === 0) {
      return isaretciler;
    }
    return isaretciler.filter((i) => secilenFiltreler.has(i.tur));
  }, [isaretciler, secilenFiltreler]);

  // ---------------------------------------------------------------------------
  // Filtre Toggle
  // ---------------------------------------------------------------------------

  const filtreToggle = useCallback((tur: IsaretciTuru) => {
    setSecilenFiltreler((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(tur)) {
        yeni.delete(tur);
      } else {
        yeni.add(tur);
      }
      return yeni;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Isaretci Ekle
  // ---------------------------------------------------------------------------

  const isaretciEkle = useCallback(
    async (
      baslik: string,
      enlem: number,
      boylam: number,
      tur: IsaretciTuru,
      not?: string,
      tuvaletKaydiOlustur: boolean = true
    ): Promise<number> => {
      const isaretci: HaritaIsaretci = {
        kopekId,
        baslik,
        enlem,
        boylam,
        tur,
        not,
        tarih: Date.now(),
      };
      const id = await db.haritaIsaretcileri.add(isaretci);

      // Tuvalet isaretcisi ise otomatik tuvalet kaydi olustur
      if (
        tuvaletKaydiOlustur &&
        (tur === IsaretciTuru.BuyukTuvalet || tur === IsaretciTuru.KucukTuvalet)
      ) {
        if (tur === IsaretciTuru.BuyukTuvalet) {
          const tuvaletKaydi: TuvaletKaydi = {
            kopekId,
            tarih: Date.now(),
            tur: TuvaletTuru.Buyuk,
            enlem,
            boylam,
            not,
            miktar: DiskilamaMiktar.Normal,
            kivam: DiskiKivam.Normal,
            diskiRenk: DiskiRenk.Kahverengi,
            uyariVar: false,
          };
          await db.tuvaletKayitlari.add(tuvaletKaydi);
        } else {
          const tuvaletKaydi: TuvaletKaydi = {
            kopekId,
            tarih: Date.now(),
            tur: TuvaletTuru.Kucuk,
            enlem,
            boylam,
            not,
            idrarMiktar: DiskilamaMiktar.Normal,
            idrarRenk: IdrarRenk.Normal,
            uyariVar: false,
          };
          await db.tuvaletKayitlari.add(tuvaletKaydi);
        }
      }

      return id;
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Isaretci Sil
  // ---------------------------------------------------------------------------

  const isaretciSil = useCallback(async (id: number): Promise<void> => {
    await db.haritaIsaretcileri.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    isaretciler,
    secilenFiltreler,
    filtrelenmisIsaretciler,
    filtreToggle,
    isaretciEkle,
    isaretciSil,
    varsayilanKonum,
  };
}
