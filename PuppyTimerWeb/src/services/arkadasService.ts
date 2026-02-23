// =============================================================================
// PuppyTimer Web - Arkadas Sistemi Servisi
// Firebase Firestore ile arkadas ekleme, istek kabul/red, online durum
// =============================================================================

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  limit,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { KopekArkadas, KullaniciOnlineDurum } from "../types/models";

const ARKADAS_COLLECTION = "kopekArkadaslar";
const ONLINE_COLLECTION = "kullaniciOnlineDurum";

// -----------------------------------------------------------------------------
// Arkadas Istegi Gonder
// -----------------------------------------------------------------------------

export async function arkadasIstegiGonder(
  aliciId: string,
  aliciAd: string,
  kopekId: string,
  kopekAd: string
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Onceden istek var mi kontrol et
  const q = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", auth.currentUser.uid),
    where("aliciId", "==", aliciId),
    where("kopekId", "==", kopekId),
    where("aktif", "==", true)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error("Bu kopek icin zaten bir arkadas istegi gonderdiniz");
  }

  // Ters yonde istek var mi kontrol et (karsi taraf zaten gonderdi mi?)
  const tersQ = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", aliciId),
    where("aliciId", "==", auth.currentUser.uid),
    where("kopekId", "==", kopekId),
    where("aktif", "==", true)
  );

  const tersSnapshot = await getDocs(tersQ);
  if (!tersSnapshot.empty) {
    throw new Error("Bu kullanici size zaten bir istek gonderdi. Istekleri kontrol edin");
  }

  const veri: Omit<KopekArkadas, "id"> = {
    gonderenId: auth.currentUser.uid,
    gonderenAd: auth.currentUser.displayName || "Anonim",
    aliciId,
    aliciAd,
    kopekId,
    kopekAd,
    durum: "beklemede",
    olusturmaTarihi: Date.now(),
    guncellemeTarihi: Date.now(),
    aktif: true,
  };

  const docRef = await addDoc(collection(firestore, ARKADAS_COLLECTION), veri);
  return docRef.id;
}

// -----------------------------------------------------------------------------
// Arkadas Istegini Kabul Et
// -----------------------------------------------------------------------------

