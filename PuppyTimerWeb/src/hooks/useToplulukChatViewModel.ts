// =============================================================================
// PuppyTimer Web - Topluluk Chat ViewModel
// State management for community chat widget
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import {
  toplulukMesajiGonder,
  toplulukMesajlariniDinle,
  mesajHakkiKontrol,
  engellenenKullanicilar,
} from "../services/toplulukChatService";
import type { ToplulukMesaj } from "../types/models";

interface ToplulukChatViewModel {
  mesajlar: ToplulukMesaj[];
  yukleniyor: boolean;
  hata: string | null;
  kalanHak: number;
  sonMesajZamani: number | null;
  yeniMesajSayisi: number;
  mesajGonder: (icerik: string) => Promise<void>;
  mesajHakkiniKontrolEt: () => void;
  yeniMesajlariIsaretle: () => void;
}

export function useToplulukChatViewModel(): ToplulukChatViewModel {
  const [mesajlar, setMesajlar] = useState<ToplulukMesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [kalanHak, setKalanHak] = useState(5);
  const [sonMesajZamani, setSonMesajZamani] = useState<number | null>(null);
  const [yeniMesajSayisi, setYeniMesajSayisi] = useState(0);
  const [sonGorulenMesajSayisi, setSonGorulenMesajSayisi] = useState(0);

  // Real-time listener for messages
  useEffect(() => {
    const unsubscribe = toplulukMesajlariniDinle((yeniMesajlar) => {
      // Filter out blocked users
      const engellenenler = engellenenKullanicilar();
      const filtrelenmis = yeniMesajlar.filter(
        (mesaj) => !engellenenler.includes(mesaj.gonderenId)
      );

      setMesajlar(filtrelenmis);
      setYukleniyor(false);

      // Calculate new message count
      if (sonGorulenMesajSayisi > 0) {
        const yeniSayisi = Math.max(
          0,
          filtrelenmis.length - sonGorulenMesajSayisi
        );
        setYeniMesajSayisi(yeniSayisi);
      }
    });

    return () => unsubscribe();
  }, [sonGorulenMesajSayisi]);

  // Check rate limit on mount and periodically
  useEffect(() => {
    const kontrolEt = () => {
      const { kalanHak: yeniKalanHak, sonMesajZamani: yeniSonMesaj } =
        mesajHakkiKontrol();
      setKalanHak(yeniKalanHak);
      setSonMesajZamani(yeniSonMesaj);
    };

    // Initial check
    kontrolEt();

    // Check every 10 seconds
    const interval = setInterval(kontrolEt, 10000);

    return () => clearInterval(interval);
  }, []);

  // Send message
  const mesajGonder = useCallback(
    async (icerik: string) => {
      setHata(null);

      try {
        await toplulukMesajiGonder(icerik);

        // Update rate limit info
        const { kalanHak: yeniKalanHak, sonMesajZamani: yeniSonMesaj } =
          mesajHakkiKontrol();
        setKalanHak(yeniKalanHak);
        setSonMesajZamani(yeniSonMesaj);
      } catch (error) {
        if (error instanceof Error) {
          setHata(error.message);
        } else {
          setHata("Mesaj gönderilemedi");
        }
        throw error;
      }
    },
    []
  );

  // Manually refresh rate limit
  const mesajHakkiniKontrolEt = useCallback(() => {
    const { kalanHak: yeniKalanHak, sonMesajZamani: yeniSonMesaj } =
      mesajHakkiKontrol();
    setKalanHak(yeniKalanHak);
    setSonMesajZamani(yeniSonMesaj);
  }, []);

  // Mark new messages as seen
  const yeniMesajlariIsaretle = useCallback(() => {
    setSonGorulenMesajSayisi(mesajlar.length);
    setYeniMesajSayisi(0);
  }, [mesajlar.length]);

  return {
    mesajlar,
    yukleniyor,
    hata,
    kalanHak,
    sonMesajZamani,
    yeniMesajSayisi,
    mesajGonder,
    mesajHakkiniKontrolEt,
    yeniMesajlariIsaretle,
  };
}
