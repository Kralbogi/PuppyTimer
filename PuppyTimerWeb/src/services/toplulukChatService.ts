// =============================================================================
// PawLand - Topluluk Chat Servisi
// Community chat with rate limiting, profanity filter, and moderation
// =============================================================================

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import { sohbetEngelliMi } from "./sikayetService";
import type { ToplulukMesaj, RateLimitData, HakaretAyarlari } from "../types/models";

const TOPLULUK_MESAJLARI_COLLECTION = "toplulukMesajlari";
const HAKARET_AYARLARI_COLLECTION = "ayarlar";
const HAKARET_AYARLARI_DOC = "hakaretKelimeleri";
const RATE_LIMIT_STORAGE_KEY_PREFIX = "toplulukChatRateLimit_";
const ENGELLENENLER_STORAGE_KEY = "toplulukChatEngellenenler";
const MAX_MESAJ_SAYISI = 5; // 5 dakikada max 5 mesaj
const RATE_LIMIT_SURESI = 5 * 60 * 1000; // 5 dakika (ms)
const MAX_KARAKTER = 150;

// Cache for profanity list (refreshed every 5 minutes)
let cachedHakaretListesi: string[] | null = null;
let cacheExpiry: number = 0;

// Hakaret listesi - Kapsamlı kelime filtresi
const HAKARET_LISTESI = [
  // Genel hakaretler
  "aptal",
  "salak",
  "gerizekalı",
  "ahmak",
  "mal",
  "dangalak",
  "sersem",
  "budala",
  "geri zekalı",
  "gerzek",
  "enayi",
  "şerefsiz",
  "namussuz",
  "alçak",
  "hain",
  "pislik",
  "köpek",
  "it",
  "domuz",
  "eşek",
  "merkep",
  "orospu",
  "pezevenk",
  "kaltak",
  "sürtük",
  "fahişe",

  // Cinsel içerikli küfürler (yaygın varyasyonlar)
  "sik",
  "amk",
  "amına",
  "amina",
  "sikerim",
  "sikeyim",
  "götünü",
  "gotunu",
  "göt",
  "got",
  "yarrak",
  "taşak",
  "tasak",
  "piç",
  "pic",
  "ananı",
  "anani",
  "babanı",
  "babani",
  "anneni",
  "annen",

  // Organ/vücut bölümleri (küfür bağlamında)
  "amcık",
  "amcik",
  "am",

  // Kısaltmalar ve internet slangı
  "aq",
  "mk",
  "sg",
  "sktir",
  "sktr",
  "amq",
  "oç",
  "oc",
  "yavşak",
  "yavsak",

  // Dini hakaretler
  "allah",
  "peygamber",
  "din",
  "iman",

  // Diğer ağır hakaretler
  "ibne",
  "top",
  "gey",
  "lezbiyen",
  "travesti",
];

/**
 * Get profanity list from Firestore (with 5-minute cache)
 */
async function getHakaretListesi(): Promise<string[]> {
  // Check cache
  const now = Date.now();
  if (cachedHakaretListesi && now < cacheExpiry) {
    return cachedHakaretListesi;
  }

  try {
    const docRef = doc(firestore, HAKARET_AYARLARI_COLLECTION, HAKARET_AYARLARI_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as HakaretAyarlari;
      cachedHakaretListesi = data.kelimeler || HAKARET_LISTESI;
      cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes
      return cachedHakaretListesi;
    }
  } catch (error) {
    console.error("Firestore'dan hakaret listesi okunamadı:", error);
  }

  // Fallback to hardcoded list
  cachedHakaretListesi = HAKARET_LISTESI;
  cacheExpiry = now + 5 * 60 * 1000;
  return cachedHakaretListesi;
}

/**
 * Save profanity list to Firestore (admin only)
 */
export async function saveHakaretListesi(kelimeler: string[]): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Yetkilendirme gerekli");
  }

  const docRef = doc(firestore, HAKARET_AYARLARI_COLLECTION, HAKARET_AYARLARI_DOC);
  const data: HakaretAyarlari = {
    kelimeler: kelimeler.map(k => k.toLowerCase().trim()).filter(k => k.length > 0),
    guncellemeTarihi: Date.now(),
    guncelleyen: auth.currentUser.uid,
  };

  await setDoc(docRef, data);

  // Clear cache
  cachedHakaretListesi = null;
  cacheExpiry = 0;
}

