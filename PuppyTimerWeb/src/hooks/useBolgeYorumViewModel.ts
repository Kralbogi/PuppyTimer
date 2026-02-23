// =============================================================================
// PuppyTimer Web - useBolgeYorumViewModel Hook
// Bolge yorumlari state yonetimi (Firestore gercek zamanli)
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import {
  bolgeYorumlariniDinle,
  yorumEkle,
  yorumSil,
} from "../services/bolgeYorumService";
import {
  kullaniciIdGetir,
  kullaniciAdGetir,
} from "../services/kullaniciKimlik";
import { ensureAuth } from "../services/firebase";
import type { BolgeYorum } from "../types/models";

export function useBolgeYorumViewModel(bolgeId: string) {
  const [yorumlar, setYorumlar] = useState<BolgeYorum[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const kullaniciId = kullaniciIdGetir();

  // Yerel yorum kayitlari (kullanici takibi)
  const kullaniciYorumlari =
    useLiveQuery(
      () =>
        db.kullaniciYorumlari.where("bolgeId").equals(bolgeId).toArray(),
      [bolgeId]
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

        unsubscribe = bolgeYorumlariniDinle(bolgeId, (yorumlarData) => {
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
  }, [bolgeId]);

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
        const yorumId = await yorumEkle(bolgeId, icerik, kullaniciAdGetir());

        // Yerel takip icin kaydet
        await db.kullaniciYorumlari.add({
          yorumId,
          bolgeId,
          tarih: Date.now(),
        });
      } catch (err) {
        setHata(
          `Yorum eklenemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [bolgeId]
  );

  // ---------------------------------------------------------------------------
  // Yorum Kaldir
  // ---------------------------------------------------------------------------

  const yorumKaldir = useCallback(
    async (yorumId: string) => {
      const yorum = yorumlar.find((y) => y.id === yorumId);
      if (!yorum || yorum.olusturanId !== kullaniciId) return;

      try {
        await yorumSil(bolgeId, yorumId);

        // Yerel takipten sil
        await db.kullaniciYorumlari.where("yorumId").equals(yorumId).delete();
      } catch (err) {
        setHata(
          `Yorum silinemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [yorumlar, kullaniciId, bolgeId]
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