export async function arkadasIstegiKabulEt(arkadasId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  await updateDoc(doc(firestore, ARKADAS_COLLECTION, arkadasId), {
    durum: "kabul",
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Arkadas Istegini Reddet
// -----------------------------------------------------------------------------

export async function arkadasIstegiReddet(arkadasId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  await updateDoc(doc(firestore, ARKADAS_COLLECTION, arkadasId), {
    durum: "red",
    aktif: false,
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Arkadasligi Sonlandir
// -----------------------------------------------------------------------------

export async function arkadaslikSonlandir(arkadasId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  await updateDoc(doc(firestore, ARKADAS_COLLECTION, arkadasId), {
    aktif: false,
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Gelen Arkadas Isteklerini Dinle
// -----------------------------------------------------------------------------

export function gelenArkadasIstekleriniDinle(
  callback: (istekler: KopekArkadas[]) => void
): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("aliciId", "==", auth.currentUser.uid),
    where("durum", "==", "beklemede"),
    where("aktif", "==", true),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const istekler: KopekArkadas[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as KopekArkadas[];
      callback(istekler);
    },
    (error) => {
      console.error("Gelen arkadas istekleri dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Arkadaslarimi Dinle
// -----------------------------------------------------------------------------

export function arkadaslarimiDinle(
  callback: (arkadaslar: KopekArkadas[]) => void
): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const userId = auth.currentUser.uid;

  // Hem gonderen hem alici oldugum kabul edilmis arkadasliklari dinle
  const q1 = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", userId),
    where("durum", "==", "kabul"),
    where("aktif", "==", true)
  );

  const q2 = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("aliciId", "==", userId),
    where("durum", "==", "kabul"),
    where("aktif", "==", true)
  );

  const arkadaslar = new Map<string, KopekArkadas>();

  const unsubscribe1 = onSnapshot(q1, (snapshot) => {
    snapshot.docs.forEach((d) => {
      arkadaslar.set(d.id, { id: d.id, ...d.data() } as KopekArkadas);
    });
    callback(Array.from(arkadaslar.values()));
  });

  const unsubscribe2 = onSnapshot(q2, (snapshot) => {
    snapshot.docs.forEach((d) => {
      arkadaslar.set(d.id, { id: d.id, ...d.data() } as KopekArkadas);
    });
    callback(Array.from(arkadaslar.values()));
  });

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
}

// -----------------------------------------------------------------------------
// Online Durumu Guncelle
// -----------------------------------------------------------------------------

export async function onlineDurumuGuncelle(online: boolean): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  const veri: Omit<KullaniciOnlineDurum, "id"> = {
    online,
    sonAktivite: Date.now(),
  };

  await setDoc(doc(firestore, ONLINE_COLLECTION, auth.currentUser.uid), veri);
}

// -----------------------------------------------------------------------------
// Online Durumlari Dinle
// -----------------------------------------------------------------------------

export function onlineDurumlariDinle(
  kullaniciIdler: string[],
  callback: (durumlar: Map<string, boolean>) => void
): () => void {
  if (kullaniciIdler.length === 0) {
    callback(new Map());
    return () => {};
  }

  // Firestore "in" operatoru max 10 eleman alir, chunklara bol
  const chunks: string[][] = [];
  for (let i = 0; i < kullaniciIdler.length; i += 10) {
    chunks.push(kullaniciIdler.slice(i, i + 10));
  }

  const durumlar = new Map<string, boolean>();
  const unsubscribers: (() => void)[] = [];

  for (const chunk of chunks) {
    const q = query(
      collection(firestore, ONLINE_COLLECTION),
      where("__name__", "in", chunk)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((d) => {
        const data = d.data() as KullaniciOnlineDurum;
        // 5 dakika icinde aktif ise online kabul et
        const besDakikaOnce = Date.now() - 5 * 60 * 1000;
        durumlar.set(d.id, data.online && data.sonAktivite > besDakikaOnce);
      });
      callback(new Map(durumlar));
    });

    unsubscribers.push(unsub);
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// -----------------------------------------------------------------------------
// Belirli Bir Kopek Icin Arkadas Olup Olmadigini Kontrol Et
// -----------------------------------------------------------------------------

export async function arkadasMi(
  kopekOlusturanId: string,
  kopekId: string
): Promise<boolean> {
  await ensureAuth();
  if (!auth.currentUser) {
    return false;
  }

  const userId = auth.currentUser.uid;

  // Gonderen oldugum arkadasliklar
  const q1 = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", userId),
    where("aliciId", "==", kopekOlusturanId),
    where("kopekId", "==", kopekId),
    where("durum", "==", "kabul"),
    where("aktif", "==", true)
  );

  const snapshot1 = await getDocs(q1);
  if (!snapshot1.empty) return true;

  // Alici oldugum arkadasliklar
  const q2 = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", kopekOlusturanId),
    where("aliciId", "==", userId),
    where("kopekId", "==", kopekId),
    where("durum", "==", "kabul"),
    where("aktif", "==", true)
  );

  const snapshot2 = await getDocs(q2);
  return !snapshot2.empty;
}

// -----------------------------------------------------------------------------
// Kullanici Ara (by display name prefix, via toplulukKopekleri)
// -----------------------------------------------------------------------------

export interface KullaniciAramaKopek {
  kopekId: string;
  kopekAd: string;
  irk: string;
}

export interface KullaniciAramaSonucu {
  kullaniciId: string;
  kullaniciAd: string;
  kopekler: KullaniciAramaKopek[];
}

export async function kullaniciAra(
  arananAd: string
): Promise<KullaniciAramaSonucu[]> {
  if (!auth.currentUser || arananAd.trim().length < 2) return [];

  const aramaMetni = arananAd.trim();
  const q = query(
    collection(firestore, "toplulukKopekleri"),
    where("olusturanAd", ">=", aramaMetni),
    where("olusturanAd", "<=", aramaMetni + "\uf8ff"),
    where("aktif", "==", true),
    limit(30)
  );

  const snapshot = await getDocs(q);
  const kullaniciMap = new Map<string, KullaniciAramaSonucu>();

  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.olusturanId === auth.currentUser!.uid) return; // skip own dogs

    if (!kullaniciMap.has(data.olusturanId)) {
      kullaniciMap.set(data.olusturanId, {
        kullaniciId: data.olusturanId,
        kullaniciAd: data.olusturanAd,
        kopekler: [],
      });
    }
    kullaniciMap.get(data.olusturanId)!.kopekler.push({
      kopekId: d.id,
      kopekAd: data.kopekAd,
      irk: data.irk || "",
    });
  });

  return Array.from(kullaniciMap.values());
}

// -----------------------------------------------------------------------------
// Belirli Bir Kopek Icin Bekleyen Istek Var Mi Kontrol Et
// -----------------------------------------------------------------------------

export async function bekleyenIstekVarMi(
  kopekOlusturanId: string,
  kopekId: string
): Promise<boolean> {
  await ensureAuth();
  if (!auth.currentUser) {
    return false;
  }

  const q = query(
    collection(firestore, ARKADAS_COLLECTION),
    where("gonderenId", "==", auth.currentUser.uid),
    where("aliciId", "==", kopekOlusturanId),
    where("kopekId", "==", kopekId),
    where("durum", "==", "beklemede"),
    where("aktif", "==", true)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
