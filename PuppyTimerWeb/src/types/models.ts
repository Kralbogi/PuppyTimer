// =============================================================================
// PuppyTimer Web - Veri Modelleri
// SwiftData modellerinin TypeScript portlari
// Tarihler IndexedDB'de number (timestamp) olarak saklanir.
// Foto verileri base64 string olarak saklanir.
// =============================================================================

import type {
  Cinsiyet,
  TuvaletTuru,
  DiskilamaSekli,
  DiskilamaMiktar,
  DiskiRenk,
  DiskiKivam,
  IdrarRenk,
  IsaretciTuru,
  SaglikKategorisi,
  BeslenmeTuru,
  BolgeTuru,
  AsiTekrarAraligi,
  CerceveTipi,
  MesajRengi,
} from "./enums";

// -----------------------------------------------------------------------------
// 1. Kopek (Ana entity - diger tum kayitlarin sahibi)
// -----------------------------------------------------------------------------
export interface Kopek {
  id?: number;
  ad: string;
  irk: string;
  dogumTarihi?: number;
  agirlik?: number;
  cinsiyet: Cinsiyet;
  kisir?: boolean; // Kisir/sterilize durumu
  fotoData?: string;
  avatarData?: string;
  irkTanimi?: string;
  renkTanimi?: string;
  kisilikEtiketleri?: string[];
  renkler?: { primary: string; secondary: string; belly: string }; // 3D avatar renkleri
  aksesuarlar?: string[]; // Premium feature: ["hat", "collar", "glasses", "bandana", "bow"]
  cerceveTipi?: CerceveTipi; // Premium feature: Harita marker çerçeve türü
  mesajRengi?: MesajRengi; // Premium feature: Topluluk chat mesaj rengi
  puan?: number; // Gamification: Points earned from completing missions
  olusturmaTarihi: number;
  toplamBegeniler?: number; // Topluluk haritasinda toplam begeni sayisi
}

// -----------------------------------------------------------------------------
// 2. BeslenmeProgrami
// -----------------------------------------------------------------------------
export interface BeslenmeProgrami {
  id?: number;
  kopekId: number;
  baslik: string;
  saatAraligi: number;
  sonBeslenme?: number;
  birSonrakiBeslenme?: number;
  aktif: boolean;
  mamaMarkasi?: string;
  miktar?: string;
}

// -----------------------------------------------------------------------------
// 3. BeslenmeKaydi
// -----------------------------------------------------------------------------
export interface BeslenmeKaydi {
  id?: number;
  kopekId: number;
  tarih: number;
  tur: BeslenmeTuru;
  miktar?: string;
  not?: string;
}

// -----------------------------------------------------------------------------
// 4. SuProgrami
// -----------------------------------------------------------------------------
export interface SuProgrami {
  id?: number;
  kopekId: number;
  saatAraligi: number;
  sonSuVerme?: number;
  birSonrakiSuVerme?: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 5. SuKaydi
// -----------------------------------------------------------------------------
export interface SuKaydi {
  id?: number;
  kopekId: number;
  tarih: number;
  not?: string;
}

// -----------------------------------------------------------------------------
// 6. YuruyusProgrami
// -----------------------------------------------------------------------------
export interface YuruyusProgrami {
  id?: number;
  kopekId: number;
  baslik: string;
  saat: number;
  gunler: number[];
  sure: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 7. YuruyusKaydi
// -----------------------------------------------------------------------------
export interface YuruyusKaydi {
  id?: number;
  kopekId: number;
  baslamaTarihi: number;
  bitisTarihi?: number;
  sure?: number;
  tamamlandi: boolean;
  not?: string;
}

// -----------------------------------------------------------------------------
// 8. TuvaletKaydi
// -----------------------------------------------------------------------------
export interface TuvaletKaydi {
  id?: number;
  kopekId: number;
  tarih: number;
  tur: TuvaletTuru;

  // Buyuk tuvalet alanlari
  sekil?: DiskilamaSekli;
  miktar?: DiskilamaMiktar;
  diskiRenk?: DiskiRenk;
  kivam?: DiskiKivam;

  // Kucuk tuvalet alanlari
  idrarRenk?: IdrarRenk;
  idrarMiktar?: DiskilamaMiktar;

  // Ortak alanlar
  not?: string;
  fotoData?: string;
  enlem?: number;
  boylam?: number;

