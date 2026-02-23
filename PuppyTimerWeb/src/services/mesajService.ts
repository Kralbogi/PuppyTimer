// =============================================================================
// PuppyTimer Web - Mesaj Servisi
// Private messaging between friends - Firebase Firestore operations
// =============================================================================

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  query,
  orderBy,
  setDoc,
  getDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { MesajKonusma, OzelMesaj } from "../types/models";
import { kullaniciAdGetir } from "./kullaniciKimlik";
import { sohbetEngelliMi } from "./sikayetService";

const KONUSMA_COLLECTION = "mesajKonusmalari";

// -----------------------------------------------------------------------------
// Konusma ID Olustur (alfabetik sirada userId1_userId2)
// -----------------------------------------------------------------------------

function konusmaIdOlustur(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

// -----------------------------------------------------------------------------
// Konusma Olustur veya Getir
// -----------------------------------------------------------------------------

export async function konusmaOlusturVeyaGetir(
  karsiTarafId: string
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  const konusmaId = konusmaIdOlustur(auth.currentUser.uid, karsiTarafId);

  // Konusma var mi kontrol et
  const konusmaRef = doc(firestore, KONUSMA_COLLECTION, konusmaId);
  const konusmaSnap = await getDoc(konusmaRef);

  if (!konusmaSnap.exists()) {
    // Yeni konusma olustur
    const yeniKonusma: Omit<MesajKonusma, "id"> = {
      katilimcilar: [auth.currentUser.uid, karsiTarafId].sort(),
      sonMesaj: "",
      sonMesajTarihi: Date.now(),
      okunmayanSayisi: {
        [auth.currentUser.uid]: 0,
        [karsiTarafId]: 0,
      },
      aktif: true,
    };

    await setDoc(konusmaRef, yeniKonusma);
  }

  return konusmaId;
}

// -----------------------------------------------------------------------------
// Mesaj Gonder
// -----------------------------------------------------------------------------

export async function mesajGonder(
  konusmaId: string,
  icerik: string
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Check if user is chat banned (10+ harassment reports)
  const chatBanned = await sohbetEngelliMi(auth.currentUser.uid);
  if (chatBanned) {
    throw new Error("Sohbet engellisi nedeniyle mesaj gönderemezsiniz. Çok fazla hakaret şikayeti aldınız.");
  }

  // Only length validation, NO content moderation for private messages
  if (icerik.length === 0 || icerik.length > 500) {
    throw new Error("Mesaj 1-500 karakter arasinda olmalidir");
  }

  const mesaj: Omit<OzelMesaj, "id"> = {
    gonderenId: auth.currentUser.uid,
    gonderenAd: kullaniciAdGetir(),
    icerik,
    olusturmaTarihi: Date.now(),
    okundu: false,
    aktif: true,
  };

  // Mesaji ekle
  const docRef = await addDoc(
    collection(firestore, KONUSMA_COLLECTION, konusmaId, "mesajlar"),
    mesaj
  );

  // Konusma meta bilgisini guncelle
  const konusmaRef = doc(firestore, KONUSMA_COLLECTION, konusmaId);
  const konusmaSnap = await getDoc(konusmaRef);

  if (konusmaSnap.exists()) {
    const konusma = konusmaSnap.data() as MesajKonusma;
    const karsiTarafId = konusma.katilimcilar.find(
      (id) => id !== auth.currentUser!.uid
    );

    if (karsiTarafId) {
      await updateDoc(konusmaRef, {
        sonMesaj: icerik.substring(0, 100), // First 100 chars
        sonMesajTarihi: Date.now(),
        sonMesajGonderenId: auth.currentUser!.uid,
        [`okunmayanSayisi.${karsiTarafId}`]:
          (konusma.okunmayanSayisi?.[karsiTarafId] || 0) + 1,
      });
    }
  }

  return docRef.id;
}

// -----------------------------------------------------------------------------
// Mesajlari Dinle (Real-time listener for a specific conversation)
// -----------------------------------------------------------------------------

export function mesajlariDinle(
  konusmaId: string,
  callback: (mesajlar: OzelMesaj[]) => void
): () => void {
  const q = query(
    collection(firestore, KONUSMA_COLLECTION, konusmaId, "mesajlar"),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const mesajlar: OzelMesaj[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as OzelMesaj[];
      callback(mesajlar);
    },
    (error) => {
      console.error("Firestore mesaj dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Konusmalarimi Dinle (Real-time listener for all user's conversations)
// -----------------------------------------------------------------------------

export function konusmalarimDinle(
  callback: (konusmalar: MesajKonusma[]) => void
): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(firestore, KONUSMA_COLLECTION),
    where("katilimcilar", "array-contains", auth.currentUser.uid),
    orderBy("sonMesajTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const konusmalar: MesajKonusma[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MesajKonusma[];
      callback(konusmalar);
    },
    (error) => {
      console.error("Firestore konusma dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Mesaj Okundu Isaretle
// -----------------------------------------------------------------------------

export async function mesajOkunduIsaretle(
  konusmaId: string,
  mesajId: string
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  await updateDoc(
    doc(firestore, KONUSMA_COLLECTION, konusmaId, "mesajlar", mesajId),
    {
      okundu: true,
    }
  );
}

// -----------------------------------------------------------------------------
// Okunmayan Sayisini Sifirla
// -----------------------------------------------------------------------------

export async function okunmayanSifirla(konusmaId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  await updateDoc(doc(firestore, KONUSMA_COLLECTION, konusmaId), {
    [`okunmayanSayisi.${auth.currentUser.uid}`]: 0,
  });
}
