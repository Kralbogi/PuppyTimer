// =============================================================================
// PuppyTimer Web - Kullanici Kimligi
// Firebase Auth ile kimlik yonetimi + eşsiz rümuz kontrolü
// =============================================================================

import { mevcutKullanici } from "./authService";
import { firestore } from "./firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

const RUMUZ_KOLEKSIYON = "kullaniciRumuzlar";

// Rümuz normalize et: trim, küçük harf, izin verilen karakterler
export function rumuzNormalize(ad: string): string {
  return ad.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_çğışöüâîû]/gi, "").substring(0, 30);
}

export function kullaniciIdGetir(): string {
  const user = mevcutKullanici();
  if (!user) {
    throw new Error("Kullanici girisi yapilmamis");
  }
  return user.uid;
}

export function kullaniciAdGetir(): string {
  const user = mevcutKullanici();
  if (!user) {
    throw new Error("Kullanici girisi yapilmamis");
  }
  return user.displayName || user.email?.split("@")[0] || "Kullanici";
}

// Rümuzun kullanılabilirliğini kontrol eder
// "musait"  → kimse almamış
// "kendin"  → zaten senin
// "alinmis" → başkası kullanıyor
export async function rumuzKontrolEt(
  istenenRumuz: string
): Promise<"musait" | "alinmis" | "kendin"> {
  const normalized = rumuzNormalize(istenenRumuz);
  if (!normalized || normalized.length < 2) return "musait";

  const docRef = doc(firestore, RUMUZ_KOLEKSIYON, normalized);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return "musait";

  const user = mevcutKullanici();
  if (!user) return "alinmis";

  return snap.data().uid === user.uid ? "kendin" : "alinmis";
}

// Rümuz güncelle — Firestore transaction ile atomik kontrol + yazma
export async function kullaniciAdiniGuncelle(yeniAd: string): Promise<void> {
  const user = mevcutKullanici();
  if (!user) {
    throw new Error("Kullanici girisi yapilmamis");
  }

  const trimmed = yeniAd.trim();
  const normalized = rumuzNormalize(trimmed);

  if (!normalized || normalized.length < 2) {
    throw new Error("Rümuz en az 2 karakter olmalıdır.");
  }

  const yeniDocRef = doc(firestore, RUMUZ_KOLEKSIYON, normalized);

  const eskiAd = user.displayName ? rumuzNormalize(user.displayName) : null;
  const eskiDocRef = eskiAd && eskiAd !== normalized
    ? doc(firestore, RUMUZ_KOLEKSIYON, eskiAd)
    : null;

  await runTransaction(firestore, async (tx) => {
    const yeniSnap = await tx.get(yeniDocRef);

    // Başkası bu rümuzu almışsa hata fırlat
    if (yeniSnap.exists() && yeniSnap.data().uid !== user.uid) {
      throw new Error("Bu rümuz zaten kullanılıyor. Lütfen başka bir isim seçin.");
    }

    // Eski rümuz kaydını temizle
    if (eskiDocRef) {
      const eskiSnap = await tx.get(eskiDocRef);
      if (eskiSnap.exists() && eskiSnap.data().uid === user.uid) {
        tx.delete(eskiDocRef);
      }
    }

    // Yeni rümuzu kaydet
    tx.set(yeniDocRef, {
      uid: user.uid,
      displayName: trimmed,
      tarih: Date.now(),
    });
  });

  // Firebase Auth displayName güncelle
  const { updateProfile } = await import("firebase/auth");
  await updateProfile(user, { displayName: trimmed });
}

// Rümuz kaydını Firestore'dan sil (hesap temizleme için)
export async function rumuzSil(): Promise<void> {
  const user = mevcutKullanici();
  if (!user?.displayName) return;

  const normalized = rumuzNormalize(user.displayName);
  if (!normalized) return;

  const docRef = doc(firestore, RUMUZ_KOLEKSIYON, normalized);
  const snap = await getDoc(docRef);
  if (snap.exists() && snap.data().uid === user.uid) {
    await deleteDoc(docRef);
  }
}
