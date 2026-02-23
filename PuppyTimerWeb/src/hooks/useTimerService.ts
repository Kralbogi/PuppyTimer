// =============================================================================
// PuppyTimer Web - useTimerService Hook
// ZamanlayiciServisi singleton'ina React hook wrapper'i
// Her saniye guncellenen kalan sureler Map'i saglar
// =============================================================================

import { useState, useEffect } from 'react';
import { zamanlayiciServisi } from '../services/timerService';

export function useTimerService() {
  // ---------------------------------------------------------------------------
  // State - her saniye guncellenen kalan sureler
  // ---------------------------------------------------------------------------

  const [kalanSureler, setKalanSureler] = useState<Map<string, number>>(
    new Map()
  );

  // ---------------------------------------------------------------------------
  // Subscribe / Unsubscribe
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Listener fonksiyonu: timer service her saniye bunu cagirir
    const listener = (sureler: Map<string, number>) => {
      setKalanSureler(new Map(sureler));
    };

    // Abone ol
    zamanlayiciServisi.subscribe(listener);

    // Mevcut durum ile hemen guncelle
    setKalanSureler(new Map(zamanlayiciServisi.kalanSureler));

    // Temizlik: component unmount olunca aboneligi kaldir
    return () => {
      zamanlayiciServisi.unsubscribe(listener);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    kalanSureler,
  };
}
