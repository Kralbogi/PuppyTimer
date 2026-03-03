// =============================================================================
// PuppyTimer Web - Başarı/Rozet Servisi
// Gamification - Achievement tracking
// =============================================================================

import { db } from "../db/database";
import type { Basari, BasariTuru } from "../types/models";
import { mevcutKullanici } from "./authService";

// -----------------------------------------------------------------------------
// Başarı tanımları
// -----------------------------------------------------------------------------
export const BASARI_TANIMLARI: Record<
  BasariTuru,
  { baslik: string; aciklama: string; icon: string; puan: number }
> = {
  ilk_yuruyus: {
    baslik: "İlk Adım",
    aciklama: "İlk yürüyüşünü tamamladın!",
    icon: "👣",
    puan: 10,
  },
  yuruyus_5: {
    baslik: "Düzenli Yürüyücü",
    aciklama: "5 yürüyüş tamamladın",
    icon: "🚶",
    puan: 25,
  },
  yuruyus_25: {
    baslik: "Aktif Köpek",
    aciklama: "25 yürüyüş tamamladın!",
    icon: "🏃",
    puan: 50,
  },
  yuruyus_100: {
    baslik: "Yürüyüş Ustası",
    aciklama: "100 yürüyüş tamamladın!",
    icon: "🏆",
    puan: 100,
  },
  ilk_asi: {
    baslik: "Sağlıklı Başlangıç",
    aciklama: "İlk aşıyı yaptırdın",
    icon: "💉",
    puan: 15,
  },
  ilk_bakim: {
    baslik: "Temiz Pati",
    aciklama: "İlk bakımı yaptın",
    icon: "🛁",
    puan: 15,
  },
  bakim_10: {
    baslik: "Bakımlı Köpek",
    aciklama: "10 bakım seansı tamamladın",
    icon: "✨",
    puan: 40,
  },
  ilk_egitim: {
    baslik: "Eğitim Başlangıcı",
    aciklama: "İlk eğitim seansını tamamladın",
    icon: "📚",
    puan: 15,
  },
  komut_5: {
    baslik: "Komut Ustası",
    aciklama: "5 farklı komut öğrettin",
    icon: "🎯",
    puan: 50,
  },
  komut_ustalasti: {
    baslik: "Mükemmel Eğitim",
    aciklama: "Bir komutu ustalaştırdın",
    icon: "🏅",
    puan: 60,
  },
  arkadas_5: {
    baslik: "Sosyal Köpek",
    aciklama: "5 arkadaş edindin",
    icon: "🤝",
    puan: 30,
  },
  arkadas_25: {
    baslik: "Popüler Köpek",
    aciklama: "25 arkadaş edindin!",
    icon: "🌟",
    puan: 75,
  },
  puan_100: {
    baslik: "Yükselen Yıldız",
    aciklama: "100 puan kazandın",
    icon: "⭐",
    puan: 0,
  },
  puan_500: {
    baslik: "Şampiyon",
    aciklama: "500 puan kazandın!",
    icon: "🏆",
    puan: 0,
  },
  puan_1000: {
    baslik: "Efsane",
    aciklama: "1000 puan kazandın!",
    icon: "👑",
    puan: 0,
  },
  topluluk_aktif: {
    baslik: "Topluluk Yıldızı",
    aciklama: "Haritada köpeğini paylaştın",
    icon: "🗺️",
    puan: 20,
  },
  harita_kesen_10: {
    baslik: "Kaşif",
    aciklama: "10 harita işaretçisi ekledin",
    icon: "📍",
    puan: 35,
  },
};

// -----------------------------------------------------------------------------
// Başarı ekle
// -----------------------------------------------------------------------------
export async function basariEkle(
  kopekId: number,
  basariTuru: BasariTuru
): Promise<number | null> {
  const user = mevcutKullanici();
  if (!user) return null;

  // Daha önce kazanılmış mı kontrol et
  const mevcut = await db.basarilar
    .where({ kullaniciId: user.uid, kopekId, basariTuru })
    .first();

  if (mevcut) {
    console.log(`Başarı zaten kazanılmış: ${basariTuru}`);
    return null;
  }

  const tanim = BASARI_TANIMLARI[basariTuru];
  const yeni: Omit<Basari, "id"> = {
    kullaniciId: user.uid,
    kopekId,
    basariTuru,
    baslik: tanim.baslik,
    aciklama: tanim.aciklama,
    iconEmoji: tanim.icon,
    kazanilmaTarihi: Date.now(),
    puan: tanim.puan,
  };

  const id = await db.basarilar.add(yeni);

  // Puanı köpeğe ekle
  if (tanim.puan > 0) {
    const kopek = await db.kopekler.get(kopekId);
    if (kopek) {
      const yeniPuan = (kopek.puan || 0) + tanim.puan;
      await db.kopekler.update(kopekId, { puan: yeniPuan });

      // Puan milestone kontrolü
      await puanMilestoneKontrol(kopekId, yeniPuan);
    }
  }

  return id;
}