/**
 * Get current profanity list (for admin panel)
 */
export async function loadHakaretListesi(): Promise<string[]> {
  // Force refresh by clearing cache
  cachedHakaretListesi = null;
  cacheExpiry = 0;
  return await getHakaretListesi();
}

/**
 * Check if message contains profanity
 * Uses word boundary matching to avoid false positives (e.g., "selam" won't match "am")
 */
async function hakaretIceriyorMu(metin: string): Promise<boolean> {
  const kucukHarf = metin.toLowerCase().trim();
  const hakaretListesi = await getHakaretListesi();

  // Split into words and check exact matches to avoid false positives
  const kelimeler = kucukHarf.split(/\s+/);

  return hakaretListesi.some((hakaret) => {
    // Check if the profanity appears as a standalone word
    if (kelimeler.includes(hakaret)) {
      return true;
    }

    // Also check if it appears with punctuation (e.g., "am!" or "am,")
    const regex = new RegExp(`\\b${hakaret}\\b`, 'i');
    return regex.test(kucukHarf);
  });
}

/**
 * Get rate limit data from localStorage
 */
function getRateLimitData(): RateLimitData {
  if (!auth.currentUser) {
    return { mesajZamanlari: [], sonKontrol: Date.now() };
  }

  const key = RATE_LIMIT_STORAGE_KEY_PREFIX + auth.currentUser.uid;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const data: RateLimitData = JSON.parse(stored);
      // Filter out timestamps older than 5 minutes
      const simdi = Date.now();
      data.mesajZamanlari = data.mesajZamanlari.filter(
        (timestamp) => simdi - timestamp < RATE_LIMIT_SURESI
      );
      return data;
    }
  } catch (error) {
    console.error("localStorage rate limit okuma hatasi:", error);
  }

  return { mesajZamanlari: [], sonKontrol: Date.now() };
}

/**
 * Update rate limit data in localStorage
 */
function updateRateLimitData(data: RateLimitData): void {
  if (!auth.currentUser) return;

  const key = RATE_LIMIT_STORAGE_KEY_PREFIX + auth.currentUser.uid;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("localStorage rate limit kaydetme hatasi:", error);
  }
}

/**
 * Check remaining message quota
 */
export function mesajHakkiKontrol(): {
  kalanHak: number;
  sonMesajZamani: number | null;
} {
  const data = getRateLimitData();
  const kalanHak = MAX_MESAJ_SAYISI - data.mesajZamanlari.length;
  const sonMesajZamani =
    data.mesajZamanlari.length > 0
      ? data.mesajZamanlari[data.mesajZamanlari.length - 1]
      : null;

  return { kalanHak, sonMesajZamani };
}

/**
 * Check if user has shared location in community map and get message color
 */
