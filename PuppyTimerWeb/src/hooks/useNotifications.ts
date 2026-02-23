// =============================================================================
// PuppyTimer Web - useNotifications Hook
// Browser Notification API wrapper'i
// Bildirim izni isteme ve bildirim gonderme
// =============================================================================

import { useState, useCallback, useEffect } from 'react';

type IzinDurumu = 'granted' | 'denied' | 'default';

export function useNotifications() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [izinDurumu, setIzinDurumu] = useState<IzinDurumu>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission as IzinDurumu;
  });

  // ---------------------------------------------------------------------------
  // Izin durumunu takip et
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Izin durumunu guncelle (permission degisebilir)
    setIzinDurumu(Notification.permission as IzinDurumu);

    // PermissionStatus API destegi varsa degisiklikleri dinle
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          const handleChange = () => {
            setIzinDurumu(Notification.permission as IzinDurumu);
          };
          status.addEventListener('change', handleChange);
          // Bu listener'i temizleme yolu yok cunku status referansi closure icinde
          // Ama component yasam suresi boyunca sorun degil
        })
        .catch(() => {
          // permissions API desteklenmiyorsa sessizce devam et
        });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Izin Iste
  // ---------------------------------------------------------------------------

  const izinIste = useCallback(async (): Promise<IzinDurumu> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }

    try {
      const sonuc = await Notification.requestPermission();
      const durum = sonuc as IzinDurumu;
      setIzinDurumu(durum);
      return durum;
    } catch {
      // Safari eski surumlerinde callback-based API kullanilir
      return new Promise((resolve) => {
        Notification.requestPermission((sonuc) => {
          const durum = sonuc as IzinDurumu;
          setIzinDurumu(durum);
          resolve(durum);
        });
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Bildirim Gonder
  // ---------------------------------------------------------------------------

  const bildirimiGonder = useCallback(
    (baslik: string, icerik: string, ikon?: string): Notification | null => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      if (Notification.permission !== 'granted') {
        return null;
      }

      try {
        const bildirim = new Notification(baslik, {
          body: icerik,
          icon: ikon || '/paw-icon.png',
          badge: '/paw-icon.png',
          tag: `puppytimer-${Date.now()}`,
        });

        return bildirim;
      } catch {
        // Service Worker gerektirebilir (mobile browsers)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            baslik,
            icerik,
            ikon,
          });
        }
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    izinDurumu,
    izinIste,
    bildirimiGonder,
  };
}
