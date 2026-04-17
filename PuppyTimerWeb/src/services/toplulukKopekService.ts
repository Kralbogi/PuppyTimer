// =============================================================================
// PawLand - Topluluk Kopek Paylasim Servisi
// Firebase Firestore ile kopek paylasimi + kucuk resim olusturma
// =============================================================================

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { ToplulukKopek } from "../types/models";
import { toplulukEngelliMi, fotografKaldirildiMi } from "./sikayetService";

const COLLECTION = "toplulukKopekleri";

// -----------------------------------------------------------------------------
// Kucuk resim olusturma (Canvas API)
// Base64 fotoyu 128x128 JPEG thumbnail'e donusturur (~5-10KB)
// -----------------------------------------------------------------------------

export async function kucukResimOlustur(
  base64Foto: string,
  boyut: number = 128
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = boyut;
      canvas.height = boyut;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context alinamadi"));
        return;
      }

      // Kare kirpma: kisa kenar baz, ortadan kes
      const kaynakBoyut = Math.min(img.width, img.height);
      const kaynakX = Math.floor((img.width - kaynakBoyut) / 2);
      const kaynakY = Math.floor((img.height - kaynakBoyut) / 2);

      ctx.drawImage(
        img,
        kaynakX, kaynakY, kaynakBoyut, kaynakBoyut,
        0, 0, boyut, boyut
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
      const virgulIdx = dataUrl.indexOf(",");
      resolve(virgulIdx !== -1 ? dataUrl.substring(virgulIdx + 1) : dataUrl);
    };
    img.onerror = () => reject(new Error("Resim yuklenemedi"));

    if (base64Foto.startsWith("data:")) {
      img.src = base64Foto;
    } else {
      img.src = `data:image/jpeg;base64,${base64Foto}`;
    }
  });
}

// -----------------------------------------------------------------------------
// Gercek zamanli dinleyici
// -----------------------------------------------------------------------------

export function toplulukKopekleriDinle(
  callback: (kopekler: ToplulukKopek[]) => void
): () => void {
  const q = query(
    collection(firestore, COLLECTION),
    where("aktif", "==", true),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const kopekler: ToplulukKopek[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ToplulukKopek[];
      callback(kopekler);
    },
    (error) => {
      console.error("Topluluk kopek dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Kopek Paylas
// -----------------------------------------------------------------------------

export async function kopekPaylas(
  data: Omit<ToplulukKopek, "id">
): Promise<string> {
  // Auth kontrolu - anonim kimlik otomatik olusturulur
  await ensureAuth();

  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Check if user is community banned (25+ total reports)
  const communityBanned = await toplulukEngelliMi(auth.currentUser.uid);
  if (communityBanned) {
    throw new Error("Topluluk engellisi nedeniyle köpek paylaşamazsınız. Çok fazla şikayet aldınız.");
  }

  // Check if user's photos are removed (10+ inappropriate image reports)
  const photoRemoved = await fotografKaldirildiMi(auth.currentUser.uid);

  // Firestore undefined kabul etmez, undefined alanlari temizle
  const temiz: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) temiz[key] = val;
  }

  // Fotoğraf kaldırıldıysa, foto ve thumbnail alanlarını sil
  if (photoRemoved) {
    delete temiz.fotoData;
    delete temiz.thumbnailData;
    console.log(`Kullanıcı ${auth.currentUser.uid} fotoğrafı kaldırıldı`);
  }

  // olusturanId, begeniler ve toplamBegeniler'i otomatik ekle (Firestore rules icin gerekli)
  temiz.olusturanId = auth.currentUser.uid;
  temiz.begeniler = 0;
  temiz.toplamBegeniler = 0;

  const docRef = await addDoc(collection(firestore, COLLECTION), temiz);
  return docRef.id;
}

// -----------------------------------------------------------------------------
// Kopek Geri Cek (Sil)
// -----------------------------------------------------------------------------

export async function kopekGeriCek(kopekId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await deleteDoc(doc(firestore, COLLECTION, kopekId));
}

// -----------------------------------------------------------------------------
// Konum Guncelle
// -----------------------------------------------------------------------------

export async function kopekKonumGuncelle(
  kopekId: string,
  enlem: number,
  boylam: number
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await updateDoc(doc(firestore, COLLECTION, kopekId), {
    enlem,
    boylam,
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Kopek Begen
// -----------------------------------------------------------------------------

export async function kopekBegen(kopekId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await updateDoc(doc(firestore, COLLECTION, kopekId), {
    begeniler: increment(1),
    toplamBegeniler: increment(1),
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Toplam Begeni Getir (Kullanicinin tum kopekleri icin)
// -----------------------------------------------------------------------------

export async function kullaniciToplamBegenileriniGetir(
  kopekAd: string
): Promise<number> {
  await ensureAuth();
  if (!auth.currentUser) {
    return 0;
  }

  const q = query(
    collection(firestore, COLLECTION),
    where("olusturanId", "==", auth.currentUser.uid),
    where("kopekAd", "==", kopekAd)
  );

  const snapshot = await getDocs(q);
  let toplamBegeni = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    toplamBegeni = Math.max(toplamBegeni, data.toplamBegeniler || 0);
  });

  return toplamBegeni;
}
