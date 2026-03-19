// =============================================================================
// PawLand - Bakim Servisi
// Bakım kayıtları CRUD işlemleri (banyo, tırnak, traş, diş)
// =============================================================================

import { db } from "../db/database";
import type { BakimKaydi, BakimTuru } from "../types/models";

// -----------------------------------------------------------------------------
// Bakım kaydı ekle
// -----------------------------------------------------------------------------
export async function bakimKaydiEkle(kayit: Omit<BakimKaydi, "id">): Promise<number> {
  return await db.bakimKayitlari.add(kayit);
}

// -----------------------------------------------------------------------------
// Köpeğin tüm bakım kayıtlarını getir (tarih sıralı)
// -----------------------------------------------------------------------------
export async function kopekBakimKayitlariGetir(kopekId: number): Promise<BakimKaydi[]> {
  return await db.bakimKayitlari
    .where("kopekId")
    .equals(kopekId)
    .reverse()
    .sortBy("tarih");
}

// -----------------------------------------------------------------------------
// Belirli bakım türüne göre kayıtları getir
// -----------------------------------------------------------------------------
export async function bakimTuruneGoreGetir(
  kopekId: number,
  bakimTuru: BakimTuru
): Promise<BakimKaydi[]> {
  return await db.bakimKayitlari
    .where({ kopekId, bakimTuru })
    .reverse()
    .sortBy("tarih");
}

// -----------------------------------------------------------------------------
// En son bakım tarihini getir (bakım türüne göre)
// -----------------------------------------------------------------------------
export async function sonBakimTarihiGetir(
  kopekId: number,
  bakimTuru: BakimTuru
): Promise<number | null> {
  const kayitlar = await db.bakimKayitlari
    .where({ kopekId, bakimTuru })
    .reverse()
    .sortBy("tarih");

  return kayitlar.length > 0 ? kayitlar[0].tarih : null;
}

// -----------------------------------------------------------------------------
// Bakım kaydını güncelle
// -----------------------------------------------------------------------------
export async function bakimKaydiGuncelle(id: number, guncellemeler: Partial<BakimKaydi>): Promise<void> {
  await db.bakimKayitlari.update(id, guncellemeler);
}

// -----------------------------------------------------------------------------
// Bakım kaydını sil
// -----------------------------------------------------------------------------
export async function bakimKaydiSil(id: number): Promise<void> {
  await db.bakimKayitlari.delete(id);
}

// -----------------------------------------------------------------------------
// Sonraki bakım zamanı hesapla (önerilen)
// -----------------------------------------------------------------------------
export function sonrakiBakimOneri(bakimTuru: BakimTuru): number {
  const now = Date.now();
  const gunler = {
    banyo: 30, // Her ay
    tirnak: 21, // Her 3 hafta
    tras: 60, // Her 2 ay (uzun tüylü ırklar için)
    dis: 7, // Her hafta
  };

  const gunMilisaniye = 24 * 60 * 60 * 1000;
  return now + gunler[bakimTuru] * gunMilisaniye;
}

// -----------------------------------------------------------------------------
// Gelecek hafta içinde bakım yapılması gerekenler
// -----------------------------------------------------------------------------
export async function yakindaBakimGerekenler(kopekId: number): Promise<BakimKaydi[]> {
  const simdi = Date.now();
  const birHaftaSonra = simdi + 7 * 24 * 60 * 60 * 1000;

  const tumKayitlar = await db.bakimKayitlari.where("kopekId").equals(kopekId).toArray();

  return tumKayitlar.filter(
    (kayit) => kayit.sonrakiTarih && kayit.sonrakiTarih <= birHaftaSonra && kayit.sonrakiTarih > simdi
  );
}

// -----------------------------------------------------------------------------
// Bakım istatistikleri
// -----------------------------------------------------------------------------
export async function bakimIstatistikleri(kopekId: number) {
  const tumKayitlar = await db.bakimKayitlari.where("kopekId").equals(kopekId).toArray();

  const turlereSayilar = tumKayitlar.reduce(
    (acc, kayit) => {
      acc[kayit.bakimTuru] = (acc[kayit.bakimTuru] || 0) + 1;
      return acc;
    },
    {} as Record<BakimTuru, number>
  );

  const toplamMaliyet = tumKayitlar.reduce((sum, kayit) => sum + (kayit.maliyet || 0), 0);
  const profesyonelSayisi = tumKayitlar.filter((k) => k.profesyonel).length;

  return {
    toplamKayit: tumKayitlar.length,
    turlereSayilar,
    toplamMaliyet,
    profesyonelSayisi,
    evdeSayisi: tumKayitlar.length - profesyonelSayisi,
  };
}