async function konumVeMesajRengiGetir(): Promise<{
  konumVar: boolean;
  mesajRengi?: import("../types/enums").MesajRengi;
}> {
  if (!auth.currentUser) return { konumVar: false };

  try {
    const q = query(
      collection(firestore, "toplulukKopekleri"),
      where("olusturanId", "==", auth.currentUser.uid),
      where("aktif", "==", true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { konumVar: false };
    }

    const kopekData = snapshot.docs[0].data();
    return {
      konumVar: true,
      mesajRengi: kopekData.mesajRengi,
    };
  } catch (error) {
    console.error("Konum kontrolü hatası:", error);
    return { konumVar: false };
  }
}

/**
 * Send community chat message
 */
export async function toplulukMesajiGonder(icerik: string): Promise<string> {
  // 1. Auth check
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Yetkilendirme başarısız");
  }

  // 2. Location check and get message color
  const { konumVar, mesajRengi } = await konumVeMesajRengiGetir();
  if (!konumVar) {
    throw new Error(
      "Sohbet kullanmak için önce haritada konumunuzu paylaşmalısınız"
    );
  }

  // 3. Trim and validate length
  const temizIcerik = icerik.trim();
  if (temizIcerik.length === 0) {
    throw new Error("Mesaj boş olamaz");
  }
  if (temizIcerik.length > MAX_KARAKTER) {
    throw new Error(`Mesaj en fazla ${MAX_KARAKTER} karakter olabilir`);
  }

  // 4. Chat ban check
  const chatBan = await sohbetEngelliMi(auth.currentUser.uid);
  if (chatBan) {
    throw new Error(
      "Sohbet yasağınız var. Çok fazla hakaret şikayeti aldınız."
    );
  }

  // 5. Rate limit check
  const rateLimitData = getRateLimitData();
  if (rateLimitData.mesajZamanlari.length >= MAX_MESAJ_SAYISI) {
    const enEskiMesaj = rateLimitData.mesajZamanlari[0];
    const kalanSure = Math.ceil(
      (RATE_LIMIT_SURESI - (Date.now() - enEskiMesaj)) / 1000 / 60
    );
    throw new Error(
      `Mesaj hakkınız doldu. ${kalanSure} dakika sonra tekrar deneyin.`
    );
  }

  // 6. Profanity filter check
  if (await hakaretIceriyorMu(temizIcerik)) {
    throw new Error("Mesajınız uygunsuz kelime içeriyor");
  }

  // 7. Get user display name
  const gonderenAd = auth.currentUser.displayName || "Anonim";

  // 8. Add message to Firestore
  const mesajData: Record<string, unknown> = {
    gonderenId: auth.currentUser.uid,
    gonderenAd,
    icerik: temizIcerik,
    olusturmaTarihi: Date.now(),
    aktif: true,
  };

  // Add message color if available (Premium feature)
  if (mesajRengi) {
    mesajData.mesajRengi = mesajRengi;
  }

  const docRef = await addDoc(
    collection(firestore, TOPLULUK_MESAJLARI_COLLECTION),
    mesajData
  );

  // 9. Update rate limit data
  rateLimitData.mesajZamanlari.push(Date.now());
  rateLimitData.sonKontrol = Date.now();
  updateRateLimitData(rateLimitData);

  return docRef.id;
}

/**
 * Real-time listener for community chat messages
 */
export function toplulukMesajlariniDinle(
  callback: (mesajlar: ToplulukMesaj[]) => void
): () => void {
  const q = query(
    collection(firestore, TOPLULUK_MESAJLARI_COLLECTION),
    where("aktif", "==", true),
    orderBy("olusturmaTarihi", "desc"),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const mesajlar = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ToplulukMesaj[];

      callback(mesajlar);
    },
    (error) => {
      console.error("Topluluk mesajlari dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Get blocked users list from localStorage
 */
export function engellenenKullanicilar(): string[] {
  try {
    const stored = localStorage.getItem(ENGELLENENLER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as string[];
    }
  } catch (error) {
    console.error("localStorage engellenenler okuma hatasi:", error);
  }
  return [];
}

/**
 * Block a user
 */
export function kullaniciEngelle(kullaniciId: string): void {
  try {
    const engellenenler = engellenenKullanicilar();
    if (!engellenenler.includes(kullaniciId)) {
      engellenenler.push(kullaniciId);
      localStorage.setItem(
        ENGELLENENLER_STORAGE_KEY,
        JSON.stringify(engellenenler)
      );
    }
  } catch (error) {
    console.error("localStorage kullanici engelleme hatasi:", error);
  }
}

/**
 * Unblock a user
 */
export function kullaniciEngelKaldir(kullaniciId: string): void {
  try {
    const engellenenler = engellenenKullanicilar();
    const filtered = engellenenler.filter((id) => id !== kullaniciId);
    localStorage.setItem(ENGELLENENLER_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("localStorage engel kaldirma hatasi:", error);
  }
}

/**
 * Check if a user is blocked
 */
export function kullaniciEngelliMi(kullaniciId: string): boolean {
  const engellenenler = engellenenKullanicilar();
  return engellenenler.includes(kullaniciId);
}