// -----------------------------------------------------------------------------
// Kullanıcının tüm başarılarını getir
// -----------------------------------------------------------------------------
export async function basarilariGetir(kopekId: number): Promise<Basari[]> {
  const user = mevcutKullanici();
  if (!user) return [];

  return await db.basarilar
    .where({ kullaniciId: user.uid, kopekId })
    .reverse()
    .sortBy("kazanilmaTarihi");
}

// -----------------------------------------------------------------------------
// Başarı istatistikleri
// -----------------------------------------------------------------------------
export async function basariIstatistikleri(kopekId: number) {
  const basarilar = await basarilariGetir(kopekId);
  const toplamPuan = basarilar.reduce((sum, b) => sum + b.puan, 0);

  return {
    toplamBasari: basarilar.length,
    toplamPuan,
    sonBasari: basarilar[0] || null,
  };
}

// -----------------------------------------------------------------------------
// Otomatik başarı kontrolleri (tetikleyiciler)
// -----------------------------------------------------------------------------

// Yürüyüş başarıları
export async function yuruyusBasariKontrol(kopekId: number) {
  const yuruyusler = await db.yuruyusKayitlari
    .where({ kopekId, tamamlandi: true })
    .count();

  if (yuruyusler === 1) {
    await basariEkle(kopekId, "ilk_yuruyus");
  } else if (yuruyusler === 5) {
    await basariEkle(kopekId, "yuruyus_5");
  } else if (yuruyusler === 25) {
    await basariEkle(kopekId, "yuruyus_25");
  } else if (yuruyusler === 100) {
    await basariEkle(kopekId, "yuruyus_100");
  }
}

// Aşı başarıları
export async function asiBasariKontrol(kopekId: number) {
  const asilar = await db.asiKayitlari.where("kopekId").equals(kopekId).count();

  if (asilar === 1) {
    await basariEkle(kopekId, "ilk_asi");
  }
}

// Bakım başarıları
export async function bakimBasariKontrol(kopekId: number) {
  const bakimlar = await db.bakimKayitlari.where("kopekId").equals(kopekId).count();

  if (bakimlar === 1) {
    await basariEkle(kopekId, "ilk_bakim");
  } else if (bakimlar === 10) {
    await basariEkle(kopekId, "bakim_10");
  }
}

// Eğitim başarıları
export async function egitimBasariKontrol(kopekId: number) {
  const kayitlar = await db.egitimKayitlari.where("kopekId").equals(kopekId).toArray();

  // İlk eğitim
  if (kayitlar.length === 1) {
    await basariEkle(kopekId, "ilk_egitim");
  }

  // Farklı komutlar
  const komutlar = new Set(kayitlar.map((k) => k.komut));
  if (komutlar.size === 5) {
    await basariEkle(kopekId, "komut_5");
  }

  // Ustalaşan komut
  const ustalasanVar = kayitlar.some((k) => k.seviye === "ustalasti");
  if (ustalasanVar) {
    const mevcut = await db.basarilar
      .where({
        kopekId,
        basariTuru: "komut_ustalasti" as BasariTuru,
      })
      .count();
    if (mevcut === 0) {
      await basariEkle(kopekId, "komut_ustalasti");
    }
  }
}

// Harita başarıları
export async function haritaBasariKontrol(kopekId: number) {
  const isaretciler = await db.haritaIsaretcileri.where("kopekId").equals(kopekId).count();

  if (isaretciler === 10) {
    await basariEkle(kopekId, "harita_kesen_10");
  }
}

// Puan milestone kontrolü
async function puanMilestoneKontrol(kopekId: number, toplamPuan: number) {
  if (toplamPuan >= 1000) {
    await basariEkle(kopekId, "puan_1000");
  } else if (toplamPuan >= 500) {
    await basariEkle(kopekId, "puan_500");
  } else if (toplamPuan >= 100) {
    await basariEkle(kopekId, "puan_100");
  }
}

// -----------------------------------------------------------------------------
// Tüm başarıları kontrol et (uygulama başlangıcında)
// -----------------------------------------------------------------------------
export async function tumBasarilariKontrolEt(kopekId: number) {
  await yuruyusBasariKontrol(kopekId);
  await asiBasariKontrol(kopekId);
  await bakimBasariKontrol(kopekId);
  await egitimBasariKontrol(kopekId);
  await haritaBasariKontrol(kopekId);
}

// -----------------------------------------------------------------------------
// Başarı sil (sadece test için)
// -----------------------------------------------------------------------------
export async function basariSil(id: number): Promise<void> {
  await db.basarilar.delete(id);
}
