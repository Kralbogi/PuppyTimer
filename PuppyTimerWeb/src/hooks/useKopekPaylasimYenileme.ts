// =============================================================================
// PuppyTimer Web - useKopekPaylasimYenileme Hook
// Periodic location refresh with user confirmation
// =============================================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { kopekKonumGuncelle } from "../services/toplulukKopekService";

const REFRESH_INTERVAL = 180000; // 3 minutes in milliseconds

export function useKopekPaylasimYenileme(
  kopekId: string | null,
  onPaylasimSona: () => void
) {
  const [toastGoster, setToastGoster] = useState(false);
  const timerRef = useRef<number | null>(null);
  const locationWatchRef = useRef<number | null>(null);

  // Update location and restart timer
  const konumGuncelleVeYenile = useCallback(async () => {
    if (!kopekId) return;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        });
      });

      await kopekKonumGuncelle(
        kopekId,
        pos.coords.latitude,
        pos.coords.longitude
      );

      // Schedule next refresh prompt
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setToastGoster(true);
      }, REFRESH_INTERVAL);
    } catch (err) {
      console.error("Konum güncellenemedi:", err);
      // Don't stop sharing on location error, just schedule next attempt
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setToastGoster(true);
      }, REFRESH_INTERVAL);
    }
  }, [kopekId]);

  // User clicked "Evet" (Yes) - continue sharing
  const devamEt = useCallback(() => {
    setToastGoster(false);
    konumGuncelleVeYenile();
  }, [konumGuncelleVeYenile]);

  // User clicked "Hayır" (No) - stop sharing
  const durdur = useCallback(() => {
    setToastGoster(false);
    onPaylasimSona();
  }, [onPaylasimSona]);

  // User clicked close (X) - same as "Hayır"
  const toastKapat = useCallback(() => {
    setToastGoster(false);
    onPaylasimSona();
  }, [onPaylasimSona]);

  // Initialize timer and location watch when kopekId is set
  useEffect(() => {
    if (kopekId) {
      // Start initial timer for first refresh prompt
      timerRef.current = window.setTimeout(() => {
        setToastGoster(true);
      }, REFRESH_INTERVAL);

      // Optional: Watch location for real-time updates (low accuracy to save battery)
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          kopekKonumGuncelle(kopekId, pos.coords.latitude, pos.coords.longitude)
            .catch(console.error);
        },
        console.error,
        {
          enableHighAccuracy: false,
          maximumAge: 60000, // 1 minute
          timeout: 30000,
        }
      );
    }

    // Cleanup on unmount or when kopekId changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
    };
  }, [kopekId]);

  return {
    toastGoster,
    devamEt,
    durdur,
    toastKapat,
  };
}
