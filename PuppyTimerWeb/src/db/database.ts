// =============================================================================
// PawLand - IndexedDB Veritabani (Dexie.js)
// SwiftData modellerinin IndexedDB karsiligi
// =============================================================================

import Dexie, { type Table } from "dexie";
import type {
  Kopek,
  BeslenmeProgrami,
  BeslenmeKaydi,
  SuProgrami,
  SuKaydi,
  YuruyusProgrami,
  YuruyusKaydi,
  TuvaletKaydi,
  AsiKaydi,
  VeterinerZiyareti,
  IlacTakibi,
  SaglikNotu,
  HaritaIsaretci,
  TakvimFoto,
  AsiTekrari,
  KiloKaydi,
  KullaniciBegeni,
  KullaniciYorum,
  KullaniciKopekBegeni,
  KullaniciKopekYorum,
  KullaniciArkadas,
  KullaniciGorev,
  Veteriner,
  BakimKaydi,
  EgitimKaydi,
  Basari,
  Foto,
  Gider,
  Randevu,
} from "../types/models";

// -----------------------------------------------------------------------------
// Veritabani sinifi
// -----------------------------------------------------------------------------
class PawLandDB extends Dexie {
  kopekler!: Table<Kopek, number>;
  beslenmeProgramlari!: Table<BeslenmeProgrami, number>;
  beslenmeKayitlari!: Table<BeslenmeKaydi, number>;
  suProgramlari!: Table<SuProgrami, number>;
  suKayitlari!: Table<SuKaydi, number>;
  yuruyusProgramlari!: Table<YuruyusProgrami, number>;
  yuruyusKayitlari!: Table<YuruyusKaydi, number>;
  tuvaletKayitlari!: Table<TuvaletKaydi, number>;
  asiKayitlari!: Table<AsiKaydi, number>;
  veterinerZiyaretleri!: Table<VeterinerZiyareti, number>;
  ilacTakipleri!: Table<IlacTakibi, number>;
  saglikNotlari!: Table<SaglikNotu, number>;
  haritaIsaretcileri!: Table<HaritaIsaretci, number>;
  takvimFotolari!: Table<TakvimFoto, number>;
  asiTekrarlari!: Table<AsiTekrari, number>;
  kiloKayitlari!: Table<KiloKaydi, number>;
  kullaniciBegenleri!: Table<KullaniciBegeni, number>;
  kullaniciYorumlari!: Table<KullaniciYorum, number>;
  kullaniciKopekBegenleri!: Table<KullaniciKopekBegeni, number>;
  kullaniciKopekYorumlari!: Table<KullaniciKopekYorum, number>;
  kullaniciArkadaslar!: Table<KullaniciArkadas, number>;
  kullaniciGorevler!: Table<KullaniciGorev, number>;
  veterinerler!: Table<Veteriner, number>;
  bakimKayitlari!: Table<BakimKaydi, number>;
  egitimKayitlari!: Table<EgitimKaydi, number>;
  basarilar!: Table<Basari, number>;
  fotolar!: Table<Foto, number>;
  giderler!: Table<Gider, number>;
  randevular!: Table<Randevu, number>;

