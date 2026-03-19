// =============================================================================
// PawLand - Eğitim Servisi
// Eğitim kayıtları ve komut takibi CRUD işlemleri
// =============================================================================

import { db } from "../db/database";
import type { EgitimKaydi, EgitimSeviye } from "../types/models";

// -----------------------------------------------------------------------------
// Eğitim kaydı ekle
// -----------------------------------------------------------------------------
export async function egitimKaydiEkle(kayit: Omit<EgitimKaydi, "id">): Promise<number> {
  return await db.egitimKayitlari.add(kayit);
}

// -----------------------------------------------------------------------------
// Köpeğin tüm eğitim kayıtlarını getir (tarih sıralı)
// -----------------------------------------------------------------------------
export async function kopekEgitimKayitlariGetir(kopekId: number): Promise<EgitimKaydi[]> {
  return await db.egitimKayitlari
    .where("kopekId")
    .equals(kopekId)
    .reverse()
    .sortBy("tarih");
}

// -----------------------------------------------------------------------------
// Belirli komut için kayıtları getir
// -----------------------------------------------------------------------------
export async function komutKayitlariGetir(
  kopekId: number,
  komut: string
): Promise<EgitimKaydi[]> {
  return await db.egitimKayitlari
    .where({ kopekId, komut })
    .reverse()
    .sortBy("tarih");
}

// -----------------------------------------------------------------------------
// Tüm öğrenilen komutları getir (unique)
// -----------------------------------------------------------------------------
export async function ogrendigiKomutlar(kopekId: number): Promise<string[]> {
  const kayitlar = await db.egitimKayitlari.where("kopekId").equals(kopekId).toArray();
  const komutlar = new Set(kayitlar.map((k) => k.komut));
  return Array.from(komutlar);
}

// -----------------------------------------------------------------------------
// Komut başarı oranını hesapla (son 5 kayıt)
// -----------------------------------------------------------------------------
export async function komutBasariOraniHesapla(
  kopekId: number,
  komut: string
): Promise<number> {
  const kayitlar = await komutKayitlariGetir(kopekId, komut);
  const son5 = kayitlar.slice(0, 5);

  if (son5.length === 0) return 0;

  const toplamOran = son5.reduce((sum, k) => sum + (k.basariOrani || 0), 0);
  return Math.round(toplamOran / son5.length);
}

// -----------------------------------------------------------------------------
// Komut seviyesini belirle (son kayıt bazlı)
// -----------------------------------------------------------------------------
export async function komutSeviyesiGetir(
  kopekId: number,
  komut: string
): Promise<EgitimSeviye | null> {
  const kayitlar = await komutKayitlariGetir(kopekId, komut);
  return kayitlar.length > 0 ? kayitlar[0].seviye : null;
}

// -----------------------------------------------------------------------------
// Eğitim kaydını güncelle
// -----------------------------------------------------------------------------
export async function egitimKaydiGuncelle(
  id: number,
  guncellemeler: Partial<EgitimKaydi>
): Promise<void> {
  await db.egitimKayitlari.update(id, guncellemeler);
}

// -----------------------------------------------------------------------------
// Eğitim kaydını sil
// -----------------------------------------------------------------------------
export async function egitimKaydiSil(id: number): Promise<void> {
  await db.egitimKayitlari.delete(id);
}

// -----------------------------------------------------------------------------
// Seviye badge rengi
// -----------------------------------------------------------------------------
export function seviyeBadgeRengi(seviye: EgitimSeviye): string {
  switch (seviye) {
    case "ogreniyor":
      return "bg-yellow-100 text-yellow-800";
    case "ilerliyor":
      return "bg-blue-100 text-blue-800";
    case "ustalasti":
      return "bg-green-100 text-green-800";
  }
}

// -----------------------------------------------------------------------------
// Seviye emoji
// -----------------------------------------------------------------------------
export function seviyeEmoji(seviye: EgitimSeviye): string {
  switch (seviye) {
    case "ogreniyor":
      return "";
    case "ilerliyor":
      return "";
    case "ustalasti":
      return "";
  }
}

// -----------------------------------------------------------------------------
// Eğitim istatistikleri
// -----------------------------------------------------------------------------
export async function egitimIstatistikleri(kopekId: number) {
  const tumKayitlar = await db.egitimKayitlari.where("kopekId").equals(kopekId).toArray();
  const komutlar = await ogrendigiKomutlar(kopekId);

  const seviyeGrup = tumKayitlar.reduce(
    (acc, kayit) => {
      acc[kayit.seviye] = (acc[kayit.seviye] || 0) + 1;
      return acc;
    },
    {} as Record<EgitimSeviye, number>
  );

  const toplamSure = tumKayitlar.reduce((sum, k) => sum + (k.sure || 0), 0);
  const ortalamaSure = tumKayitlar.length > 0 ? Math.round(toplamSure / tumKayitlar.length) : 0;

  // Ustalaşılan komutlar
  const ustalasanlar: string[] = [];
  for (const komut of komutlar) {
    const seviye = await komutSeviyesiGetir(kopekId, komut);
    if (seviye === "ustalasti") {
      ustalasanlar.push(komut);
    }
  }

  return {
    toplamKomut: komutlar.length,
    toplamSeans: tumKayitlar.length,
    ustalasanKomutSayisi: ustalasanlar.length,
    ustalasanKomutlar: ustalasanlar,
    seviyeGrup,
    toplamSure,
    ortalamaSure,
  };
}

// -----------------------------------------------------------------------------
// Popüler komut önerileri
// -----------------------------------------------------------------------------
export const POPULER_KOMUTLAR = [
  { komut: "Otur", emoji: "", kategori: "Temel" },
  { komut: "Yat", emoji: "", kategori: "Temel" },
  { komut: "Kal", emoji: "", kategori: "Temel" },
  { komut: "Gel", emoji: "", kategori: "Temel" },
  { komut: "Pati Ver", emoji: "", kategori: "Temel" },
  { komut: "Bırak", emoji: "", kategori: "Temel" },
  { komut: "Getir", emoji: "", kategori: "Oyun" },
  { komut: "Yuvarlan", emoji: "", kategori: "Oyun" },
  { komut: "Ses Çıkarma", emoji: "", kategori: "İleri" },
  { komut: "Tasma", emoji: "", kategori: "İleri" },
];
