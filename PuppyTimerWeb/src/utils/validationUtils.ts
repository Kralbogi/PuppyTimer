// =============================================================================
// PuppyTimer Web - Validation Utilities
// Phone number and profanity detection for content moderation
// =============================================================================

// Phone number patterns (Turkish formats)
const PHONE_PATTERNS = [
  /\b0?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b/g, // 0555 123 45 67
  /\b\+?90\s?5\d{2}\s?\d{3}\s?\d{4}\b/g, // +90 555 1234567
  /\b5\d{9}\b/g, // 5551234567
];

// Profanity list (Turkish)
const KUFUR_LISTESI = [
  "amk",
  "aq",
  "mk",
  "oç",
  "sik",
  "göt",
  "am",
  "yarrak",
  "piç",
  "orospu",
  "amcık",
  "amına",
  "sikerim",
  "sikeyim",
  "götüne",
  "ananı",
];

/**
 * Check if text contains Turkish phone numbers
 */
export function telefonNumarasiIceriyorMu(metin: string): boolean {
  return PHONE_PATTERNS.some((pattern) => pattern.test(metin));
}

/**
 * Check if text contains profanity (Turkish)
 * Normalizes text to catch variations with different Turkish characters
 */
export function kufurIceriyorMu(metin: string): boolean {
  const normalized = metin
    .toLowerCase()
    .replace(/[ıi]/g, "i")
    .replace(/[şs]/g, "s")
    .replace(/[ğg]/g, "g")
    .replace(/[üu]/g, "u")
    .replace(/[öo]/g, "o")
    .replace(/[çc]/g, "c");

  return KUFUR_LISTESI.some((kufur) => {
    const pattern = new RegExp(`\\b${kufur}\\b`, "i");
    return pattern.test(normalized);
  });
}

/**
 * Validate content for phone numbers and profanity
 * @param metin - Text to validate
 * @param moderasyonAktif - Whether moderation is active (false for private messages)
 * @returns Validation result with error message if invalid
 */
export function icerikGecerliMi(
  metin: string,
  moderasyonAktif: boolean = true
): { gecerli: boolean; hata?: string } {
  if (!moderasyonAktif) {
    return { gecerli: true };
  }

  if (telefonNumarasiIceriyorMu(metin)) {
    return {
      gecerli: false,
      hata: "Telefon numarası paylaşmak yasaktır",
    };
  }

  if (kufurIceriyorMu(metin)) {
    return {
      gecerli: false,
      hata: "Küfür içeren içerik paylaşmak yasaktır",
    };
  }

  return { gecerli: true };
}
