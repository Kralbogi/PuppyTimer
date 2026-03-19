// =============================================================================
// PawLand - Admin Service
// Firestore admin sorguları — yalnızca auth.currentUser.uid === ADMIN_UID iken kullanılabilir
// =============================================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  where,
  addDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { firestore, auth } from "./firebase";
import type { Sikayet, KullaniciCeza, ToplulukKopek, ToplulukBolge } from "../types/models";

// =============================================================================
// Tipleri
// =============================================================================

export interface KullaniciRumuz {
  id: string;
  uid: string;
  displayName: string;
  tarih: number;
}

export interface PushBildirim {
  id?: string;
  baslik: string;
  govde: string;
  url?: string;
  hedef: "hepsi" | string;
  gonderenId: string;
  durum: "beklemede" | "gonderildi" | "hata";
  hataMesaji?: string;
  gonderilenSayisi?: number;
  toplamToken?: number;
  tarih: number;
  gonderimTarihi?: number;
}

export interface AdminDashboardStats {
  toplamKullanici: number;
  aktifKopekler: number;
  aktifBolgeler: number;
  toplamSikayet: number;
  onlineKullanici: number;
  toplamMesajKonusma: number;
}

const SAYFA_BOYUTU = 20;

// =============================================================================
// Dashboard İstatistikleri
// =============================================================================

export async function dashboardIstatistikleriGetir(): Promise<AdminDashboardStats> {
  const [
    kullaniciSnap,
    kopekSnap,
    bolgeSnap,
    sikayetSnap,
    onlineSnap,
    konusmaSnap,
  ] = await Promise.all([
    getCountFromServer(collection(firestore, "kullaniciRumuzlar")),
    getCountFromServer(
      query(collection(firestore, "toplulukKopekleri"), where("aktif", "==", true))
    ),
    getCountFromServer(
      query(collection(firestore, "toplulukBolgeleri"), where("aktif", "==", true))
    ),
    getCountFromServer(collection(firestore, "sikayetler")),
    getCountFromServer(
      query(collection(firestore, "kullaniciOnlineDurum"), where("online", "==", true))
    ),
    getCountFromServer(collection(firestore, "mesajKonusmalari")),
  ]);

  return {
    toplamKullanici: kullaniciSnap.data().count,
    aktifKopekler: kopekSnap.data().count,
    aktifBolgeler: bolgeSnap.data().count,
    toplamSikayet: sikayetSnap.data().count,
    onlineKullanici: onlineSnap.data().count,
    toplamMesajKonusma: konusmaSnap.data().count,
  };
}

// =============================================================================
// Kullanıcılar
// =============================================================================

export async function tumKullanicilariGetir(): Promise<KullaniciRumuz[]> {
  const snap = await getDocs(
    query(collection(firestore, "kullaniciRumuzlar"), orderBy("tarih", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KullaniciRumuz));
}

export async function kullaniciCezaGetir(uid: string): Promise<KullaniciCeza | null> {
  const snap = await getDoc(doc(firestore, "kullaniciCezalar", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as KullaniciCeza;
}

export async function kullaniciSikayetSayisiGetir(uid: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(firestore, "sikayetler"), where("sikayetEdilenId", "==", uid))
  );
  return snap.data().count;
}

// =============================================================================
// Ban / Ceza İşlemleri
// =============================================================================

export async function kullaniciyaBanUygula(
  uid: string,
  banTuru: "toplulukEngelli" | "sohbetEngelli" | "fotografKaldirildi",
  deger: boolean
): Promise<void> {
  const cezaRef = doc(firestore, "kullaniciCezalar", uid);
  const snap = await getDoc(cezaRef);

  if (!snap.exists()) {
    const yeniCeza: KullaniciCeza = {
      id: uid,
      hakaretSayisi: 0,
      spamSayisi: 0,
      uygunsuzGorselSayisi: 0,
      rahatsizlikSayisi: 0,
      toplamSikayetSayisi: 0,
      sohbetEngelli: false,
      toplulukEngelli: false,
      fotografKaldirildi: false,
      sonGuncellemeTarihi: Date.now(),
      aktif: true,
    };
    (yeniCeza as unknown as Record<string, unknown>)[banTuru] = deger;
    await setDoc(cezaRef, yeniCeza);
  } else {
    await updateDoc(cezaRef, {
      [banTuru]: deger,
      sonGuncellemeTarihi: Date.now(),
    });
  }
}

export async function tumCezalariGetir(): Promise<KullaniciCeza[]> {
  const snap = await getDocs(collection(firestore, "kullaniciCezalar"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KullaniciCeza));
}

// =============================================================================
// Harita Kayıtları
// =============================================================================

export async function toplulukKopekleriSayfaGetir(
  sonDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: ToplulukKopek[]; sonDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(firestore, "toplulukKopekleri"),
    orderBy("olusturmaTarihi", "desc"),
    limit(SAYFA_BOYUTU)
  );
  if (sonDoc) q = query(q, startAfter(sonDoc));

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ToplulukKopek));
  const lastDoc =
    snap.docs.length === SAYFA_BOYUTU ? snap.docs[snap.docs.length - 1] : null;
  return { items, sonDoc: lastDoc };
}

export async function tumBolgeleriGetir(): Promise<ToplulukBolge[]> {
  const snap = await getDocs(
    query(collection(firestore, "toplulukBolgeleri"), orderBy("olusturmaTarihi", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ToplulukBolge));
}

export async function toplulukKopekAktifToggle(id: string, aktif: boolean): Promise<void> {
  await updateDoc(doc(firestore, "toplulukKopekleri", id), {
    aktif,
    guncellemeTarihi: Date.now(),
  });
}

export async function toplulukBolgeAktifToggle(id: string, aktif: boolean): Promise<void> {
  await updateDoc(doc(firestore, "toplulukBolgeleri", id), {
    aktif,
    guncellemeTarihi: Date.now(),
  });
}

export async function toplulukKopekSil(id: string): Promise<void> {
  await deleteDoc(doc(firestore, "toplulukKopekleri", id));
}

export async function toplulukBolgeSil(id: string): Promise<void> {
  await deleteDoc(doc(firestore, "toplulukBolgeleri", id));
}

// =============================================================================
// Şikayetler
// =============================================================================

export async function tumSikayetleriGetir(): Promise<Sikayet[]> {
  const snap = await getDocs(
    query(collection(firestore, "sikayetler"), orderBy("olusturmaTarihi", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sikayet));
}

export async function sikayetiIslendiIsaretle(sikayetId: string): Promise<void> {
  await updateDoc(doc(firestore, "sikayetler", sikayetId), {
    durum: "islendi",
  });
}

// =============================================================================
// Push Bildirimleri
// =============================================================================

export async function pushBildirimGonder(
  baslik: string,
  govde: string,
  hedef: "hepsi" | string,
  url?: string,
  gonderenId?: string
): Promise<string> {
  const bildirim: Omit<PushBildirim, "id"> = {
    baslik,
    govde,
    url: url || "",
    hedef,
    gonderenId: gonderenId || auth.currentUser?.uid || "",
    durum: "beklemede",
    tarih: Date.now(),
  };
  const ref = await addDoc(collection(firestore, "pushBildirimleri"), bildirim);
  return ref.id;
}

export async function gecmisPushBildirimleriGetir(): Promise<PushBildirim[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "pushBildirimleri"),
      orderBy("tarih", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PushBildirim));
}
