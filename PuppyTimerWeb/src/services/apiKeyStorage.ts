// =============================================================================
// PawLand - API Anahtari Depolama
// AnahtarlikServisi.swift portu (Keychain yerine localStorage)
// =============================================================================

const STORAGE_KEY = "pawland-claude-api-key";

// -----------------------------------------------------------------------------
// kaydet - API anahtarini localStorage'a kaydet
// -----------------------------------------------------------------------------
export function kaydet(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    console.error("[ApiKeyStorage] Kaydetme hatasi:", e);
  }
}

// -----------------------------------------------------------------------------
// getir - API anahtarini localStorage'dan oku
// -----------------------------------------------------------------------------
export function getir(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && value.trim().length > 0) {
      return value;
    }
    return null;
  } catch (e) {
    console.error("[ApiKeyStorage] Okuma hatasi:", e);
    return null;
  }
}

// -----------------------------------------------------------------------------
// sil - API anahtarini localStorage'dan sil
// -----------------------------------------------------------------------------
export function sil(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[ApiKeyStorage] Silme hatasi:", e);
  }
}

// -----------------------------------------------------------------------------
// anahtarVarMi - API anahtarinin var olup olmadigini kontrol et
// -----------------------------------------------------------------------------
export function anahtarVarMi(): boolean {
  return getir() !== null;
}
