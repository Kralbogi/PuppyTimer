// =============================================================================
// PuppyTimer Web - Bolge Yorum Servisi
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
import type { BolgeYorum } from "../types/models";
import { icerikGecerliMi } from "../utils/validationUtils";

// -----------------------------------------------------------------------------
// Gercek zamanli dinleyici (belirli bir bolgenin yorumlari)
// -----------------------------------------------------------------------------

export function bolgeYorumlariniDinle(
  bolgeId: string,
  callback: (yorumlar: BolgeYorum[]) => void
): () => void {
  const q = query(
    collection(firestore, "toplulukBolgeleri", bolgeId, "yorumlar"),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const yorumlar: BolgeYorum[] = snapshot.docs.map((d) => ({
        id: d.id,
        bolgeId,
        ...d.data(),
      })) as BolgeYorum[];
      callback(yorumlar);
    },
    (error) => {
      console.error("Firestore yorum dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Yorum Ekle
// -----------------------------------------------------------------------------

export async function yorumEkle(
  bolgeId: string,
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
    bolgeId,
    olusturanId: auth.currentUser.uid,
    olusturanAd,
    icerik,
    olusturmaTarihi: Date.now(),
    guncellemeTarihi: Date.now(),
    aktif: true,
  };

  const docRef = await addDoc(
    collection(firestore, "toplulukBolgeleri", bolgeId, "yorumlar"),
    yorum
  );
  return docRef.id;
}

// -----------------------------------------------------------------------------
// Yorum Sil (sadece kendi yorumunu silebilir)
// -----------------------------------------------------------------------------

export async function yorumSil(
  bolgeId: string,
  yorumId: string
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await deleteDoc(
    doc(firestore, "toplulukBolgeleri", bolgeId, "yorumlar", yorumId)
  );
}
