// =============================================================================
// PuppyTimer Web - Mesaj View Model Hook
// Private messaging state management
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { auth } from "../services/firebase";
import {
  mesajlariDinle,
  mesajGonder as mesajGonderService,
  okunmayanSifirla,
} from "../services/mesajService";
import type { OzelMesaj } from "../types/models";

export function useMesajViewModel(konusmaId: string | null) {
  const [mesajlar, setMesajlar] = useState<OzelMesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kullaniciId = auth.currentUser?.uid || "";

  // Mesajlari dinle
  useEffect(() => {
    if (!konusmaId) {
      setMesajlar([]);
      return;
    }

    setYukleniyor(true);
    const unsubscribe = mesajlariDinle(konusmaId, (data) => {
      setMesajlar(data);
      setYukleniyor(false);

      // Okunmayan sayisini sifirla
      if (data.length > 0) {
        okunmayanSifirla(konusmaId).catch((err) => {
          console.error("Okunmayan sifirlama hatasi:", err);
        });
      }
    });

    return unsubscribe;
  }, [konusmaId]);

  // Mesaj gonder
  const mesajGonder = useCallback(
    async (icerik: string) => {
      if (!konusmaId) {
        setHata("Konusma bulunamadi");
        return;
      }

      try {
        setHata(null);
        await mesajGonderService(konusmaId, icerik);
      } catch (err) {
        const mesaj = err instanceof Error ? err.message : "Mesaj gonderilemedi";
        setHata(mesaj);
        throw err;
      }
    },
    [konusmaId]
  );

  return {
    mesajlar,
    yukleniyor,
    hata,
    kullaniciId,
    mesajGonder,
  };
}
