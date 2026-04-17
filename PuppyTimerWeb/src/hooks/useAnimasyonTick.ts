// =============================================================================
// PawLand - Paylasimli Animasyon Tick Hook
// Tum PulsingCircle bilesenleri ayni tick'i kullanir (performans icin)
// =============================================================================

import { useState, useEffect } from "react";

export function useAnimasyonTick(hizMs: number = 2000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const t = ((Date.now() - start) % hizMs) / hizMs;
      setTick(Math.sin(t * Math.PI * 2) * 0.5 + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [hizMs]);

  return tick;
}
