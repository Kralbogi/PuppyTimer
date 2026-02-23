// =============================================================================
// PuppyTimer Web - useToplulukViewModel Hook
// Topluluk haritasi state yonetimi (Firestore gercek zamanli)
// Bolgeler + Kopek paylasimi
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import {
  bolgeleriDinle,
  bolgeEkle,
  bolgeSil,
  bolgeBegen,
  canliAlgila,
} from "../services/toplulukService";
import {
  toplulukKopekleriDinle,
  kopekPaylas as kopekPaylasServis,
  kopekGeriCek as kopekGeriCekServis,
  kucukResimOlustur,
  kopekBegen,
} from "../services/toplulukKopekService";
import {
  kullaniciIdGetir,
  kullaniciAdGetir,
} from "../services/kullaniciKimlik";
import { ensureAuth } from "../services/firebase";
import { onlineDurumlariDinle } from "../services/arkadasService";
import type { ToplulukBolge, ToplulukKopek, Kopek } from "../types/models";
import { BolgeTuru } from "../types/enums";

export function useToplulukViewModel() {
  const [hamBolgeler, setHamBolgeler] = useState<ToplulukBolge[]>([]);
  const [hamKopekler, setHamKopekler] = useState<ToplulukKopek[]>([]);
  const [onlineDurumlar, setOnlineDurumlar] = useState<Map<string, boolean>>(new Map());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopekYukleniyor, setKopekYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [secilenFiltreler, setSecilenFiltreler] = useState<Set<BolgeTuru>>(
    new Set()
  );
  const [kopeklerGorunur, setKopeklerGorunur] = useState(true);

  const kullaniciId = kullaniciIdGetir();

  // Yerel begeni kayitlari (cift begeni engeli)
  const begenilenler =
    useLiveQuery(() => db.kullaniciBegenleri.toArray()) ?? [];
  const begenilenIdler = useMemo(
    () => new Set(begenilenler.map((b) => b.bolgeId)),
    [begenilenler]
  );

  // Yerel kopek begeni kayitlari (cift begeni engeli)
  const kopekBegenilenler =
    useLiveQuery(() => db.kullaniciKopekBegenleri.toArray()) ?? [];
  const kopekBegenilenIdler = useMemo(
    () => new Set(kopekBegenilenler.map((b) => b.kopekId)),
    [kopekBegenilenler]
  );

  // ---------------------------------------------------------------------------
  // Firestore dinleyiciler
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        setYukleniyor(true);
        setHata(null);

        // Auth'u baslatmadan once dinleyiciyi kurma
        await ensureAuth();

        unsubscribe = bolgeleriDinle((bolgeler) => {
          setHamBolgeler(bolgeler);
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
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        setKopekYukleniyor(true);

        // Auth'u baslatmadan once dinleyiciyi kurma
        await ensureAuth();

        unsubscribe = toplulukKopekleriDinle((kopekler) => {
          setHamKopekler(kopekler);
          setKopekYukleniyor(false);
        });
      } catch (err) {
        setHata(`Auth hatası: ${err instanceof Error ? err.message : String(err)}`);
        setKopekYukleniyor(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Online durum takibi - tum kopek sahiplerinin online durumunu dinle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (hamKopekler.length === 0) {
      setOnlineDurumlar(new Map());
      return;
    }

    // Tum kopek sahiplerinin ID'lerini topla
    const sahipIdleri = Array.from(new Set(hamKopekler.map((k) => k.olusturanId)));

    const unsubscribe = onlineDurumlariDinle(sahipIdleri, setOnlineDurumlar);

    return unsubscribe;
  }, [hamKopekler]);

  // ---------------------------------------------------------------------------
  // Online kullanicilarin kopeklerini filtrele + Zaman bazli filtreleme
  // ---------------------------------------------------------------------------

  const toplulukKopekleri = useMemo(() => {
    const besDakikaOnce = Date.now() - 5 * 60 * 1000;

    return hamKopekler.filter((kopek) => {
      // Kendi kopegimse her zaman goster
      if (kopek.olusturanId === kullaniciId) return true;

      // Son 5 dakika icinde guncellenmeyen kayitlari gosterme (stale data)
      if (kopek.guncellemeTarihi < besDakikaOnce) {
        return false;
      }

      // Online durum kontrol - Online durumlar henuz yuklenmemisse goster
      if (onlineDurumlar.size === 0) return true;

      // Kullanicinin online durumu
      const online = onlineDurumlar.get(kopek.olusturanId);

      // Online durumu yoksa veya offline ise gosterme
      return online === true;
    });
  }, [hamKopekler, onlineDurumlar, kullaniciId]);

  // ---------------------------------------------------------------------------
  // Canli bolge algilama + filtreleme
  // ---------------------------------------------------------------------------

  const bolgeler = useMemo(() => canliAlgila(hamBolgeler), [hamBolgeler]);

  const filtrelenmisler = useMemo(() => {
    if (secilenFiltreler.size === 0) return bolgeler;
    return bolgeler.filter((b) => secilenFiltreler.has(b.tur));
  }, [bolgeler, secilenFiltreler]);

  // ---------------------------------------------------------------------------
  // Benim paylasimlarim
  // ---------------------------------------------------------------------------

  const benimPaylasimlarim = useMemo(
    () => toplulukKopekleri.filter((k) => k.olusturanId === kullaniciId),
    [toplulukKopekleri, kullaniciId]
  );

  // ---------------------------------------------------------------------------
  // Filtre Toggle
  // ---------------------------------------------------------------------------

  const filtreToggle = useCallback((tur: BolgeTuru) => {
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

  const kopekFiltreToggle = useCallback(() => {
    setKopeklerGorunur((prev) => !prev);
  }, []);

  // ---------------------------------------------------------------------------
  // Bolge Ekle (Kullanici basina 1 tehlikeli + 1 sosyal limit)
  // ---------------------------------------------------------------------------

  const yeniBolgeEkle = useCallback(
    async (data: {
      baslik: string;
      aciklama: string;
      tur: BolgeTuru;
      yaricap: number;
      enlem: number;
      boylam: number;
    }) => {
      try {
        // Kullanicinin mevcut bolgeleri
        const benimBolgelerim = hamBolgeler.filter((b) => b.olusturanId === kullaniciId);
        const ayniTurBolge = benimBolgelerim.find((b) => b.tur === data.tur);

        // Limit kontrolu
        if (ayniTurBolge) {
          const turAdi = data.tur === BolgeTuru.Tehlikeli ? "Tehlikeli" : "Sosyal";
          setHata(`Zaten bir ${turAdi} bölgeniz var. Önce onu silmeniz gerekiyor.`);
          return;
        }

        await bolgeEkle({
          olusturanId: kullaniciId,
          olusturanAd: kullaniciAdGetir(),
          baslik: data.baslik,
          aciklama: data.aciklama || undefined,
          enlem: data.enlem,
          boylam: data.boylam,
          yaricap: data.yaricap,
          tur: data.tur,
          olusturmaTarihi: Date.now(),
          guncellemeTarihi: Date.now(),
          aktif: true,
          begeniler: 0,
          canli: false,
        });
      } catch (err) {
        setHata(
          `Bölge eklenemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [kullaniciId, hamBolgeler]
  );

  // ---------------------------------------------------------------------------
  // Otomatik sosyal bolge olusturma (3+ kopek 200m icinde)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (kopekYukleniyor || hamKopekler.length < 3) return;

    // Haversine mesafe hesaplama
    const haversineUzaklik = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Cluster tespit et (3+ kopek 200m icinde)
    const clusterBul = () => {
      for (let i = 0; i < hamKopekler.length; i++) {
        const yakinlar = [hamKopekler[i]];

        for (let j = 0; j < hamKopekler.length; j++) {
          if (i === j) continue;
          const mesafe = haversineUzaklik(
            hamKopekler[i].enlem,
            hamKopekler[i].boylam,
            hamKopekler[j].enlem,
            hamKopekler[j].boylam
          );
          if (mesafe <= 200) {
            yakinlar.push(hamKopekler[j]);
          }
        }

        // 3+ kopek bulundu
        if (yakinlar.length >= 3) {
          // Bu bolgede zaten bir sosyal bolge var mi kontrol et
          const merkezEnlem = yakinlar.reduce((sum, k) => sum + k.enlem, 0) / yakinlar.length;
          const merkezBoylam = yakinlar.reduce((sum, k) => sum + k.boylam, 0) / yakinlar.length;

          const mevcutBolge = hamBolgeler.find((b) => {
            if (b.tur !== BolgeTuru.Sosyal) return false;
            const mesafe = haversineUzaklik(b.enlem, b.boylam, merkezEnlem, merkezBoylam);
            return mesafe <= 50; // 50m icinde varsa ayni bolge kabul et
          });

          if (!mevcutBolge) {
            // Otomatik sosyal bolge olustur
            yeniBolgeEkle({
              baslik: "🐕 Köpek Buluşma Noktası",
              aciklama: `${yakinlar.length} köpek burada! Otomatik oluşturuldu.`,
              tur: BolgeTuru.Sosyal,
              yaricap: 100,
              enlem: merkezEnlem,
              boylam: merkezBoylam,
            });
            return; // Bir cluster icin bir bolge yeterli
          }
        }
      }
    };

    // 5 saniye bekle, sonra cluster kontrol et (cok sik calismasin diye)
    const timer = setTimeout(clusterBul, 5000);
    return () => clearTimeout(timer);
  }, [hamKopekler, kopekYukleniyor, hamBolgeler, yeniBolgeEkle]);

  // ---------------------------------------------------------------------------
  // Bolge Sil
  // ---------------------------------------------------------------------------

  const bolgeKaldir = useCallback(
    async (bolgeId: string) => {
      const bolge = hamBolgeler.find((b) => b.id === bolgeId);
      if (!bolge || bolge.olusturanId !== kullaniciId) return;
      try {
        await bolgeSil(bolgeId);
      } catch (err) {
        setHata(
          `Bölge silinemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [hamBolgeler, kullaniciId]
  );

  // ---------------------------------------------------------------------------
  // Bolge Begen
  // ---------------------------------------------------------------------------

  const bolgeBegenle = useCallback(
    async (bolgeId: string) => {
      if (begenilenIdler.has(bolgeId)) return; // zaten begenmis
      try {
        await bolgeBegen(bolgeId);
        await db.kullaniciBegenleri.add({
          bolgeId,
          tarih: Date.now(),
        });
      } catch (err) {
        setHata(
          `Beğeni kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [begenilenIdler]
  );

  // ---------------------------------------------------------------------------
  // Kopek Paylas
  // ---------------------------------------------------------------------------

  const kopekPaylasFunc = useCallback(
    async (kopek: Kopek, enlem: number, boylam: number) => {
      try {
        let thumbnailData: string | undefined;
        const fotoKaynak = kopek.avatarData || kopek.fotoData;
        if (fotoKaynak) {
          thumbnailData = await kucukResimOlustur(fotoKaynak);
        }

        await kopekPaylasServis({
          olusturanId: kullaniciId,
          olusturanAd: kullaniciAdGetir(),
          kopekAd: kopek.ad,
          irk: kopek.irk,
          cinsiyet: kopek.cinsiyet,
          dogumTarihi: kopek.dogumTarihi,
          agirlik: kopek.agirlik,
          kisir: kopek.kisir ?? false,
          thumbnailData,
          renkler: kopek.renkler,
          aksesuarlar: kopek.aksesuarlar,
          cerceveTipi: kopek.cerceveTipi,
          mesajRengi: kopek.mesajRengi,
          begeniler: 0,
          toplamBegeniler: 0,
          enlem,
          boylam,
          olusturmaTarihi: Date.now(),
          guncellemeTarihi: Date.now(),
          aktif: true,
        });
      } catch (err) {
        setHata(
          `Köpek paylaşılamadı: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [kullaniciId]
  );

  // ---------------------------------------------------------------------------
  // Kopek Geri Cek
  // ---------------------------------------------------------------------------

  const kopekGeriCekFunc = useCallback(
    async (kopekId: string) => {
      const kopek = toplulukKopekleri.find((k) => k.id === kopekId);
      if (!kopek || kopek.olusturanId !== kullaniciId) return;
      try {
        await kopekGeriCekServis(kopekId);
      } catch (err) {
        setHata(
          `Köpek geri çekilemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [toplulukKopekleri, kullaniciId]
  );

  // ---------------------------------------------------------------------------
  // Kopek Begen
  // ---------------------------------------------------------------------------

  const kopekBegenle = useCallback(
    async (kopekId: string) => {
      if (kopekBegenilenIdler.has(kopekId)) return; // zaten begenmis
      try {
        await kopekBegen(kopekId);
        await db.kullaniciKopekBegenleri.add({
          kopekId,
          tarih: Date.now(),
        });
      } catch (err) {
        setHata(
          `Köpek beğeni kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [kopekBegenilenIdler]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    bolgeler: filtrelenmisler,
    tumBolgeler: bolgeler,
    yukleniyor,
    hata,
    kullaniciId,
    secilenFiltreler,
    begenilenIdler,
    filtreToggle,
    yeniBolgeEkle,
    bolgeKaldir,
    bolgeBegenle,
    // Kopek paylasimi
    toplulukKopekleri,
    kopekYukleniyor,
    kopeklerGorunur,
    kopekFiltreToggle,
    benimPaylasimlarim,
    kopekPaylas: kopekPaylasFunc,
    kopekGeriCek: kopekGeriCekFunc,
    kopekBegenilenIdler,
    kopekBegenle,
  };
}
