// =============================================================================
// PawLand - Kopek Yorum Servisi
// Firebase Firestore CRUD islemleri (subcollection)
// =============================================================================

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { KopekYorum } from "../types/models";
import { icerikGecerliMi } from "../utils/validationUtils";

// -----------------------------------------------------------------------------
// Gercek zamanli dinleyici (belirli bir kopegin yorumlari)
// -----------------------------------------------------------------------------

export function kopekYorumlariniDinle(
  kopekId: string,
  callback: (yorumlar: KopekYorum[]) => void
): () => void {
  const q = query(
    collection(firestore, "toplulukKopekleri", kopekId, "yorumlar"),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const yorumlar: KopekYorum[] = snapshot.docs.map((d) => ({
        id: d.id,
        kopekId,
        ...d.data(),
      })) as KopekYorum[];
      callback(yorumlar);
    },
    (error) => {
      console.error("Firestore kopek yorum dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Yorum Ekle
// -----------------------------------------------------------------------------

export async function kopekYorumEkle(
  kopekId: string,
  icerik: string,
  olusturanAd: string
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Icerik uzunluk kontrolu (max 500 karakter)
  if (icerik.length === 0 || icerik.length > 500) {
    throw new Error("Yorum 1-500 karakter arasinda olmalidir");
  }

  // Content moderation
  const validasyon = icerikGecerliMi(icerik, true);
  if (!validasyon.gecerli) {
    throw new Error(validasyon.hata);
  }

  const yorum = {
    kopekId,
    olusturanId: auth.currentUser.uid,
    olusturanAd,
    icerik,
    olusturmaTarihi: Date.now(),
    guncellemeTarihi: Date.now(),
    aktif: true,
  };

  const docRef = await addDoc(
    collection(firestore, "toplulukKopekleri", kopekId, "yorumlar"),
    yorum
  );
  return docRef.id;
}

// -----------------------------------------------------------------------------
// Yorum Sil (sadece kendi yorumunu silebilir)
// -----------------------------------------------------------------------------

export async function kopekYorumSil(
  kopekId: string,
  yorumId: string
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await deleteDoc(
    doc(firestore, "toplulukKopekleri", kopekId, "yorumlar", yorumId)
  );
}
