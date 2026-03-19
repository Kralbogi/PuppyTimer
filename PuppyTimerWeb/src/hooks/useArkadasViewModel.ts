// =============================================================================
// PawLand - Arkadas Yonetimi Hook
// Arkadas istekleri, kabul/red, online durum takibi
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../db/database";
import {
  arkadasIstegiGonder,
  arkadasIstegiKabulEt,
  arkadasIstegiReddet,
  arkadaslikSonlandir,
  gelenArkadasIstekleriniDinle,
  arkadaslarimiDinle,
  onlineDurumlariDinle,
  arkadasMi,
  bekleyenIstekVarMi,
} from "../services/arkadasService";
import type { KopekArkadas } from "../types/models";
import { auth } from "../services/firebase";

export function useArkadasViewModel() {
  const [gelenIstekler, setGelenIstekler] = useState<KopekArkadas[]>([]);
  const [arkadaslar, setArkadaslar] = useState<KopekArkadas[]>([]);
  const [onlineDurumlar, setOnlineDurumlar] = useState<Map<string, boolean>>(
    new Map()
  );
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kullaniciId = auth.currentUser?.uid || "";

  // Gelen istekleri dinle
  useEffect(() => {
    if (!kullaniciId) return;

    const unsubscribe = gelenArkadasIstekleriniDinle(setGelenIstekler);
    return unsubscribe;
  }, [kullaniciId]);

  // Arkadaslari dinle
  useEffect(() => {
    if (!kullaniciId) return;

    const unsubscribe = arkadaslarimiDinle((data) => {
      setArkadaslar(data);

      // Yerel veritabanini guncelle
      data.forEach(async (arkadas) => {
        const karsiTarafId =
          arkadas.gonderenId === kullaniciId
            ? arkadas.aliciId
            : arkadas.gonderenId;

        const mevcut = await db.kullaniciArkadaslar
          .where("arkadasId")
          .equals(arkadas.id)
          .first();

        if (!mevcut) {
          await db.kullaniciArkadaslar.add({
            arkadasId: arkadas.id,
            karsiTarafId,
            kopekId: arkadas.kopekId,
            kopekAd: arkadas.kopekAd,
            tarih: Date.now(),
          });
        }
      });
    });

    return unsubscribe;
  }, [kullaniciId]);

  // Online durumlari dinle
  useEffect(() => {
    if (arkadaslar.length === 0) return;

    const kullaniciIdler = arkadaslar.map((a) =>
      a.gonderenId === kullaniciId ? a.aliciId : a.gonderenId
    );

    const unsubscribe = onlineDurumlariDinle(kullaniciIdler, setOnlineDurumlar);
    return unsubscribe;
  }, [arkadaslar, kullaniciId]);

  // Arkadas istegi gonder
  const istekGonder = useCallback(
    async (aliciId: string, aliciAd: string, kopekId: string, kopekAd: string) => {
      setYukleniyor(true);
      setHata(null);
      try {
        await arkadasIstegiGonder(aliciId, aliciAd, kopekId, kopekAd);
      } catch (err) {
        const mesaj = err instanceof Error ? err.message : "Istek gonderilemedi";
        setHata(mesaj);
        throw err;
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  // Istegi kabul et
  const istekKabulEt = useCallback(async (arkadasId: string) => {
    setYukleniyor(true);
    setHata(null);
    try {
      await arkadasIstegiKabulEt(arkadasId);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : "Istek kabul edilemedi";
      setHata(mesaj);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  // Istegi reddet
  const istekReddet = useCallback(async (arkadasId: string) => {
    setYukleniyor(true);
    setHata(null);
    try {
      await arkadasIstegiReddet(arkadasId);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : "Istek reddedilemedi";
      setHata(mesaj);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  // Arkadasligi sonlandir
  const arkadasSil = useCallback(async (arkadasId: string) => {
    setYukleniyor(true);
    setHata(null);
    try {
      await arkadaslikSonlandir(arkadasId);
      // Yerel veritabanindan da sil
      await db.kullaniciArkadaslar.where("arkadasId").equals(arkadasId).delete();
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : "Arkadaslik sonlandirilamadi";
      setHata(mesaj);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  // Belirli bir kopek icin arkadas mi kontrol et
  const arkadasKontrol = useCallback(
    async (kopekOlusturanId: string, kopekId: string): Promise<boolean> => {
      try {
        return await arkadasMi(kopekOlusturanId, kopekId);
      } catch {
        return false;
      }
    },
    []
  );

  // Belirli bir kopek icin bekleyen istek var mi kontrol et
  const bekleyenIstekKontrol = useCallback(
    async (kopekOlusturanId: string, kopekId: string): Promise<boolean> => {
      try {
        return await bekleyenIstekVarMi(kopekOlusturanId, kopekId);
      } catch {
        return false;
      }
    },
    []
  );

  // Online arkadas sayisi
  const onlineArkadasSayisi = useMemo(() => {
    let sayac = 0;
    for (const [, online] of onlineDurumlar) {
      if (online) sayac++;
    }
    return sayac;
  }, [onlineDurumlar]);

  return {
    gelenIstekler,
    arkadaslar,
    onlineDurumlar,
    onlineArkadasSayisi,
    yukleniyor,
    hata,
    kullaniciId,
    istekGonder,
    istekKabulEt,
    istekReddet,
    arkadasSil,
    arkadasKontrol,
    bekleyenIstekKontrol,
  };
}
