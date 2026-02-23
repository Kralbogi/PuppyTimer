// =============================================================================
// PuppyTimer Web - Şikayet Servisi
// User report system with automatic penalty enforcement
// =============================================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { Sikayet, SikayetKategorisi, KullaniciCeza } from "../types/models";
import { kullaniciAdGetir } from "./kullaniciKimlik";

const SIKAYET_COLLECTION = "sikayetler";
const CEZA_COLLECTION = "kullaniciCezalar";

// Kategori bazlı ceza limitleri
const KATEGORI_LIMITLERI = {
  hakaret: 10, // 10 hakaret → sohbet engelli
  uygunsuz_gorsel: 10, // 10 uygunsuz görsel → fotoğraf kaldırıldı
  spam: 15, // 15 spam → uyarı (toplam sayıya dahil)
  rahatsizlik: 15, // 15 rahatsızlık → uyarı (toplam sayıya dahil)
};

const TOPLAM_LIMIT = 25; // 25+ toplam şikayet → topluluk engelli

// -----------------------------------------------------------------------------
// Şikayet Gönder
// -----------------------------------------------------------------------------

export async function sikayetGonder(
  sikayetEdilenId: string,
  sikayetEdilenKopekId: string,
  kategori: SikayetKategorisi,
  aciklama?: string
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Kendini şikayet edemez
  if (auth.currentUser.uid === sikayetEdilenId) {
    throw new Error("Kendinizi şikayet edemezsiniz");
  }

  // Aynı kullanıcı aynı köpeği aynı kategoride tekrar şikayet edemiyor (spam prevention)
  const mevcutSikayet = await mevcutSikayetKontrol(
    auth.currentUser.uid,
    sikayetEdilenKopekId,
    kategori
  );

  if (mevcutSikayet) {
    throw new Error("Bu köpeği bu kategoride daha önce şikayet ettiniz");
  }

  // Şikayeti kaydet
  const yeniSikayet: Omit<Sikayet, "id"> = {
    sikayetEdenId: auth.currentUser.uid,
    sikayetEdenAd: kullaniciAdGetir(),
    sikayetEdilenId,
    sikayetEdilenKopekId,
    kategori,
    aciklama: aciklama || "",
    olusturmaTarihi: Date.now(),
    durum: "beklemede",
    aktif: true,
  };

  const docRef = await addDoc(collection(firestore, SIKAYET_COLLECTION), yeniSikayet);

  // Ceza puanını güncelle ve limitleri kontrol et
  await cezaPuaniGuncelle(sikayetEdilenId, kategori);

  return docRef.id;
}

// -----------------------------------------------------------------------------
// Mevcut Şikayet Kontrolü (Spam prevention)
// -----------------------------------------------------------------------------

async function mevcutSikayetKontrol(
  sikayetEdenId: string,
  sikayetEdilenKopekId: string,
  kategori: SikayetKategorisi
): Promise<boolean> {
  const q = query(
    collection(firestore, SIKAYET_COLLECTION),
    where("sikayetEdenId", "==", sikayetEdenId),
    where("sikayetEdilenKopekId", "==", sikayetEdilenKopekId),
    where("kategori", "==", kategori),
    where("aktif", "==", true)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// -----------------------------------------------------------------------------
// Ceza Puanı Güncelle
// -----------------------------------------------------------------------------

async function cezaPuaniGuncelle(
  kullaniciId: string,
  kategori: SikayetKategorisi
): Promise<void> {
  const cezaRef = doc(firestore, CEZA_COLLECTION, kullaniciId);
  const cezaSnap = await getDoc(cezaRef);

  let ceza: KullaniciCeza;

  if (!cezaSnap.exists()) {
    // İlk şikayet - yeni ceza kaydı oluştur
    ceza = {
      id: kullaniciId,
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
  } else {
    ceza = cezaSnap.data() as KullaniciCeza;
  }

  // Kategori sayısını artır
  switch (kategori) {
    case "hakaret":
      ceza.hakaretSayisi++;
      break;
    case "spam":
      ceza.spamSayisi++;
      break;
    case "uygunsuz_gorsel":
      ceza.uygunsuzGorselSayisi++;
      break;
    case "rahatsizlik":
      ceza.rahatsizlikSayisi++;
      break;
  }

  ceza.toplamSikayetSayisi++;
  ceza.sonGuncellemeTarihi = Date.now();

  // Kategori bazlı cezaları kontrol et
  if (kategori === "hakaret" && ceza.hakaretSayisi >= KATEGORI_LIMITLERI.hakaret) {
    ceza.sohbetEngelli = true;
    console.log(`🚫 Kullanıcı ${kullaniciId} sohbetten engellendi (${ceza.hakaretSayisi} hakaret)`);
  }

  if (
    kategori === "uygunsuz_gorsel" &&
    ceza.uygunsuzGorselSayisi >= KATEGORI_LIMITLERI.uygunsuz_gorsel
  ) {
    ceza.fotografKaldirildi = true;
    console.log(
      `🚫 Kullanıcı ${kullaniciId} fotoğrafı kaldırıldı (${ceza.uygunsuzGorselSayisi} uygunsuz görsel)`
    );
  }

  // Toplam cezayı kontrol et
  if (ceza.toplamSikayetSayisi >= TOPLAM_LIMIT) {
    ceza.toplulukEngelli = true;
    console.log(
      `🚫 Kullanıcı ${kullaniciId} topluluktan engellendi (${ceza.toplamSikayetSayisi} toplam şikayet)`
    );
  }

  // Kaydet
  await setDoc(cezaRef, ceza);
}

// -----------------------------------------------------------------------------
// Kullanıcı Ceza Durumunu Getir
// -----------------------------------------------------------------------------

export async function kullaniciCezaDurumuGetir(
  kullaniciId: string
): Promise<KullaniciCeza | null> {
  const cezaRef = doc(firestore, CEZA_COLLECTION, kullaniciId);
  const cezaSnap = await getDoc(cezaRef);

  if (!cezaSnap.exists()) {
    return null;
  }

  return cezaSnap.data() as KullaniciCeza;
}

// -----------------------------------------------------------------------------
// Sohbet Engelli mi Kontrol
// -----------------------------------------------------------------------------

export async function sohbetEngelliMi(kullaniciId: string): Promise<boolean> {
  const ceza = await kullaniciCezaDurumuGetir(kullaniciId);
  return ceza?.sohbetEngelli || false;
}

// -----------------------------------------------------------------------------
// Topluluk Engelli mi Kontrol
// -----------------------------------------------------------------------------

export async function toplulukEngelliMi(kullaniciId: string): Promise<boolean> {
  const ceza = await kullaniciCezaDurumuGetir(kullaniciId);
  return ceza?.toplulukEngelli || false;
}

// -----------------------------------------------------------------------------
// Fotoğraf Kaldırıldı mı Kontrol
// -----------------------------------------------------------------------------

export async function fotografKaldirildiMi(kullaniciId: string): Promise<boolean> {
  const ceza = await kullaniciCezaDurumuGetir(kullaniciId);
  return ceza?.fotografKaldirildi || false;
}

// -----------------------------------------------------------------------------
// Kullanıcının Toplam Şikayet Sayısını Getir
// -----------------------------------------------------------------------------

export async function toplamSikayetSayisiGetir(kullaniciId: string): Promise<number> {
  const ceza = await kullaniciCezaDurumuGetir(kullaniciId);
  return ceza?.toplamSikayetSayisi || 0;
}
