// =============================================================================
// PuppyTimer Web - Authentication Service
// Firebase Authentication ile kullanici yonetimi
// =============================================================================

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

// -----------------------------------------------------------------------------
// Register (Kayit Ol)
// -----------------------------------------------------------------------------

export async function kayitOl(
  email: string,
  sifre: string,
  ad: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, sifre);
  const user = userCredential.user;

  // Kullanici adini guncelle
  if (ad) {
    await updateProfile(user, { displayName: ad });
  }

  return user;
}

// -----------------------------------------------------------------------------
// Login (Giris Yap)
// -----------------------------------------------------------------------------

export async function girisYap(email: string, sifre: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, sifre);
  return userCredential.user;
}

// -----------------------------------------------------------------------------
// Logout (Cikis Yap)
// -----------------------------------------------------------------------------

export async function cikisYap(): Promise<void> {
  await firebaseSignOut(auth);
}

// -----------------------------------------------------------------------------
// Auth State Listener
// -----------------------------------------------------------------------------

export function authDinle(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// -----------------------------------------------------------------------------
// Mevcut Kullanici
// -----------------------------------------------------------------------------

export function mevcutKullanici(): User | null {
  return auth.currentUser;
}

// -----------------------------------------------------------------------------
// Kullanici ID
// -----------------------------------------------------------------------------

export function kullaniciId(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanici girisi yapilmamis");
  return user.uid;
}

// -----------------------------------------------------------------------------
// Kullanici Adi
// -----------------------------------------------------------------------------

export function kullaniciAdi(): string {
  const user = auth.currentUser;
  return user?.displayName || user?.email?.split("@")[0] || "Kullanici";
}
