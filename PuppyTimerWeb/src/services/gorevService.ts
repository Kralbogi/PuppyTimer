// =============================================================================
// PuppyTimer Web - Görev Servisi
// Gamification: Mission system with points rewards
// =============================================================================

import { db } from "../db/database";
import { kullaniciIdGetir } from "./kullaniciKimlik";
import type { Gorev, KullaniciGorev } from "../types/models";

// =============================================================================
// Predefined Missions
// =============================================================================

export const GOREVLER: Gorev[] = [
  {
    id: "yuruyus_5km_haftalik",
    baslik: "İlk Adımlar",
    aciklama: "1 hafta içinde toplam 5 km yürüyüş yap",
    tur: "yuruyus_mesafe",
    zorluk: "kolay",
    hedef: 5000, // 5km in meters
    puan: 50,
    sure: 7, // 7 days
    icon: "🚶",
  },
  {
    id: "yuruyus_10km_haftalik",
    baslik: "Aktif Köpek",
    aciklama: "1 hafta içinde toplam 10 km yürüyüş yap",
    tur: "yuruyus_mesafe",
    zorluk: "orta",
    hedef: 10000, // 10km in meters
    puan: 100,
    sure: 7,
    icon: "🏃",
  },
  {
    id: "yuruyus_15km_haftalik",
    baslik: "Maraton Köpeği",
    aciklama: "1 hafta içinde toplam 15 km yürüyüş yap",
    tur: "yuruyus_mesafe",
    zorluk: "zor",
    hedef: 15000, // 15km in meters
    puan: 200,
    sure: 7,
    icon: "🏅",
  },
  {
    id: "yuruyus_25km_haftalik",
    baslik: "Süper Köpek",
    aciklama: "1 hafta içinde toplam 25 km yürüyüş yap",
    tur: "yuruyus_mesafe",
    zorluk: "efsane",
    hedef: 25000, // 25km in meters
    puan: 500,
    sure: 7,
    icon: "🏆",
  },
  // Beslenme görevleri
  {
    id: "beslenme_21_haftalik",
    baslik: "Düzenli Beslenme",
    aciklama: "1 hafta içinde 21 öğün besle (günde 3)",
    tur: "beslenme_sayi",
    zorluk: "kolay",
    hedef: 21,
    puan: 100,
    sure: 7,
    icon: "🍖",
  },
  {
    id: "beslenme_14_haftalik",
    baslik: "İyi Beslenme",
    aciklama: "1 hafta içinde 14 öğün besle (günde 2)",
    tur: "beslenme_sayi",
    zorluk: "kolay",
    hedef: 14,
    puan: 70,
    sure: 7,
    icon: "🥩",
  },
  // Su görevleri
  {
    id: "su_14_haftalik",
    baslik: "Su İçme Alışkanlığı",
    aciklama: "1 hafta içinde 14 kere su ver (günde 2)",
    tur: "su_sayi",
    zorluk: "kolay",
    hedef: 14,
    puan: 70,
    sure: 7,
    icon: "💧",
  },
  {
    id: "su_21_haftalik",
    baslik: "Bol Su",
    aciklama: "1 hafta içinde 21 kere su ver (günde 3)",
    tur: "su_sayi",
    zorluk: "orta",
    hedef: 21,
    puan: 100,
    sure: 7,
    icon: "💦",
  },
  // Tuvalet görevleri
  {
    id: "tuvalet_14_haftalik",
    baslik: "Düzenli Tuvalet",
    aciklama: "1 hafta içinde 14 tuvalet kaydı yap (günde 2)",
    tur: "tuvalet_sayi",
    zorluk: "kolay",
    hedef: 14,
    puan: 80,
    sure: 7,
    icon: "🌿",
  },
  {
    id: "tuvalet_21_haftalik",
    baslik: "Tuvalet Şampiyonu",
    aciklama: "1 hafta içinde 21 tuvalet kaydı yap (günde 3)",
    tur: "tuvalet_sayi",
    zorluk: "orta",
    hedef: 21,
    puan: 120,
    sure: 7,
    icon: "🍃",
  },
];

