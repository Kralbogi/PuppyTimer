import { useState, useEffect, useCallback } from "react";

interface KonumTakipResult {
  konum: [number, number] | null;
  yukleniyor: boolean;
  hata: string | null;
  konumGuncelle: () => Promise<void>;
}

/**
 * Kullanıcı konumunu sürekli takip eder (aktifken)
 * Rota gösterilirken her 10 saniyede bir günceller
 */
export function useKonumTakip(aktif: boolean): KonumTakipResult {
  const [konum, setKonum] = useState<[number, number] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const konumGuncelle = useCallback(async () => {
    try {
      setYukleniyor(true);
      setHata(null);

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });

      setKonum([pos.coords.latitude, pos.coords.longitude]);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setHata("Konum izni verilmedi");
            break;
          case err.POSITION_UNAVAILABLE:
            setHata("Konum belirlenemedi");
            break;
          case err.TIMEOUT:
            setHata("Konum alınırken zaman aşımı");
            break;
        }
      } else {
        setHata("Konum alınırken bir hata oluştu");
      }
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (!aktif) {
      setKonum(null);
      setHata(null);
      return;
    }

    // İlk konum
    konumGuncelle();

    // Her 10 saniyede bir güncelle
    const interval = setInterval(() => {
      konumGuncelle();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [aktif, konumGuncelle]);

  return { konum, yukleniyor, hata, konumGuncelle };
}