  // Yapay zeka analizi
  yapayZekaAnalizi?: string;
  uyariVar: boolean;
}

// -----------------------------------------------------------------------------
// 9. AsiKaydi
// -----------------------------------------------------------------------------
export interface AsiKaydi {
  id?: number;
  kopekId: number;
  asiAdi: string;
  tarih: number;
  sonrakiTarih?: number;
  veterinerAdi?: string;
  veterinerId?: number; // Reference to Veteriner
  not?: string;
}

// -----------------------------------------------------------------------------
// Veteriner (Veteriner clinics/doctors)
// -----------------------------------------------------------------------------
export interface Veteriner {
  id?: number;
  ad: string;
  klinikAdi?: string;
  telefon?: string;
  adres?: string;
  eposta?: string;
  not?: string;
  olusturmaTarihi: number;
}

// -----------------------------------------------------------------------------
// 10. VeterinerZiyareti
// -----------------------------------------------------------------------------
export interface VeterinerZiyareti {
  id?: number;
  kopekId: number;
  tarih: number;
  neden: string;
  teshis?: string;
  tedavi?: string;
  veterinerAdi?: string;
  veterinerTelefon?: string;
  veterinerEposta?: string;
  klinikAdi?: string;
  klinikAdresi?: string;
  maliyet?: number;
  not?: string;
}

// -----------------------------------------------------------------------------
// 11. IlacTakibi
// -----------------------------------------------------------------------------
export interface IlacTakibi {
  id?: number;
  kopekId: number;
  ilacAdi: string;
  doz: string;
  baslangicTarihi: number;
  bitisTarihi?: number;
  saatAraligi: number;
  sonDoz?: number;
  birSonrakiDoz?: number;
  aktif: boolean;
  not?: string;
}

// -----------------------------------------------------------------------------
// 12. SaglikNotu
// -----------------------------------------------------------------------------
export interface SaglikNotu {
  id?: number;
  kopekId: number;
  baslik: string;
  icerik: string;
  tarih: number;
  kategori: SaglikKategorisi;
}

// -----------------------------------------------------------------------------
// 13. HaritaIsaretci
// -----------------------------------------------------------------------------
export interface HaritaIsaretci {
  id?: number;
  kopekId: number;
  baslik: string;
  not?: string;
  enlem: number;
  boylam: number;
  tur: IsaretciTuru;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 14. TakvimFoto (Aylik foto takvim)
// -----------------------------------------------------------------------------
export interface TakvimFoto {
  id?: number;
  kopekId: number;
  yil: number;
  ay: number; // 0-11
  fotoData: string;
  aciklama?: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 15. AsiTekrari (Tekrarlanan asi zamanlayicisi)
// -----------------------------------------------------------------------------
export interface AsiTekrari {
  id?: number;
  kopekId: number;
  asiAdi: string;
  tekrarAraligi: AsiTekrarAraligi;
  sonUygulamaTarihi: number;
  sonrakiTarih: number;
  veterinerAdi?: string;
  not?: string;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 16. KiloKaydi (Kilo takibi)
// -----------------------------------------------------------------------------
export interface KiloKaydi {
  id?: number;
  kopekId: number;
  agirlik: number;
  tarih: number;
  not?: string;
}

// -----------------------------------------------------------------------------
// 17. ToplulukBolge (Topluluk haritasi - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface ToplulukBolge {
  id: string;
  olusturanId: string;
  olusturanAd: string;
  baslik: string;
  aciklama?: string;
  enlem: number;
  boylam: number;
  yaricap: number;
  tur: BolgeTuru;
  olusturmaTarihi: number;
  guncellemeTarihi: number;
  aktif: boolean;
  begeniler: number;
  canli: boolean;
}

// -----------------------------------------------------------------------------
// 15. KullaniciBegeni (Yerel - cift begeni engeli)
// -----------------------------------------------------------------------------
export interface KullaniciBegeni {
  id?: number;
  bolgeId: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 19. BolgeYorum (Topluluk bolgesi yorumlari - Firebase Firestore subcollection)
// -----------------------------------------------------------------------------
export interface BolgeYorum {
  id: string;
  bolgeId: string;
  olusturanId: string;
  olusturanAd: string;
  icerik: string;
  olusturmaTarihi: number;
  guncellemeTarihi: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 20. KullaniciYorum (Yerel - kullanici yorum takibi)
// -----------------------------------------------------------------------------
export interface KullaniciYorum {
  id?: number;
  yorumId: string;
  bolgeId: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 18. ToplulukKopek (Topluluk haritasi - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface ToplulukKopek {
  id: string;
  olusturanId: string;
  olusturanAd: string;
  kopekAd: string;
  irk: string;
  cinsiyet: Cinsiyet;
  dogumTarihi?: number;
  agirlik?: number;
  kisir: boolean;
  thumbnailData?: string;
  renkler?: { primary: string; secondary: string; belly: string }; // 3D avatar renkleri
  aksesuarlar?: string[]; // 3D avatar aksesuarları (hat, collar, glasses, bandana, bow, scarf)
  cerceveTipi?: CerceveTipi; // Premium feature: Harita marker çerçeve türü
  mesajRengi?: MesajRengi; // Premium feature: Topluluk chat mesaj rengi
  enlem: number;
  boylam: number;
  olusturmaTarihi: number;
  guncellemeTarihi: number;
  aktif: boolean;
  begeniler: number; // Mevcut oturum begenileri
  toplamBegeniler: number; // Tum zamanlarin toplam begenileri
}

// -----------------------------------------------------------------------------
// 21. KopekYorum (Topluluk kopek yorumlari - Firebase Firestore subcollection)
// -----------------------------------------------------------------------------
export interface KopekYorum {
  id: string;
  kopekId: string;
  olusturanId: string;
  olusturanAd: string;
  icerik: string;
  olusturmaTarihi: number;
  guncellemeTarihi: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 22. KullaniciKopekBegeni (Yerel - kullanici kopek begeni takibi)
// -----------------------------------------------------------------------------
export interface KullaniciKopekBegeni {
  id?: number;
  kopekId: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 23. KullaniciKopekYorum (Yerel - kullanici kopek yorum takibi)
// -----------------------------------------------------------------------------
export interface KullaniciKopekYorum {
  id?: number;
  yorumId: string;
  kopekId: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 24. KopekArkadas (Arkadas sistemi - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface KopekArkadas {
  id: string;
  gonderenId: string; // Arkadaşlık isteği gönderen
  gonderenAd: string;
  aliciId: string; // Arkadaşlık isteği alan
  aliciAd: string;
  kopekId: string; // İlgili köpek ID
  kopekAd: string;
  durum: "beklemede" | "kabul" | "red"; // İstek durumu
  olusturmaTarihi: number;
  guncellemeTarihi: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 25. KullaniciOnlineDurum (Kullanıcı online durumu - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface KullaniciOnlineDurum {
  id: string; // userId
  online: boolean;
  sonAktivite: number;
}

// -----------------------------------------------------------------------------
// 26. KullaniciArkadas (Yerel - kullanici arkadas takibi)
// -----------------------------------------------------------------------------
export interface KullaniciArkadas {
  id?: number;
  arkadasId: string; // Firestore arkadas belgesi ID
  karsiTarafId: string; // Diger kullanicinin ID
  kopekId: string;
  kopekAd: string;
  tarih: number;
}

// -----------------------------------------------------------------------------
// 27. MesajKonusma (Private messaging conversation - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface MesajKonusma {
  id: string; // konusmaId (sorted user IDs: userId1_userId2)
  katilimcilar: string[]; // [userId1, userId2]
  sonMesaj: string;
  sonMesajTarihi: number;
  sonMesajGonderenId?: string; // Who sent the last message
  okunmayanSayisi: { [userId: string]: number };
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 28. OzelMesaj (Private message - Firebase Firestore subcollection)
// -----------------------------------------------------------------------------
export interface OzelMesaj {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  icerik: string;
  olusturmaTarihi: number;
  okundu: boolean;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 29. Sikayet (User report - Firebase Firestore)
// -----------------------------------------------------------------------------
export type SikayetKategorisi = "hakaret" | "spam" | "uygunsuz_gorsel" | "rahatsizlik";

export interface Sikayet {
  id?: string;
  sikayetEdenId: string; // Reporter user ID
  sikayetEdenAd: string; // Reporter name
  sikayetEdilenId: string; // Reported user ID
  sikayetEdilenKopekId: string; // Reported dog ID
  kategori: SikayetKategorisi;
  aciklama?: string; // Optional description
  olusturmaTarihi: number;
  durum: "beklemede" | "islendi"; // Status
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 30. KullaniciCeza (User penalties - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface KullaniciCeza {
  id: string; // User ID
  hakaretSayisi: number; // Harassment count
  spamSayisi: number; // Spam count
  uygunsuzGorselSayisi: number; // Inappropriate image count
  rahatsizlikSayisi: number; // Disturbing content count
  toplamSikayetSayisi: number; // Total report count
  sohbetEngelli: boolean; // Chat banned (10+ harassment reports)
  toplulukEngelli: boolean; // Community banned (25+ total reports)
  fotografKaldirildi: boolean; // Photo removed (10+ inappropriate image reports)
  sonGuncellemeTarihi: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 31. Urun (Shop product - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface Urun {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  stok: number;
  kategori: string;
  resimUrl?: string; // Base64 encoded image
  ortalamaPuan: number; // 0-5
  toplamYorumSayisi: number;
  aktif: boolean;
  olusturmaTarihi: number;
  guncellemeTarihi: number;
}

// -----------------------------------------------------------------------------
// 32. UrunYorum (Product review - Firebase Firestore subcollection)
// -----------------------------------------------------------------------------
export interface UrunYorum {
  id: string;
  urunId: string;
  kullaniciId: string;
  kullaniciAd: string;
  puan: number; // 1-5
  yorum?: string;
  olusturmaTarihi: number;
}

// -----------------------------------------------------------------------------
// 33. SepetItem (Cart item - React Context + localStorage)
// -----------------------------------------------------------------------------
export interface SepetItem {
  urunId: string;
  ad: string;
  adet: number;
  birimFiyat: number;
  resimUrl?: string;
}

// -----------------------------------------------------------------------------
// 34. Siparis (Order - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface Siparis {
  id: string;
  kullaniciId: string;
  kullaniciAd: string;
  urunler: SepetItem[];
  toplamFiyat: number;
  durum: "beklemede" | "onaylandi" | "hazirlaniyor" | "kargoda" | "teslim_edildi";
  olusturmaTarihi: number;
  teslimatAdresi?: string;
}

// -----------------------------------------------------------------------------
// 35. ToplulukMesaj (Community chat message - Firebase Firestore)
// -----------------------------------------------------------------------------
export interface ToplulukMesaj {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  icerik: string;
  olusturmaTarihi: number;
  aktif: boolean;
  mesajRengi?: MesajRengi; // Premium feature: Mesaj rengi
}

// -----------------------------------------------------------------------------
// 36. RateLimitData (Rate limiting data - localStorage)
// -----------------------------------------------------------------------------
export interface RateLimitData {
  mesajZamanlari: number[]; // Timestamp array (max 5 messages)
  sonKontrol: number; // Last check timestamp
}

// -----------------------------------------------------------------------------
// 37. HakaretAyarlari (Profanity filter settings - Firestore)
// -----------------------------------------------------------------------------
export interface HakaretAyarlari {
  kelimeler: string[]; // List of banned words
  guncellemeTarihi: number; // Last update timestamp
  guncelleyen: string; // Admin who updated
}

// -----------------------------------------------------------------------------
// 38. KullaniciPremium (Premium user status - Firestore)
// -----------------------------------------------------------------------------
export interface KullaniciPremium {
  id: string; // userId
  premium: boolean;
  baslangicTarihi?: number; // Premium başlangıç tarihi
  bitisTarihi?: number; // Premium bitiş tarihi (null = sınırsız)
  odemeTuru?: "lifetime" | "monthly" | "yearly"; // Ödeme türü
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 39. RenkDegisiklikSayaci (Color change counter - localStorage)
// -----------------------------------------------------------------------------
export interface RenkDegisiklikSayaci {
  kopekId: number;
  degisiklikSayisi: number; // Free users: max 2
  sonDegisiklik: number; // Timestamp
}

// -----------------------------------------------------------------------------
// 40. Gorev (Mission definitions - predefined in code)
// -----------------------------------------------------------------------------
export type GorevTuru = "yuruyus_mesafe" | "harita_isaretci" | "topluluk_paylasim" | "arkadas_ekle" | "beslenme_sayi" | "su_sayi" | "tuvalet_sayi";
export type GorevZorluk = "kolay" | "orta" | "zor" | "efsane";

export interface Gorev {
  id: string; // unique identifier
  baslik: string;
  aciklama: string;
  tur: GorevTuru;
  zorluk: GorevZorluk;
  hedef: number; // Target value (e.g., 5000 for 5km)
  puan: number; // Points reward
  sure: number; // Duration in days (e.g., 7 for weekly)
  icon: string; // Emoji or icon identifier
}

// -----------------------------------------------------------------------------
// 41. KullaniciGorev (User mission progress - IndexedDB + Firestore)
// -----------------------------------------------------------------------------
export interface KullaniciGorev {
  id?: number; // IndexedDB auto-increment
  kullaniciId: string;
  kopekId: number;
  gorevId: string;
  baslangicTarihi: number;
  bitisTarihi: number; // baslangicTarihi + sure
  ilerleme: number; // Current progress (e.g., 3000 for 3km)
  tamamlandi: boolean;
  tamamlanmaTarihi?: number;
  odul: number; // Points earned
}

// -----------------------------------------------------------------------------
// 42. BakimKaydi (Grooming/Care Record)
// -----------------------------------------------------------------------------
export type BakimTuru = "banyo" | "tirnak" | "tras" | "dis";

export interface BakimKaydi {
  id?: number;
  kopekId: number;
  bakimTuru: BakimTuru;
  tarih: number;
  sonrakiTarih?: number; // Next scheduled date
  not?: string;
  maliyet?: number; // Cost (optional)
  profesyonel: boolean; // Professional groomer vs home care
}

// -----------------------------------------------------------------------------
// 43. EgitimKaydi (Training Record)
// -----------------------------------------------------------------------------
export type EgitimSeviye = "ogreniyor" | "ilerliyor" | "ustalasti";

export interface EgitimKaydi {
  id?: number;
  kopekId: number;
  komut: string; // Command name (e.g., "sit", "stay", "fetch")
  seviye: EgitimSeviye;
  tarih: number;
  basariOrani?: number; // Success rate 0-100
  not?: string;
  sure?: number; // Training duration in minutes
}

// -----------------------------------------------------------------------------
// 44. Basari (Achievement/Badge)
// -----------------------------------------------------------------------------
export type BasariTuru =
  | "ilk_yuruyus"
  | "yuruyus_5"
  | "yuruyus_25"
  | "yuruyus_100"
  | "ilk_asi"
  | "ilk_bakim"
  | "bakim_10"
  | "ilk_egitim"
  | "komut_5"
  | "komut_ustalasti"
  | "arkadas_5"
  | "arkadas_25"
  | "puan_100"
  | "puan_500"
  | "puan_1000"
  | "topluluk_aktif"
  | "harita_kesen_10";

export interface Basari {
  id?: number;
  kullaniciId: string;
  kopekId: number;
  basariTuru: BasariTuru;
  baslik: string;
  aciklama: string;
  iconEmoji: string;
  kazanilmaTarihi: number;
  puan: number; // Points earned from this achievement
}

// -----------------------------------------------------------------------------
// 45. Foto (Bağımsız fotoğraf galerisi)
// -----------------------------------------------------------------------------
export type FotoKategori = "galeri" | "oyun" | "dogumgunu" | "dis_yuruyus" | "diger";

export interface Foto {
  id?: number;
  kopekId: number;
  fotoData: string; // base64
  tarih: number;
  kategori: FotoKategori;
  aciklama?: string;
}

// -----------------------------------------------------------------------------
// 46. Gider (Harcama takibi)
// -----------------------------------------------------------------------------
export type GiderKategori =
  | "veteriner"
  | "mama"
  | "bakim"
  | "ilac"
  | "oyuncak"
  | "aksesuar"
  | "sigorta"
  | "egitim"
  | "diger";

export interface Gider {
  id?: number;
  kopekId: number;
  tarih: number;
  kategori: GiderKategori;
  tutar: number;
  baslik: string;
  not?: string;
  faturali?: boolean;
}

// -----------------------------------------------------------------------------
// 47. Randevu (Veteriner / kuaför randevusu — IndexedDB)
// -----------------------------------------------------------------------------
export type RandevuTuru = "veteriner" | "kuafor" | "kontrol" | "diger";

export interface Randevu {
  id?: number;
  kopekId: number;
  tarih: number;       // Gün timestamp (gece yarısı)
  saat: string;        // "HH:MM"
  tur: RandevuTuru;
  baslik: string;
  not?: string;
  veterinerId?: number;
  tamamlandi: boolean;
  olusturmaTarihi: number;
}

// -----------------------------------------------------------------------------
// 48. KayipKopek (Kayıp köpek bildirimi — Firestore)
// -----------------------------------------------------------------------------
export interface KayipKopek {
  id: string;
  sahipId: string;
  sahipAd: string;
  kopekAd: string;
  irk?: string;
  aciklama: string;
  iletisim: string;      // Telefon veya sosyal medya
  thumbnailData?: string;
  enlem: number;
  boylam: number;
  olusturmaTarihi: number;
  aktif: boolean;
}

// -----------------------------------------------------------------------------
// 49. Hatirlatici (In-app reminder — localStorage ile saklanır)
// -----------------------------------------------------------------------------
export type HatirlaticiTuru =
  | "beslenme"
  | "yuruyus"
  | "ilac"
  | "asi"
  | "bakim"
  | "veteriner"
  | "diger";

export interface Hatirlatici {
  id: string; // UUID
  kopekId: number;
  baslik: string;
  tur: HatirlaticiTuru;
  saat: string; // "HH:MM"
  gunler: number[]; // 0=Pzt … 6=Paz
  aktif: boolean;
  olusturmaTarihi: number;
}
