// =============================================================================
// PuppyTimer Web - Kayıp Köpek Servisi (Firestore)
// Topluluk haritasında acil kayıp köpek bildirimleri
// =============================================================================

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore, auth } from "./firebase";
import type { KayipKopek } from "../types/models";

const KOLEKSIYON = "kayipKopekler";

/**
 * Aktif kayıp köpekleri gerçek zamanlı dinle (son 7 gün)
 */
export function kayipKopekleriDinle(
  callback: (kopekler: KayipKopek[]) => void
): () => void {
  const yediGunOnce = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const q = query(
    collection(firestore, KOLEKSIYON),
    where("aktif", "==", true),
    where("olusturmaTarihi", ">=", yediGunOnce),
    orderBy("olusturmaTarihi", "desc"),
    limit(50)
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const liste: KayipKopek[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as KayipKopek[];
    callback(liste);
  });

  return unsubscribe;
}

/**
 * Yeni kayıp köpek bildirimi oluştur
 */
export async function kayipKopekBildir(data: {
  kopekAd: string;
  irk?: string;
  aciklama: string;
  iletisim: string;
  thumbnailData?: string;
  enlem: number;
  boylam: number;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Giriş yapılmamış");

  const docRef = await addDoc(collection(firestore, KOLEKSIYON), {
    sahipId: user.uid,
    sahipAd: user.displayName || "Anonim",
    kopekAd: data.kopekAd,
    irk: data.irk || "",
    aciklama: data.aciklama,
    iletisim: data.iletisim,
    thumbnailData: data.thumbnailData || null,
    enlem: data.enlem,
    boylam: data.boylam,
    olusturmaTarihi: Date.now(),
    aktif: true,
  });

  return docRef.id;
}

/**
 * Kayıp köpek ilanını kapat (bulundu/iptal)
 */
export async function kayipKopekKapat(id: string): Promise<void> {
  await updateDoc(doc(firestore, KOLEKSIYON, id), { aktif: false });
}
