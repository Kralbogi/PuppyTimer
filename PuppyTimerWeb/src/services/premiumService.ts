// =============================================================================
// PawLand - Premium Kullanıcı Servisi
// Premium durumu kontrolü ve yönetimi
// =============================================================================

import { doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "./firebase";
import { kullaniciIdGetir } from "./kullaniciKimlik";
import type { KullaniciPremium } from "../types/models";

const COLLECTION = "premiumKullanicilar";

// Real-time premium status listener
let premiumStatusUnsubscribe: (() => void) | null = null;
let currentPremiumStatus: boolean = false;
const premiumStatusCallbacks: ((isPremium: boolean) => void)[] = [];

/**
 * Subscribe to real-time premium status changes
 * Automatically updates when Firestore premium doc changes
 * (e.g., after Stripe payment webhook)
 */
export function subscribeToPremiumStatus(
  callback: (isPremium: boolean) => void,
  kullaniciId?: string
): () => void {
  const userId = kullaniciId || kullaniciIdGetir();
  
  // Store callback for future updates
  premiumStatusCallbacks.push(callback);

  // If we already have a listener, just use the current status
  if (premiumStatusUnsubscribe) {
    callback(currentPremiumStatus);
    return () => {
      const idx = premiumStatusCallbacks.indexOf(callback);
      if (idx > -1) premiumStatusCallbacks.splice(idx, 1);
    };
  }

  // Setup real-time listener
  const unsubscribe = onSnapshot(
    doc(firestore, COLLECTION, userId),
    (docSnap) => {
      if (!docSnap.exists()) {
        currentPremiumStatus = false;
        premiumStatusCallbacks.forEach((cb) => cb(false));
        return;
      }

      const data = docSnap.data() as KullaniciPremium;
      
      // Check if premium is active
      const isPremium =
        data.premium === true &&
        data.aktif === true &&
        (!data.bitisTarihi || data.bitisTarihi > Date.now());

      // Only update if status changed
      if (isPremium !== currentPremiumStatus) {
        currentPremiumStatus = isPremium;
        console.log(`💎 Premium status changed: ${isPremium}`);
        
        // Call all registered callbacks
        premiumStatusCallbacks.forEach((cb) => {
          try {
            cb(isPremium);
          } catch (error) {
            console.error("Callback error:", error);
          }
        });
      }
    },
    (error) => {
      console.error("Premium listener error:", error);
      // Fallback to false on error
      if (!currentPremiumStatus) {
        premiumStatusCallbacks.forEach((cb) => cb(false));
      }
    }
  );

  premiumStatusUnsubscribe = unsubscribe;

  // Return unsubscribe function
  return () => {
    const idx = premiumStatusCallbacks.indexOf(callback);
    if (idx > -1) premiumStatusCallbacks.splice(idx, 1);

    // Unsubscribe if no more listeners
    if (premiumStatusCallbacks.length === 0 && premiumStatusUnsubscribe) {
      premiumStatusUnsubscribe();
      premiumStatusUnsubscribe = null;
    }
  };
}

// Kullanıcının premium olup olmadığını kontrol et
// Note: For real-time updates, use subscribeToPremiumStatus() instead
export async function premiumMi(kullaniciId?: string): Promise<boolean> {
  try {
    const userId = kullaniciId || kullaniciIdGetir();
    const docRef = doc(firestore, COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return false;

    const data = docSnap.data() as KullaniciPremium;

    // Premium değilse
    if (!data.premium || !data.aktif) return false;

    // Bitiş tarihi varsa kontrol et
    if (data.bitisTarihi && data.bitisTarihi < Date.now()) {
      // Süresi dolmuş, premium'u kapat
      await setDoc(docRef, { ...data, premium: false, aktif: false }, { merge: true });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Premium kontrol hatası:", error);
    return false;
  }
}

/**
 * Get current premium status without waiting for network
 * Returns the last known status from the real-time listener
 */
export function getPremiumStatusSync(): boolean {
  return currentPremiumStatus;
}

// Kullanıcıya premium ver
export async function premiumVer(
  kullaniciId: string,
  tur: "lifetime" | "monthly" | "yearly" = "lifetime"
): Promise<void> {
  const docRef = doc(firestore, COLLECTION, kullaniciId);

  let bitisTarihi: number | undefined = undefined;
  if (tur === "monthly") {
    bitisTarihi = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 gün
  } else if (tur === "yearly") {
    bitisTarihi = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 yıl
  }

  const premiumData: any = {
    id: kullaniciId,
    premium: true,
    baslangicTarihi: Date.now(),
    odemeTuru: tur,
    aktif: true,
  };

  // Only add bitisTarihi if it's defined (for monthly/yearly)
  if (bitisTarihi) {
    premiumData.bitisTarihi = bitisTarihi;
  }

  await setDoc(docRef, premiumData);
  console.log(`Premium verildi: ${kullaniciId} (${tur})`);
}

// Kullanıcıdan premium'u kaldır
export async function premiumKaldir(kullaniciId: string): Promise<void> {
  const docRef = doc(firestore, COLLECTION, kullaniciId);
  await setDoc(docRef, { premium: false, aktif: false }, { merge: true });
  console.log(`Premium kaldırıldı: ${kullaniciId}`);
}

// Tüm premium kullanıcıları getir (admin için)
export async function tumPremiumKullanicilariGetir(): Promise<KullaniciPremium[]> {
  const q = query(collection(firestore, COLLECTION), where("aktif", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as KullaniciPremium);
}

// Renk değişiklik hakkı kontrolü (free: 2, premium: sınırsız)
export function renkDegisiklikHakkiKontrol(kopekId: number): { kalanHak: number; premiumGerekli: boolean } {
  const key = `renkDegisiklikSayaci_${kopekId}`;
  const data = localStorage.getItem(key);

  if (!data) {
    return { kalanHak: 2, premiumGerekli: false };
  }

  const sayac = JSON.parse(data);
  const kalanHak = Math.max(0, 2 - sayac.degisiklikSayisi);

  return {
    kalanHak,
    premiumGerekli: kalanHak === 0,
  };
}

// Renk değişiklik sayacını artır
export function renkDegisiklikSayaciniArtir(kopekId: number): void {
  const key = `renkDegisiklikSayaci_${kopekId}`;
  const data = localStorage.getItem(key);

  if (!data) {
    localStorage.setItem(
      key,
      JSON.stringify({
        kopekId,
        degisiklikSayisi: 1,
        sonDegisiklik: Date.now(),
      })
    );
  } else {
    const sayac = JSON.parse(data);
    sayac.degisiklikSayisi += 1;
    sayac.sonDegisiklik = Date.now();
    localStorage.setItem(key, JSON.stringify(sayac));
  }
}

// =============================================================================
// İsim Değişiklik Kısıtlaması (Normal: 1, Premium: 3, 24 saat bekleme)
// =============================================================================

export function isimDegisiklikHakkiKontrol(
  kopekId: number,
  isPremium: boolean
): { kalanHak: number; sonDegisiklikZamani: number | null; beklemeSuresi: number | null } {
  const key = `isimDegisiklikSayaci_${kopekId}`;
  const data = localStorage.getItem(key);

  const maxHak = isPremium ? 3 : 1;
  const bekleme24Saat = 24 * 60 * 60 * 1000; // 24 hours in ms

  if (!data) {
    return { kalanHak: maxHak, sonDegisiklikZamani: null, beklemeSuresi: null };
  }

  const sayac = JSON.parse(data);
  const sonDegisiklik = sayac.sonDegisiklik || 0;
  const gecenSure = Date.now() - sonDegisiklik;

  // Premium kullanıcılar için 24 saat kontrolü
  if (isPremium && sayac.degisiklikSayisi >= maxHak && gecenSure < bekleme24Saat) {
    const kalanBekleme = bekleme24Saat - gecenSure;
    return { kalanHak: 0, sonDegisiklikZamani: sonDegisiklik, beklemeSuresi: kalanBekleme };
  }

  // Premium kullanıcılar için 24 saat geçtiyse sıfırla
  if (isPremium && gecenSure >= bekleme24Saat) {
    localStorage.removeItem(key);
    return { kalanHak: maxHak, sonDegisiklikZamani: null, beklemeSuresi: null };
  }

  const kalanHak = Math.max(0, maxHak - sayac.degisiklikSayisi);
  return {
    kalanHak,
    sonDegisiklikZamani: sonDegisiklik,
    beklemeSuresi: isPremium && kalanHak === 0 ? bekleme24Saat - gecenSure : null,
  };
}

export function isimDegisiklikSayaciniArtir(kopekId: number): void {
  const key = `isimDegisiklikSayaci_${kopekId}`;
  const data = localStorage.getItem(key);

  if (!data) {
    localStorage.setItem(
      key,
      JSON.stringify({
        kopekId,
        degisiklikSayisi: 1,
        sonDegisiklik: Date.now(),
      })
    );
  } else {
    const sayac = JSON.parse(data);
    sayac.degisiklikSayisi += 1;
    sayac.sonDegisiklik = Date.now();
    localStorage.setItem(key, JSON.stringify(sayac));
  }
}

// =============================================================================
// Rumuz Değişiklik Kısıtlaması (Normal: 1, Premium: 3, 24 saat bekleme)
// =============================================================================

export function rumuzDegisiklikHakkiKontrol(
  kullaniciId: string,
  isPremium: boolean
): { kalanHak: number; sonDegisiklikZamani: number | null; beklemeSuresi: number | null } {
  const key = `rumuzDegisiklikSayaci_${kullaniciId}`;
  const data = localStorage.getItem(key);

  const maxHak = isPremium ? 3 : 1;
  const bekleme24Saat = 24 * 60 * 60 * 1000; // 24 hours in ms

  if (!data) {
    return { kalanHak: maxHak, sonDegisiklikZamani: null, beklemeSuresi: null };
  }

  const sayac = JSON.parse(data);
  const sonDegisiklik = sayac.sonDegisiklik || 0;
  const gecenSure = Date.now() - sonDegisiklik;

  // Premium kullanıcılar için 24 saat kontrolü
  if (isPremium && sayac.degisiklikSayisi >= maxHak && gecenSure < bekleme24Saat) {
    const kalanBekleme = bekleme24Saat - gecenSure;
    return { kalanHak: 0, sonDegisiklikZamani: sonDegisiklik, beklemeSuresi: kalanBekleme };
  }

  // Premium kullanıcılar için 24 saat geçtiyse sıfırla
  if (isPremium && gecenSure >= bekleme24Saat) {
    localStorage.removeItem(key);
    return { kalanHak: maxHak, sonDegisiklikZamani: null, beklemeSuresi: null };
  }

  const kalanHak = Math.max(0, maxHak - sayac.degisiklikSayisi);
  return {
    kalanHak,
    sonDegisiklikZamani: sonDegisiklik,
    beklemeSuresi: isPremium && kalanHak === 0 ? bekleme24Saat - gecenSure : null,
  };
}

export function rumuzDegisiklikSayaciniArtir(kullaniciId: string): void {
  const key = `rumuzDegisiklikSayaci_${kullaniciId}`;
  const data = localStorage.getItem(key);

  if (!data) {
    localStorage.setItem(
      key,
      JSON.stringify({
        kullaniciId,
        degisiklikSayisi: 1,
        sonDegisiklik: Date.now(),
      })
    );
  } else {
    const sayac = JSON.parse(data);
    sayac.degisiklikSayisi += 1;
    sayac.sonDegisiklik = Date.now();
    localStorage.setItem(key, JSON.stringify(sayac));
  }
}
