// =============================================================================
// PuppyTimer Web - Hatırlatıcı Servisi (localStorage)
// Hem HatirlaticiPage hem de alarm checker tarafından kullanılır
// =============================================================================

import type { Hatirlatici } from "../types/models";

export const TUR_EMOJI: Record<string, string> = {
  beslenme: "🍖",
  yuruyus: "🐾",
  ilac: "💊",
  asi: "💉",
  bakim: "✨",
  veteriner: "🏥",
  diger: "🔔",
};

export function hatirlaticiStorageKey(kopekId: number): string {
  return `puppytimer_hatirlaticilar_${kopekId}`;
}

export function hatirlaticilarYukle(kopekId: number): Hatirlatici[] {
  try {
    const raw = localStorage.getItem(hatirlaticiStorageKey(kopekId));
    if (!raw) return [];
    return JSON.parse(raw) as Hatirlatici[];
  } catch {
    return [];
  }
}

export function hatirlaticilarKaydet(kopekId: number, liste: Hatirlatici[]): void {
  localStorage.setItem(hatirlaticiStorageKey(kopekId), JSON.stringify(liste));
}

/**
 * Şu anki zamanda tetiklenmesi gereken ve henüz bugün tetiklenmemiş hatırlatıcıyı döndürür.
 * Tetiklenince localStorage'a "fired" kaydı bırakır.
 */
export function alarmKontrolEt(kopekId: number): Hatirlatici | null {
  const hatirlaticilar = hatirlaticilarYukle(kopekId);
  const simdi = new Date();
  const currentHHMM = `${String(simdi.getHours()).padStart(2, "0")}:${String(
    simdi.getMinutes()
  ).padStart(2, "0")}`;
  // JS getDay() 0=Pazar, 1=Pazartesi...6=Cumartesi
  // Bizim sistemimiz 0=Pzt, 1=Sal ... 6=Paz
  const jsDay = simdi.getDay(); // 0=Sunday
  const ourDay = jsDay === 0 ? 6 : jsDay - 1;
  const todayStr = simdi.toDateString();

  for (const h of hatirlaticilar) {
    if (!h.aktif) continue;
    if (h.saat !== currentHHMM) continue;
    if (!h.gunler.includes(ourDay)) continue;

    const firedKey = `puppytimer_alarm_fired_${kopekId}_${todayStr}_${h.id}`;
    if (localStorage.getItem(firedKey)) continue;

    // Bu alarmı bugün için işaretleme
    localStorage.setItem(firedKey, "1");
    return h;
  }

  return null;
}
