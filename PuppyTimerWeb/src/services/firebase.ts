// =============================================================================
// PuppyTimer Web - Firebase Baslatma
// Firestore + Anonymous Authentication
// =============================================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Firebase config - API key'ler client-side icin guvenlidir
// (erisim Firestore security rules ile kontrol edilir)
const firebaseConfig = {
  apiKey: "AIzaSyCv0BKz8w-zD0br70IM-3O2A_QmZIYZ8A4",
  authDomain: "pawland3448.firebaseapp.com",
  projectId: "pawland3448",
  storageBucket: "pawland3448.firebasestorage.app",
  messagingSenderId: "13724720719",
  appId: "1:13724720719:web:30f285307d86ab0ad7943a",
  measurementId: "G-Y45PMYXNLS"
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// Anonim kimlik dogrulama - kullanici farkinda olmadan arka planda calisir
// Bu sayede Firestore security rules calisiyor ve veri guvende
let authInitialized = false;
let authInitPromise: Promise<void> | null = null;

export const ensureAuth = async (): Promise<void> => {
  if (authInitialized) return;
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // Kullanici yok, anonim giris yap
          await signInAnonymously(auth);
        }
        authInitialized = true;
        unsubscribe();
        resolve();
      } catch (error) {
        console.error("Firebase Auth hatasi:", error);
        unsubscribe();
        reject(error);
      }
    });
  });

  return authInitPromise;
};