// =============================================================================
// Mission Functions
// =============================================================================

// Get mission by ID
export function gorevGetir(gorevId: string): Gorev | undefined {
  return GOREVLER.find((g) => g.id === gorevId);
}

// Get all active missions for a user/dog
export async function aktifGorevleriGetir(kopekId: number): Promise<KullaniciGorev[]> {
  const kullaniciId = kullaniciIdGetir();
  const now = Date.now();

  return await db.kullaniciGorevler
    .where("kullaniciId")
    .equals(kullaniciId)
    .and((gorev) => gorev.kopekId === kopekId && !gorev.tamamlandi && gorev.bitisTarihi > now)
    .toArray();
}

// Get completed missions for a user/dog
export async function tamamlanmisGorevleriGetir(kopekId: number): Promise<KullaniciGorev[]> {
  const kullaniciId = kullaniciIdGetir();

  return await db.kullaniciGorevler
    .where("kullaniciId")
    .equals(kullaniciId)
    .and((gorev) => gorev.kopekId === kopekId && gorev.tamamlandi)
    .toArray();
}

// Start a new mission
export async function gorevBaslat(kopekId: number, gorevId: string): Promise<void> {
  const kullaniciId = kullaniciIdGetir();
  const gorev = gorevGetir(gorevId);

  if (!gorev) {
    throw new Error("Görev bulunamadı");
  }

  // Check if already active
  const mevcutGorev = await db.kullaniciGorevler
    .where("kullaniciId")
    .equals(kullaniciId)
    .and((g) => g.kopekId === kopekId && g.gorevId === gorevId && !g.tamamlandi)
    .first();

  if (mevcutGorev) {
    throw new Error("Bu görev zaten aktif");
  }

  const baslangic = Date.now();
  const bitis = baslangic + gorev.sure * 24 * 60 * 60 * 1000;

  await db.kullaniciGorevler.add({
    kullaniciId,
    kopekId,
    gorevId,
    baslangicTarihi: baslangic,
    bitisTarihi: bitis,
    ilerleme: 0,
    tamamlandi: false,
    odul: gorev.puan,
  });

  console.log(`✅ Görev başlatıldı: ${gorev.baslik}`);
}

// Update mission progress
export async function gorevIlerlemesiGuncelle(
  kopekId: number,
  gorevId: string,
  yeniIlerleme: number
): Promise<{ tamamlandi: boolean; puan: number }> {
  const kullaniciId = kullaniciIdGetir();
  const gorev = gorevGetir(gorevId);

  if (!gorev) {
    throw new Error("Görev bulunamadı");
  }

  const kullaniciGorev = await db.kullaniciGorevler
    .where("kullaniciId")
    .equals(kullaniciId)
    .and((g) => g.kopekId === kopekId && g.gorevId === gorevId && !g.tamamlandi)
    .first();

  if (!kullaniciGorev || !kullaniciGorev.id) {
    throw new Error("Aktif görev bulunamadı");
  }

  // Check if deadline passed
  if (kullaniciGorev.bitisTarihi < Date.now()) {
    await db.kullaniciGorevler.update(kullaniciGorev.id, {
      tamamlandi: false,
      ilerleme: yeniIlerleme,
    });
    return { tamamlandi: false, puan: 0 };
  }

  // Update progress
  await db.kullaniciGorevler.update(kullaniciGorev.id, {
    ilerleme: yeniIlerleme,
  });

  // Check if completed
  if (yeniIlerleme >= gorev.hedef) {
    await db.kullaniciGorevler.update(kullaniciGorev.id, {
      tamamlandi: true,
      tamamlanmaTarihi: Date.now(),
    });

    // Award points to dog
    await puanEkle(kopekId, gorev.puan);

    console.log(`🎉 Görev tamamlandı! ${gorev.baslik} (+${gorev.puan} puan)`);
    return { tamamlandi: true, puan: gorev.puan };
  }

  return { tamamlandi: false, puan: 0 };
}

