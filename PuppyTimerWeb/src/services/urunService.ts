// =============================================================================
// PawLand - Urun Service
// Shop urunu CRUD operasyonlari ve yorumlar
// =============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { Urun, UrunYorum, SepetItem, Siparis } from "../types/models";

const URUNLER_COLLECTION = "urunler";
const SIPARISLER_COLLECTION = "siparisler";

// =============================================================================
// Urunler - Products
// =============================================================================

/**
 * Real-time listener for all active products
 */
export function urunleriDinle(callback: (urunler: Urun[]) => void): () => void {
  const q = query(
    collection(firestore, URUNLER_COLLECTION),
    where("aktif", "==", true),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const urunler = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Urun[];

      callback(urunler);
    },
    (error) => {
      console.error("Urunler dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Get single product by ID
 */
export async function urunGetir(id: string): Promise<Urun | null> {
  try {
    const docRef = doc(firestore, URUNLER_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Urun;
  } catch (error) {
    console.error("Urun getirme hatasi:", error);
    throw error;
  }
}

/**
 * Add new product (admin only)
 */
export async function urunEkle(data: Omit<Urun, "id" | "ortalamaPuan" | "toplamYorumSayisi" | "olusturmaTarihi" | "guncellemeTarihi">): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) throw new Error("Yetkilendirme basarisiz");

  // Clean undefined fields
  const temiz: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) temiz[key] = val;
  }

  // Add system fields
  temiz.ortalamaPuan = 0;
  temiz.toplamYorumSayisi = 0;
  temiz.aktif = true;
  temiz.olusturmaTarihi = Date.now();
  temiz.guncellemeTarihi = Date.now();

  const docRef = await addDoc(collection(firestore, URUNLER_COLLECTION), temiz);
  return docRef.id;
}

/**
 * Update product (admin only)
 */
export async function urunGuncelle(
  id: string,
  data: Partial<Omit<Urun, "id" | "ortalamaPuan" | "toplamYorumSayisi" | "olusturmaTarihi">>
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) throw new Error("Yetkilendirme basarisiz");

  // Clean undefined fields
  const temiz: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) temiz[key] = val;
  }

  temiz.guncellemeTarihi = Date.now();

  await updateDoc(doc(firestore, URUNLER_COLLECTION, id), temiz);
}

/**
 * Delete product (soft delete - admin only)
 */
export async function urunSil(id: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) throw new Error("Yetkilendirme basarisiz");

  await updateDoc(doc(firestore, URUNLER_COLLECTION, id), {
    aktif: false,
    guncellemeTarihi: Date.now(),
  });
}

// =============================================================================
// Yorumlar - Reviews
// =============================================================================

/**
 * Real-time listener for product reviews
 */
export function yorumlariDinle(
  urunId: string,
  callback: (yorumlar: UrunYorum[]) => void
): () => void {
  const q = query(
    collection(firestore, URUNLER_COLLECTION, urunId, "yorumlar"),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const yorumlar = snapshot.docs.map((d) => ({
        id: d.id,
        urunId,
        ...d.data(),
      })) as UrunYorum[];
      callback(yorumlar);
    },
    (error) => {
      console.error("Yorumlar dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Add review to product
 */
export async function yorumEkle(
  urunId: string,
  puan: number,
  yorum?: string
): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) throw new Error("Yetkilendirme basarisiz");

  // Get kullaniciAd from kullaniciRumuzlar
  const rumuzDoc = await getDoc(
    doc(firestore, "kullaniciRumuzlar", auth.currentUser.uid)
  );
  const kullaniciAd = rumuzDoc.exists()
    ? rumuzDoc.data().displayName || "Anonim"
    : "Anonim";

  // Add review
  await addDoc(
    collection(firestore, URUNLER_COLLECTION, urunId, "yorumlar"),
    {
      kullaniciId: auth.currentUser.uid,
      kullaniciAd,
      puan,
      yorum: yorum || "",
      olusturmaTarihi: Date.now(),
    }
  );

  // Update product average rating
  await guncelleOrtalamaPuan(urunId);
}

/**
 * Update average rating for a product
 * @private
 */
async function guncelleOrtalamaPuan(urunId: string): Promise<void> {
  const yorumlarSnapshot = await getDocs(
    collection(firestore, URUNLER_COLLECTION, urunId, "yorumlar")
  );

  const yorumlar = yorumlarSnapshot.docs.map((d) => d.data());
  const toplamYorumSayisi = yorumlar.length;

  if (toplamYorumSayisi === 0) {
    await updateDoc(doc(firestore, URUNLER_COLLECTION, urunId), {
      ortalamaPuan: 0,
      toplamYorumSayisi: 0,
      guncellemeTarihi: Date.now(),
    });
    return;
  }

  const toplamPuan = yorumlar.reduce((sum, y) => sum + (y.puan || 0), 0);
  const ortalamaPuan = toplamPuan / toplamYorumSayisi;

  await updateDoc(doc(firestore, URUNLER_COLLECTION, urunId), {
    ortalamaPuan: Math.round(ortalamaPuan * 10) / 10, // Round to 1 decimal
    toplamYorumSayisi,
    guncellemeTarihi: Date.now(),
  });
}

/**
 * Check if user already reviewed a product
 */
export async function kullaniciYorumVarMi(urunId: string): Promise<boolean> {
  await ensureAuth();
  if (!auth.currentUser) return false;

  const q = query(
    collection(firestore, URUNLER_COLLECTION, urunId, "yorumlar"),
    where("kullaniciId", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// =============================================================================
// Siparisler - Orders
// =============================================================================

/**
 * Create new order
 */
export async function siparisOlustur(sepetItems: SepetItem[], teslimatAdresi?: string): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) throw new Error("Yetkilendirme basarisiz");

  // Get kullaniciAd
  const rumuzDoc = await getDoc(
    doc(firestore, "kullaniciRumuzlar", auth.currentUser.uid)
  );
  const kullaniciAd = rumuzDoc.exists()
    ? rumuzDoc.data().displayName || "Anonim"
    : "Anonim";

  const toplamFiyat = sepetItems.reduce(
    (sum, item) => sum + item.adet * item.birimFiyat,
    0
  );

  const docRef = await addDoc(collection(firestore, SIPARISLER_COLLECTION), {
    kullaniciId: auth.currentUser.uid,
    kullaniciAd,
    urunler: sepetItems,
    toplamFiyat,
    durum: "beklemede",
    olusturmaTarihi: Date.now(),
    teslimatAdresi: teslimatAdresi || "",
  });

  return docRef.id;
}

/**
 * Get user's orders
 */
export async function siparislerimiGetir(): Promise<Siparis[]> {
  await ensureAuth();
  if (!auth.currentUser) return [];

  const q = query(
    collection(firestore, SIPARISLER_COLLECTION),
    where("kullaniciId", "==", auth.currentUser.uid),
    orderBy("olusturmaTarihi", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Siparis[];
}

/**
 * Real-time listener for user's orders
 */
export function siparislerimiDinle(callback: (siparisler: Siparis[]) => void): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(firestore, SIPARISLER_COLLECTION),
    where("kullaniciId", "==", auth.currentUser.uid),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const siparisler = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Siparis[];
      callback(siparisler);
    },
    (error) => {
      console.error("Siparisler dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Check if user has purchased a specific product
 */
export async function kullaniciUrunuSatinAldiMi(urunId: string): Promise<boolean> {
  await ensureAuth();
  if (!auth.currentUser) return false;

  const siparisler = await siparislerimiGetir();
  return siparisler.some(siparis =>
    siparis.urunler.some(urun => urun.urunId === urunId)
  );
}
