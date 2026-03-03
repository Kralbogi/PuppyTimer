// =============================================================================
// PuppyTimer Web - Language Service
// Manages language preference in localStorage and Firestore
// =============================================================================

import { doc, setDoc, getDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import { kullaniciId } from "./authService";
import type { Language } from "../contexts/LanguageContext";

const STORAGE_KEY = "puppytimer_language";

// -----------------------------------------------------------------------------
// localStorage Management
// -----------------------------------------------------------------------------

export function kaydetDil(language: Language): void {
  localStorage.setItem(STORAGE_KEY, language);
  // Also sync to Firestore if user is logged in
  kaydetFirestore(language).catch((error) => {
    console.warn("Failed to sync language to Firestore:", error);
  });
}

export function getDil(): Language | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isValidLanguage(saved)) {
    return saved as Language;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Firestore Management
// -----------------------------------------------------------------------------

interface KullaniciTercihi {
  language: Language;
  country?: string;
  updatedAt: number;
}

export async function kaydetFirestore(language: Language, country?: string): Promise<void> {
  const uid = kullaniciId();
  if (!uid) {
    // User not logged in, only save to localStorage
    return;
  }

  const tercihRef = doc(firestore, "kullaniciTercihleri", uid);
  const tercih: KullaniciTercihi = {
    language,
    country,
    updatedAt: Date.now(),
  };

  await setDoc(tercihRef, tercih, { merge: true });
}

export async function getFirestore(): Promise<KullaniciTercihi | null> {
  const uid = kullaniciId();
  if (!uid) {
    return null;
  }

  const tercihRef = doc(firestore, "kullaniciTercihleri", uid);
  const tercihSnap = await getDoc(tercihRef);

  if (tercihSnap.exists()) {
    return tercihSnap.data() as KullaniciTercihi;
  }

  return null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isValidLanguage(lang: string): boolean {
  return ["tr", "en", "es", "de", "fr", "pt", "ar"].includes(lang);
}

// Sync from Firestore to localStorage (call this on app init after login)
export async function senkronizeEt(): Promise<void> {
  const firestoreTercih = await getFirestore();
  if (firestoreTercih && firestoreTercih.language) {
    const localDil = getDil();
    // If Firestore has a preference and it's different from local, use Firestore
    if (!localDil || localDil !== firestoreTercih.language) {
      localStorage.setItem(STORAGE_KEY, firestoreTercih.language);
    }
  }
}