  constructor() {
    super("PawLandDB");

    this.version(1).stores({
      kopekler: "++id, ad, olusturmaTarihi",
      beslenmeProgramlari: "++id, kopekId, aktif",
      beslenmeKayitlari: "++id, kopekId, tarih, tur",
      suProgramlari: "++id, kopekId, aktif",
      suKayitlari: "++id, kopekId, tarih",
      yuruyusProgramlari: "++id, kopekId, aktif",
      yuruyusKayitlari: "++id, kopekId, baslamaTarihi, tamamlandi",
      tuvaletKayitlari: "++id, kopekId, tarih, tur, uyariVar",
      asiKayitlari: "++id, kopekId, tarih, sonrakiTarih",
      veterinerZiyaretleri: "++id, kopekId, tarih",
      ilacTakipleri: "++id, kopekId, aktif",
      saglikNotlari: "++id, kopekId, tarih, kategori",
      haritaIsaretcileri: "++id, kopekId, tur, tarih",
    });

    // Version 2: Topluluk begeni tablosu
    this.version(2).stores({
      kullaniciBegenleri: "++id, bolgeId, tarih",
    });

    // Version 3: Takvim fotolari + Asi tekrarlari
    this.version(3).stores({
      takvimFotolari: "++id, kopekId, yil, ay",
      asiTekrarlari: "++id, kopekId, sonrakiTarih, aktif",
    });

    // Version 4: Kilo takibi
    this.version(4).stores({
      kiloKayitlari: "++id, kopekId, tarih",
    });

    // Version 5: Bolge yorumlari
    this.version(5).stores({
      kullaniciYorumlari: "++id, yorumId, bolgeId, tarih",
    });

    // Version 6: Kopek sosyal ozellikleri (begeniler + yorumlar)
    this.version(6).stores({
      kullaniciKopekBegenleri: "++id, kopekId, tarih",
      kullaniciKopekYorumlari: "++id, yorumId, kopekId, tarih",
    });

    // Version 7: Arkadas sistemi
    this.version(7).stores({
      kullaniciArkadaslar: "++id, arkadasId, karsiTarafId, kopekId, tarih",
    });

    // Version 8: Gorev sistemi
    this.version(8).stores({
      kullaniciGorevler: "++id, kullaniciId, kopekId, gorevId, tamamlandi, bitisTarihi",
    });

    // Version 9: Veteriner listesi
    this.version(9).stores({
      veterinerler: "++id, ad, klinikAdi, olusturmaTarihi",
    });

    // Version 10: Bakim, Egitim ve Basari sistemleri
    this.version(10).stores({
      bakimKayitlari: "++id, kopekId, tarih, bakimTuru, sonrakiTarih",
      egitimKayitlari: "++id, kopekId, komut, seviye, tarih",
      basarilar: "++id, kullaniciId, kopekId, basariTuru, kazanilmaTarihi",
    });

    // Version 11: Foto galerisi ve gider takibi
    this.version(11).stores({
      fotolar: "++id, kopekId, tarih, kategori",
      giderler: "++id, kopekId, tarih, kategori",
    });

    // Version 12: Randevu takvimi
    this.version(12).stores({
      randevular: "++id, kopekId, tarih, tur, tamamlandi",
    });
  }
}

// -----------------------------------------------------------------------------
// Singleton veritabani instance'i
// -----------------------------------------------------------------------------
export const db = new PawLandDB();

// -----------------------------------------------------------------------------
// Cascade Delete - Bir kopek silindiginde tum iliskili kayitlari da siler
// SwiftData'daki @Relationship(deleteRule: .cascade) karsiligi
// -----------------------------------------------------------------------------
export async function cascadeDeleteKopek(kopekId: number): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.beslenmeProgramlari,
      db.beslenmeKayitlari,
      db.suProgramlari,
      db.suKayitlari,
      db.yuruyusProgramlari,
      db.yuruyusKayitlari,
      db.tuvaletKayitlari,
      db.asiKayitlari,
      db.veterinerZiyaretleri,
      db.ilacTakipleri,
      db.saglikNotlari,
      db.haritaIsaretcileri,
      db.takvimFotolari,
      db.asiTekrarlari,
      db.kiloKayitlari,
      db.bakimKayitlari,
      db.egitimKayitlari,
      db.basarilar,
      db.fotolar,
      db.giderler,
      db.randevular,
      db.kopekler,
    ],
    async () => {
      // Once tum cocuk tablolardan kopekId'ye gore sil
      await db.beslenmeProgramlari.where("kopekId").equals(kopekId).delete();
      await db.beslenmeKayitlari.where("kopekId").equals(kopekId).delete();
      await db.suProgramlari.where("kopekId").equals(kopekId).delete();
      await db.suKayitlari.where("kopekId").equals(kopekId).delete();
      await db.yuruyusProgramlari.where("kopekId").equals(kopekId).delete();
      await db.yuruyusKayitlari.where("kopekId").equals(kopekId).delete();
      await db.tuvaletKayitlari.where("kopekId").equals(kopekId).delete();
      await db.asiKayitlari.where("kopekId").equals(kopekId).delete();
      await db.veterinerZiyaretleri.where("kopekId").equals(kopekId).delete();
      await db.ilacTakipleri.where("kopekId").equals(kopekId).delete();
      await db.saglikNotlari.where("kopekId").equals(kopekId).delete();
      await db.haritaIsaretcileri.where("kopekId").equals(kopekId).delete();
      await db.takvimFotolari.where("kopekId").equals(kopekId).delete();
      await db.asiTekrarlari.where("kopekId").equals(kopekId).delete();
      await db.kiloKayitlari.where("kopekId").equals(kopekId).delete();
      await db.bakimKayitlari.where("kopekId").equals(kopekId).delete();
      await db.egitimKayitlari.where("kopekId").equals(kopekId).delete();
      await db.basarilar.where("kopekId").equals(kopekId).delete();
      await db.fotolar.where("kopekId").equals(kopekId).delete();
      await db.giderler.where("kopekId").equals(kopekId).delete();
      await db.randevular.where("kopekId").equals(kopekId).delete();

      // En son kopegi sil
      await db.kopekler.delete(kopekId);
    }
  );
}

