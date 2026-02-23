// =============================================================================
// PuppyTimer Web - IndexedDB Veritabani (Dexie.js)
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
} from "../types/models";

// -----------------------------------------------------------------------------
// Veritabani sinifi
// -----------------------------------------------------------------------------
class PuppyTimerDB extends Dexie {
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

  constructor() {
    super("PuppyTimerDB");

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
  }
}

// -----------------------------------------------------------------------------
// Singleton veritabani instance'i
// -----------------------------------------------------------------------------
export const db = new PuppyTimerDB();

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

      // En son kopegi sil
      await db.kopekler.delete(kopekId);
    }
  );
}
