// =============================================================================
// PuppyTimer Web - Konusma Listesi View Model Hook
// Manages conversation list state for Friends page
// =============================================================================

import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { konusmalarimDinle } from "../services/mesajService";
import type { MesajKonusma } from "../types/models";

export function useKonusmaListesiViewModel() {
  const [konusmalar, setKonusmalar] = useState<MesajKonusma[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kullaniciId = auth.currentUser?.uid || "";

  // Konusmalari dinle
  useEffect(() => {
    if (!kullaniciId) {
      setKonusmalar([]);
      return;
    }

    setYukleniyor(true);
    const unsubscribe = konusmalarimDinle((data) => {
      setKonusmalar(data);
      setYukleniyor(false);
    });

    return unsubscribe;
  }, [kullaniciId]);

  // Toplam okunmayan mesaj sayisi
  const toplamOkunmayanSayisi = konusmalar.reduce((toplam, konusma) => {
    return toplam + (konusma.okunmayanSayisi?.[kullaniciId] || 0);
  }, 0);

  return {
    konusmalar,
    yukleniyor,
    kullaniciId,
    toplamOkunmayanSayisi,
  };
}