// =============================================================================
// CACHE MANAGEMENT - Storage Optimization & Auto-cleanup
// =============================================================================

/**
 * Get current storage usage statistics
 * Returns used space, total quota, and percentage
 */
export async function getStorageStats(): Promise<{
  used: number;
  quota: number;
  percentage: number;
  formatUsed: string;
  formatQuota: string;
}> {
  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 50 * 1024 * 1024; // Default 50MB

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return {
      used,
      quota,
      percentage: (used / quota) * 100,
      formatUsed: formatBytes(used),
      formatQuota: formatBytes(quota),
    };
  } catch (error) {
    console.error("Storage estimate failed:", error);
    return {
      used: 0,
      quota: 50 * 1024 * 1024,
      percentage: 0,
      formatUsed: "Unknown",
      formatQuota: "50 MB",
    };
  }
}

/**
 * Delete old records (older than 30 days) - Auto cleanup
 * Helps prevent QuotaExceededError
 */
export async function cleanupOldData(): Promise<{
  deleted: number;
  freed: number;
}> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    await db.transaction(
      "rw",
      [
        db.tuvaletKayitlari,
        db.yuruyusKayitlari,
        db.beslenmeKayitlari,
        db.suKayitlari,
        db.fotolar,
      ],
      async () => {
        // Delete old toilet logs
        deletedCount += await db.tuvaletKayitlari
          .where("tarih")
          .below(thirtyDaysAgo)
          .delete();

        // Delete old walk logs
        deletedCount += await db.yuruyusKayitlari
          .where("baslamaTarihi")
          .below(thirtyDaysAgo)
          .delete();

        // Delete old feeding logs
        deletedCount += await db.beslenmeKayitlari
          .where("tarih")
          .below(thirtyDaysAgo)
          .delete();

        // Delete old water logs
        deletedCount += await db.suKayitlari
          .where("tarih")
          .below(thirtyDaysAgo)
          .delete();

        // Delete old photos (older than 60 days)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        deletedCount += await db.fotolar
          .where("tarih")
          .below(sixtyDaysAgo)
          .delete();
      }
    );

    const beforeStats = await getStorageStats();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for cleanup
    const afterStats = await getStorageStats();

    return {
      deleted: deletedCount,
      freed: beforeStats.used - afterStats.used,
    };
  } catch (error) {
    console.error("Cleanup failed:", error);
    return { deleted: 0, freed: 0 };
  }
}

/**
 * Clear entire IndexedDB database
 * User calls when "Clear Cache" button is pressed
 * Fresh sync will repopulate from Firestore
 */
export async function clearAllData(): Promise<boolean> {
  try {
    await db.delete();
    await db.open();
    console.log("✅ All data cleared from IndexedDB");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear data:", error);
    return false;
  }
}

/**
 * Monitor storage and auto-cleanup when approaching quota
 * Call periodically (e.g., when app comes to foreground)
 */
export async function monitorAndCleanup(): Promise<void> {
  try {
    const stats = await getStorageStats();

    // Auto-cleanup at 70% storage
    if (stats.percentage > 70) {
      console.warn(`⚠️ Storage at ${stats.percentage.toFixed(1)}% - Running cleanup...`);
      const result = await cleanupOldData();
      console.log(`🧹 Cleaned ${result.deleted} records, freed ${(result.freed / 1024 / 1024).toFixed(2)}MB`);
    }

    // Alert at 85% storage
    if (stats.percentage > 85) {
      console.warn(
        `⚠️ Storage almost full (${stats.percentage.toFixed(1)}%)! User should clear cache.`
      );
    }

    // Emergency cleanup at 95% storage
    if (stats.percentage > 95) {
      console.error(
        `🚨 Storage critical (${stats.percentage.toFixed(1)}%)! Emergency cleanup...`
      );
      await cleanupOldData();
    }
  } catch (error) {
    console.error("Monitor failed:", error);
  }
}

/**
 * Initialize storage monitoring on app load
 */
export function initializeStorageMonitoring(): void {
  // Check storage on app load
  monitorAndCleanup();

  // Check when app comes back to foreground (iOS/mobile)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      monitorAndCleanup();
    }
  });
}
