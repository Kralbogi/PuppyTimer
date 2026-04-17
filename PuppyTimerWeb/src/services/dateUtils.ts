// =============================================================================
// PawLand - Tarih Yardimci Fonksiyonlari
// DateExtensions.swift portlari (Intl.DateTimeFormat, multi-locale support)
// Tarihler number (timestamp in ms) olarak alinir.
// =============================================================================

// Type for supported locales
type Locale = "tr-TR" | "en-US" | "es-ES" | "de-DE" | "fr-FR" | "pt-PT" | "ar-SA";

// -----------------------------------------------------------------------------
// turkceTarihSaat - Medium tarih + kisa saat
// Ornek: "9 Sub 2026 14:30" (tr-TR), "Feb 9, 2026, 2:30 PM" (en-US)
// -----------------------------------------------------------------------------
export function turkceTarihSaat(date: number, locale: Locale = "tr-TR"): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// -----------------------------------------------------------------------------
// turkceTarih - Sadece tarih (medium)
// Ornek: "9 Sub 2026" (tr-TR), "Feb 9, 2026" (en-US)
// -----------------------------------------------------------------------------
export function turkceTarih(date: number, locale: Locale = "tr-TR"): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(d);
}

// -----------------------------------------------------------------------------
// turkceSaat - Sadece saat "HH:mm" formati
// Ornek: "14:30"
// -----------------------------------------------------------------------------
export function turkceSaat(date: number, locale: Locale = "tr-TR"): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// -----------------------------------------------------------------------------
// goreceli - Gorece zaman (locale-aware)
// Ornek: "2 saat once" (tr-TR), "2 hours ago" (en-US), "hace 2 horas" (es-ES)
// -----------------------------------------------------------------------------
export function goreceli(date: number, locale: Locale = "tr-TR"): string {
  const simdi = Date.now();
  const farkMs = date - simdi;
  const farkSaniye = Math.round(farkMs / 1000);
  const farkDakika = Math.round(farkSaniye / 60);
  const farkSaat = Math.round(farkDakika / 60);
  const farkGun = Math.round(farkSaat / 24);
  const farkHafta = Math.round(farkGun / 7);
  const farkAy = Math.round(farkGun / 30);
  const farkYil = Math.round(farkGun / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "long",
  });

  const absSaniye = Math.abs(farkSaniye);
  const absDakika = Math.abs(farkDakika);
  const absSaat = Math.abs(farkSaat);
  const absGun = Math.abs(farkGun);
  const absHafta = Math.abs(farkHafta);
  const absAy = Math.abs(farkAy);

  if (absSaniye < 60) {
    return rtf.format(farkSaniye, "second");
  } else if (absDakika < 60) {
    return rtf.format(farkDakika, "minute");
  } else if (absSaat < 24) {
    return rtf.format(farkSaat, "hour");
  } else if (absGun < 7) {
    return rtf.format(farkGun, "day");
  } else if (absHafta < 4) {
    return rtf.format(farkHafta, "week");
  } else if (absAy < 12) {
    return rtf.format(farkAy, "month");
  } else {
    return rtf.format(farkYil, "year");
  }
}

// -----------------------------------------------------------------------------
// bugunMu - Verilen tarih bugun mu?
// -----------------------------------------------------------------------------
export function bugunMu(date: number): boolean {
  const d = new Date(date);
  const bugun = new Date();
  return (
    d.getFullYear() === bugun.getFullYear() &&
    d.getMonth() === bugun.getMonth() &&
    d.getDate() === bugun.getDate()
  );
}

// -----------------------------------------------------------------------------
// bugunDogumGunuMu - Verilen dogum tarihi bugun mu? (sadece ay ve gun kontrol)
// Her yil kutlanabilmesi icin yil kontrolu yapilmaz
// -----------------------------------------------------------------------------
export function bugunDogumGunuMu(dogumTarihi?: number): boolean {
  if (!dogumTarihi) return false;

  const dogum = new Date(dogumTarihi);
  const bugun = new Date();

  return (
    dogum.getMonth() === bugun.getMonth() &&
    dogum.getDate() === bugun.getDate()
  );
}

// -----------------------------------------------------------------------------
// haftaninGunu - Haftanin gunu (1=Pazar, 2=Pazartesi, ..., 7=Cumartesi)
// JavaScript Date.getDay() ile uyumlu: 0=Pazar ... 6=Cumartesi
// Swift Calendar weekday formatina uyumlu donusturulmus hali
// -----------------------------------------------------------------------------
export function haftaninGunu(date: number): number {
  const d = new Date(date);
  // Swift weekday: 1=Pazar, 2=Pazartesi ... 7=Cumartesi
  return d.getDay() + 1;
}

// -----------------------------------------------------------------------------
// kalanSureMetni - Geri sayim icin "HH:MM:SS" formatinda metin
// ZamanlayiciServisi.kalanSureMetni portu
// -----------------------------------------------------------------------------
export function kalanSureMetni(saniye: number): string {
  if (saniye <= 0) return "00:00:00";

  const toplam = Math.floor(saniye);
  const saat = Math.floor(toplam / 3600);
  const dakika = Math.floor((toplam % 3600) / 60);
  const sn = toplam % 60;

  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${pad(saat)}:${pad(dakika)}:${pad(sn)}`;
}