// Add points to a dog
export async function puanEkle(kopekId: number, puan: number): Promise<void> {
  const kopek = await db.kopekler.get(kopekId);
  if (!kopek) return;

  const mevcutPuan = kopek.puan ?? 0;
  await db.kopekler.update(kopekId, {
    puan: mevcutPuan + puan,
  });

  console.log(`✨ ${puan} puan eklendi! Toplam: ${mevcutPuan + puan}`);
}

// Calculate total walking distance for current week
export async function haftalikYuruyusMesafesiHesapla(kopekId: number): Promise<number> {
  const haftaBasi = new Date();
  haftaBasi.setDate(haftaBasi.getDate() - haftaBasi.getDay()); // Sunday
  haftaBasi.setHours(0, 0, 0, 0);

  const yuruyusler = await db.yuruyusKayitlari
    .where("kopekId")
    .equals(kopekId)
    .and((y) => y.baslamaTarihi >= haftaBasi.getTime() && y.tamamlandi && y.sure != null)
    .toArray();

  // Calculate total distance (assuming average speed of 5 km/h)
  let toplamMesafe = 0;
  for (const yuruyus of yuruyusler) {
    if (yuruyus.sure) {
      // sure is in seconds, convert to hours then to meters (5000 m/h = 1.39 m/s)
      const mesafe = (yuruyus.sure / 3600) * 5000;
      toplamMesafe += mesafe;
    }
  }

  return Math.round(toplamMesafe);
}

// Auto-update all active walking missions with current week's distance
export async function yuruyusGorevleriniGuncelle(kopekId: number): Promise<void> {
  const haftalikMesafe = await haftalikYuruyusMesafesiHesapla(kopekId);

  const aktifYuruyusGorevleri = (await aktifGorevleriGetir(kopekId)).filter(
    (g) => {
      const gorev = gorevGetir(g.gorevId);
      return gorev?.tur === "yuruyus_mesafe";
    }
  );

  for (const kullaniciGorev of aktifYuruyusGorevleri) {
    await gorevIlerlemesiGuncelle(kopekId, kullaniciGorev.gorevId, haftalikMesafe);
  }
}

// Get available missions (not started yet)
export async function musaitGorevleriGetir(kopekId: number): Promise<Gorev[]> {
  const aktifGorevler = await aktifGorevleriGetir(kopekId);
  const tamamlanmisGorevler = await tamamlanmisGorevleriGetir(kopekId);

  const aktifGorevIdler = new Set(aktifGorevler.map((g) => g.gorevId));
  const tamamlanmisGorevIdler = new Set(tamamlanmisGorevler.map((g) => g.gorevId));

  return GOREVLER.filter(
    (g) => !aktifGorevIdler.has(g.id) && !tamamlanmisGorevIdler.has(g.id)
  );
}

// Automatically start all missions every Monday at 00:00
export async function otomatikGorevleriBaslat(kopekId: number): Promise<void> {
  const kullaniciId = kullaniciIdGetir();

  // Calculate Monday 00:00 of current week
  const haftaBasi = new Date();
  const dayOfWeek = haftaBasi.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days
  haftaBasi.setDate(haftaBasi.getDate() + daysToMonday);
  haftaBasi.setHours(0, 0, 0, 0);

  // Check and start each mission for this week
  for (const gorev of GOREVLER) {
    // Check if this mission is already started for this week
    const mevcutGorev = await db.kullaniciGorevler
      .where("kullaniciId")
      .equals(kullaniciId)
      .and(
        (g) =>
          g.kopekId === kopekId &&
          g.gorevId === gorev.id &&
          g.baslangicTarihi >= haftaBasi.getTime() &&
          !g.tamamlandi
      )
      .first();

    // If not started this week, start it now
    if (!mevcutGorev) {
      const baslangic = Date.now();
      const bitis = baslangic + gorev.sure * 24 * 60 * 60 * 1000;

      await db.kullaniciGorevler.add({
        kullaniciId,
        kopekId,
        gorevId: gorev.id,
        baslangicTarihi: baslangic,
        bitisTarihi: bitis,
        ilerleme: 0,
        tamamlandi: false,
        odul: gorev.puan,
      });

      console.log(`✅ Görev otomatik başlatıldı: ${gorev.baslik}`);
    }
  }
}
