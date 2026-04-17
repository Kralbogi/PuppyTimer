// =============================================================================
// PawLand - useKopekYorumViewModel Hook
// Kopek yorumlari state yonetimi (Firestore gercek zamanli)
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import {
  kopekYorumlariniDinle,
  kopekYorumEkle,
  kopekYorumSil,
} from "../services/kopekYorumService";
import {
  kullaniciIdGetir,
  kullaniciAdGetir,
} from "../services/kullaniciKimlik";
import { ensureAuth } from "../services/firebase";
import type { KopekYorum } from "../types/models";

export function useKopekYorumViewModel(kopekId: string) {
  const [yorumlar, setYorumlar] = useState<KopekYorum[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const kullaniciId = kullaniciIdGetir();

  // Yerel yorum kayitlari (kullanici takibi)
  const kullaniciYorumlari =
    useLiveQuery(
      () =>
        db.kullaniciKopekYorumlari.where("kopekId").equals(kopekId).toArray(),
      [kopekId]
    ) ?? [];

  const benimYorumIdleri = useMemo(
    () => new Set(kullaniciYorumlari.map((y) => y.yorumId)),
    [kullaniciYorumlari]
  );

  // ---------------------------------------------------------------------------
  // Firestore dinleyici
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        setYukleniyor(true);
        setHata(null);

        await ensureAuth();

        unsubscribe = kopekYorumlariniDinle(kopekId, (yorumlarData) => {
          setYorumlar(yorumlarData);
          setYukleniyor(false);
        });
      } catch (err) {
        setHata(`Auth hatası: ${err instanceof Error ? err.message : String(err)}`);
        setYukleniyor(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [kopekId]);

  // ---------------------------------------------------------------------------
  // Benim yorumlarim
  // ---------------------------------------------------------------------------

  const benimYorumlarim = useMemo(
    () => yorumlar.filter((y) => y.olusturanId === kullaniciId),
    [yorumlar, kullaniciId]
  );

  // ---------------------------------------------------------------------------
  // Yorum Yaz
  // ---------------------------------------------------------------------------

  const yorumYaz = useCallback(
    async (icerik: string) => {
      try {
        const yorumId = await kopekYorumEkle(kopekId, icerik, kullaniciAdGetir());

        // Yerel takip icin kaydet
        await db.kullaniciKopekYorumlari.add({
          yorumId,
          kopekId,
          tarih: Date.now(),
        });
      } catch (err) {
        setHata(
          `Yorum eklenemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [kopekId]
  );

  // ---------------------------------------------------------------------------
  // Yorum Kaldir
  // ---------------------------------------------------------------------------

  const yorumKaldir = useCallback(
    async (yorumId: string) => {
      const yorum = yorumlar.find((y) => y.id === yorumId);
      if (!yorum || yorum.olusturanId !== kullaniciId) return;

      try {
        await kopekYorumSil(kopekId, yorumId);

        // Yerel takipten sil
        await db.kullaniciKopekYorumlari.where("yorumId").equals(yorumId).delete();
      } catch (err) {
        setHata(
          `Yorum silinemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [yorumlar, kullaniciId, kopekId]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    yorumlar,
    yukleniyor,
    hata,
    kullaniciId,
    benimYorumlarim,
    benimYorumIdleri,
    yorumYaz,
    yorumKaldir,
  };
}
