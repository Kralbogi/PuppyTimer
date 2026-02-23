// =============================================================================
// PuppyTimer Web - Enum Tanimlari
// Swift enumlarinin TypeScript portlari (Turkce UI)
// erasableSyntaxOnly uyumu icin const nesneler + union type kullanilir.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Cinsiyet
// -----------------------------------------------------------------------------
export const Cinsiyet = {
  Erkek: "Erkek",
  Disi: "Disi",
} as const;

export type Cinsiyet = (typeof Cinsiyet)[keyof typeof Cinsiyet];

export function cinsiyetBaslik(c: Cinsiyet): string {
  switch (c) {
    case Cinsiyet.Erkek:
      return "Erkek";
    case Cinsiyet.Disi:
      return "Dişi";
  }
}

export const cinsiyetListesi: Cinsiyet[] = [Cinsiyet.Erkek, Cinsiyet.Disi];

// -----------------------------------------------------------------------------
// 2. TuvaletTuru
// -----------------------------------------------------------------------------
export const TuvaletTuru = {
  Buyuk: "Buyuk Tuvalet",
  Kucuk: "Kucuk Tuvalet",
} as const;

export type TuvaletTuru = (typeof TuvaletTuru)[keyof typeof TuvaletTuru];

export function tuvaletTuruBaslik(t: TuvaletTuru): string {
  switch (t) {
    case TuvaletTuru.Buyuk:
      return "Büyük Tuvalet";
    case TuvaletTuru.Kucuk:
      return "Küçük Tuvalet";
  }
}

export const tuvaletTuruListesi: TuvaletTuru[] = [
  TuvaletTuru.Buyuk,
  TuvaletTuru.Kucuk,
];

// -----------------------------------------------------------------------------
// 3. DiskilamaSekli
// -----------------------------------------------------------------------------
export const DiskilamaSekli = {
  YuvarlakKucuk: "Yuvarlak Kucuk",
  Normal: "Normal",
  Sulu: "Sulu",
  Sert: "Sert",
} as const;

export type DiskilamaSekli =
  (typeof DiskilamaSekli)[keyof typeof DiskilamaSekli];

export function diskilamaSekliBaslik(s: DiskilamaSekli): string {
  switch (s) {
    case DiskilamaSekli.YuvarlakKucuk:
      return "Yuvarlak Küçük";
    case DiskilamaSekli.Normal:
      return "Normal";
    case DiskilamaSekli.Sulu:
      return "Sulu";
    case DiskilamaSekli.Sert:
      return "Sert";
  }
}

export function diskilamaSekliIkon(s: DiskilamaSekli): string {
  switch (s) {
    case DiskilamaSekli.YuvarlakKucuk:
      return "circle";
    case DiskilamaSekli.Normal:
      return "check-circle";
    case DiskilamaSekli.Sulu:
      return "droplets";
    case DiskilamaSekli.Sert:
      return "square";
  }
}

export const diskilamaSekliListesi: DiskilamaSekli[] = [
  DiskilamaSekli.YuvarlakKucuk,
  DiskilamaSekli.Normal,
  DiskilamaSekli.Sulu,
  DiskilamaSekli.Sert,
];

// -----------------------------------------------------------------------------
// 4. DiskilamaMiktar
// -----------------------------------------------------------------------------
export const DiskilamaMiktar = {
  Az: "Az",
  Normal: "Normal",
  Cok: "Cok",
} as const;

export type DiskilamaMiktar =
  (typeof DiskilamaMiktar)[keyof typeof DiskilamaMiktar];

export function diskilamaMiktarBaslik(m: DiskilamaMiktar): string {
  switch (m) {
    case DiskilamaMiktar.Az:
      return "Az";
    case DiskilamaMiktar.Normal:
      return "Normal";
    case DiskilamaMiktar.Cok:
      return "Çok";
  }
}

export const diskilamaMiktarListesi: DiskilamaMiktar[] = [
  DiskilamaMiktar.Az,
  DiskilamaMiktar.Normal,
  DiskilamaMiktar.Cok,
];

// -----------------------------------------------------------------------------
// 5. DiskiRenk
// -----------------------------------------------------------------------------
export const DiskiRenk = {
  Kahverengi: "Kahverengi",
  Koyu: "Koyu",
  Acik: "Acik",
  Yesil: "Yesil",
  Kirmizi: "Kirmizi",
  Siyah: "Siyah",
} as const;

export type DiskiRenk = (typeof DiskiRenk)[keyof typeof DiskiRenk];

export function diskiRenkBaslik(r: DiskiRenk): string {
  switch (r) {
    case DiskiRenk.Kahverengi:
      return "Kahverengi";
    case DiskiRenk.Koyu:
      return "Koyu";
    case DiskiRenk.Acik:
      return "Açık";
    case DiskiRenk.Yesil:
      return "Yeşil";
    case DiskiRenk.Kirmizi:
      return "Kırmızı";
    case DiskiRenk.Siyah:
      return "Siyah";
  }
}

export function diskiRenkUyariMi(r: DiskiRenk): boolean {
  return r === DiskiRenk.Kirmizi || r === DiskiRenk.Siyah;
}

export function diskiRenkRenk(r: DiskiRenk): string {
  switch (r) {
    case DiskiRenk.Kahverengi:
      return "brown";
    case DiskiRenk.Koyu:
      return "gray";
    case DiskiRenk.Acik:
      return "orange";
    case DiskiRenk.Yesil:
      return "green";
    case DiskiRenk.Kirmizi:
      return "red";
    case DiskiRenk.Siyah:
      return "black";
  }
}

export const diskiRenkListesi: DiskiRenk[] = [
  DiskiRenk.Kahverengi,
  DiskiRenk.Koyu,
  DiskiRenk.Acik,
  DiskiRenk.Yesil,
  DiskiRenk.Kirmizi,
  DiskiRenk.Siyah,
];

// -----------------------------------------------------------------------------
// 6. DiskiKivam
// -----------------------------------------------------------------------------
export const DiskiKivam = {
  Sert: "Sert",
  Normal: "Normal",
  Yumusak: "Yumusak",
  Sulu: "Sulu",
} as const;

export type DiskiKivam = (typeof DiskiKivam)[keyof typeof DiskiKivam];

export function diskiKivamBaslik(k: DiskiKivam): string {
  switch (k) {
    case DiskiKivam.Sert:
      return "Sert";
    case DiskiKivam.Normal:
      return "Normal";
    case DiskiKivam.Yumusak:
      return "Yumuşak";
    case DiskiKivam.Sulu:
      return "Sulu";
  }
}

export const diskiKivamListesi: DiskiKivam[] = [
  DiskiKivam.Sert,
  DiskiKivam.Normal,
  DiskiKivam.Yumusak,
  DiskiKivam.Sulu,
];

// -----------------------------------------------------------------------------
// 7. IdrarRenk
// -----------------------------------------------------------------------------
export const IdrarRenk = {
  Normal: "Normal",
  Koyu: "Koyu",
  Acik: "Acik",
  Kirmizi: "Kirmizi",
} as const;

export type IdrarRenk = (typeof IdrarRenk)[keyof typeof IdrarRenk];

export function idrarRenkBaslik(r: IdrarRenk): string {
  switch (r) {
    case IdrarRenk.Normal:
      return "Normal";
    case IdrarRenk.Koyu:
      return "Koyu";
    case IdrarRenk.Acik:
      return "Açık";
    case IdrarRenk.Kirmizi:
      return "Kırmızı";
  }
}

export function idrarRenkUyariMi(r: IdrarRenk): boolean {
  return r === IdrarRenk.Kirmizi;
}

export const idrarRenkListesi: IdrarRenk[] = [
  IdrarRenk.Normal,
  IdrarRenk.Koyu,
  IdrarRenk.Acik,
  IdrarRenk.Kirmizi,
];

// -----------------------------------------------------------------------------
// 8. IsaretciTuru
// -----------------------------------------------------------------------------
export const IsaretciTuru = {
  Yuruyus: "Yuruyus",
  BuyukTuvalet: "Buyuk Tuvalet",
  KucukTuvalet: "Kucuk Tuvalet",
  Favori: "Favori Yer",
  Diger: "Diger",
} as const;

export type IsaretciTuru = (typeof IsaretciTuru)[keyof typeof IsaretciTuru];

export function isaretciTuruBaslik(t: IsaretciTuru): string {
  switch (t) {
    case IsaretciTuru.Yuruyus:
      return "Yürüyüş";
    case IsaretciTuru.BuyukTuvalet:
      return "Büyük Tuvalet";
    case IsaretciTuru.KucukTuvalet:
      return "Küçük Tuvalet";
    case IsaretciTuru.Favori:
      return "Favori Yer";
    case IsaretciTuru.Diger:
      return "Diğer";
  }
}

export function isaretciTuruIkon(t: IsaretciTuru): string {
  switch (t) {
    case IsaretciTuru.Yuruyus:
      return "footprints";
    case IsaretciTuru.BuyukTuvalet:
      return "leaf";
    case IsaretciTuru.KucukTuvalet:
      return "droplet";
    case IsaretciTuru.Favori:
      return "star";
    case IsaretciTuru.Diger:
      return "map-pin";
  }
}

export function isaretciTuruRenk(t: IsaretciTuru): string {
  switch (t) {
    case IsaretciTuru.Yuruyus:
      return "green";
    case IsaretciTuru.BuyukTuvalet:
      return "brown";
    case IsaretciTuru.KucukTuvalet:
      return "yellow";
    case IsaretciTuru.Favori:
      return "orange";
    case IsaretciTuru.Diger:
      return "gray";
  }
}

export const isaretciTuruListesi: IsaretciTuru[] = [
  IsaretciTuru.Yuruyus,
  IsaretciTuru.BuyukTuvalet,
  IsaretciTuru.KucukTuvalet,
  IsaretciTuru.Favori,
  IsaretciTuru.Diger,
];

// -----------------------------------------------------------------------------
// 9. SaglikKategorisi
// -----------------------------------------------------------------------------
export const SaglikKategorisi = {
  Genel: "Genel",
  Allerji: "Alerji",
  Diyet: "Diyet",
  Davranis: "Davranis",
  Diger: "Diger",
} as const;

export type SaglikKategorisi =
  (typeof SaglikKategorisi)[keyof typeof SaglikKategorisi];

export function saglikKategorisiBaslik(k: SaglikKategorisi): string {
  switch (k) {
    case SaglikKategorisi.Genel:
      return "Genel";
    case SaglikKategorisi.Allerji:
      return "Alerji";
    case SaglikKategorisi.Diyet:
      return "Diyet";
    case SaglikKategorisi.Davranis:
      return "Davranış";
    case SaglikKategorisi.Diger:
      return "Diğer";
  }
}

export const saglikKategorisiListesi: SaglikKategorisi[] = [
  SaglikKategorisi.Genel,
  SaglikKategorisi.Allerji,
  SaglikKategorisi.Diyet,
  SaglikKategorisi.Davranis,
  SaglikKategorisi.Diger,
];

// -----------------------------------------------------------------------------
// 10. BeslenmeTuru
// -----------------------------------------------------------------------------
export const BeslenmeTuru = {
  Mama: "Mama",
  Su: "Su",
} as const;

export type BeslenmeTuru = (typeof BeslenmeTuru)[keyof typeof BeslenmeTuru];

export function beslenmeTuruBaslik(t: BeslenmeTuru): string {
  switch (t) {
    case BeslenmeTuru.Mama:
      return "Mama";
    case BeslenmeTuru.Su:
      return "Su";
  }
}

export const beslenmeTuruListesi: BeslenmeTuru[] = [
  BeslenmeTuru.Mama,
  BeslenmeTuru.Su,
];

// -----------------------------------------------------------------------------
// 11. BolgeTuru (Topluluk harita bolge turleri)
// -----------------------------------------------------------------------------
export const BolgeTuru = {
  Tehlikeli: "Tehlikeli",
  Sosyal: "Sosyal",
} as const;

export type BolgeTuru = (typeof BolgeTuru)[keyof typeof BolgeTuru];

export function bolgeTuruBaslik(t: BolgeTuru): string {
  switch (t) {
    case BolgeTuru.Tehlikeli:
      return "Tehlikeli Bölge";
    case BolgeTuru.Sosyal:
      return "Sosyal Bölge";
  }
}

export function bolgeTuruRenk(t: BolgeTuru): string {
  switch (t) {
    case BolgeTuru.Tehlikeli:
      return "#ef4444";
    case BolgeTuru.Sosyal:
      return "#22c55e";
  }
}

export const bolgeTuruListesi: BolgeTuru[] = [
  BolgeTuru.Tehlikeli,
  BolgeTuru.Sosyal,
];

// -----------------------------------------------------------------------------
// 12. KisilikEtiketi (Kopek kisilik ozellikleri)
// -----------------------------------------------------------------------------
export const KisilikEtiketi = {
  Hircin: "Hircin",
  Kisir: "Kisir",
  Oyunsever: "Oyunsever",
  Sakin: "Sakin",
  Enerjik: "Enerjik",
  Korkak: "Korkak",
  Korumaci: "Korumaci",
  Sosyal: "Sosyal",
} as const;

export type KisilikEtiketi =
  (typeof KisilikEtiketi)[keyof typeof KisilikEtiketi];

export function kisilikEtiketiBaslik(e: KisilikEtiketi): string {
  switch (e) {
    case KisilikEtiketi.Hircin:
      return "Hırçın";
    case KisilikEtiketi.Kisir:
      return "Kısır";
    case KisilikEtiketi.Oyunsever:
      return "Oyunsever";
    case KisilikEtiketi.Sakin:
      return "Sakin";
    case KisilikEtiketi.Enerjik:
      return "Enerjik";
    case KisilikEtiketi.Korkak:
      return "Korkak";
    case KisilikEtiketi.Korumaci:
      return "Korumacı";
    case KisilikEtiketi.Sosyal:
      return "Sosyal";
  }
}

export function kisilikEtiketiRenk(e: KisilikEtiketi): string {
  switch (e) {
    case KisilikEtiketi.Hircin:
      return "bg-red-100 text-red-700";
    case KisilikEtiketi.Kisir:
      return "bg-purple-100 text-purple-700";
    case KisilikEtiketi.Oyunsever:
      return "bg-green-100 text-green-700";
    case KisilikEtiketi.Sakin:
      return "bg-blue-100 text-blue-700";
    case KisilikEtiketi.Enerjik:
      return "bg-orange-100 text-orange-700";
    case KisilikEtiketi.Korkak:
      return "bg-yellow-100 text-yellow-700";
    case KisilikEtiketi.Korumaci:
      return "bg-amber-100 text-amber-700";
    case KisilikEtiketi.Sosyal:
      return "bg-teal-100 text-teal-700";
  }
}

export const kisilikEtiketiListesi: KisilikEtiketi[] = [
  KisilikEtiketi.Hircin,
  KisilikEtiketi.Kisir,
  KisilikEtiketi.Oyunsever,
  KisilikEtiketi.Sakin,
  KisilikEtiketi.Enerjik,
  KisilikEtiketi.Korkak,
  KisilikEtiketi.Korumaci,
  KisilikEtiketi.Sosyal,
];

// -----------------------------------------------------------------------------
// 13. AsiTekrarAraligi (Asi tekrar zamanlayicisi)
// -----------------------------------------------------------------------------
export const AsiTekrarAraligi = {
  Aylik: "Aylik",
  UcAylik: "UcAylik",
  AltiAylik: "AltiAylik",
  Yillik: "Yillik",
} as const;

export type AsiTekrarAraligi =
  (typeof AsiTekrarAraligi)[keyof typeof AsiTekrarAraligi];

export function asiTekrarAraligiBaslik(a: AsiTekrarAraligi): string {
  switch (a) {
    case AsiTekrarAraligi.Aylik:
      return "Aylık";
    case AsiTekrarAraligi.UcAylik:
      return "3 Aylık";
    case AsiTekrarAraligi.AltiAylik:
      return "6 Aylık";
    case AsiTekrarAraligi.Yillik:
      return "Yıllık";
  }
}

export function asiTekrarAraligiMs(a: AsiTekrarAraligi): number {
  switch (a) {
    case AsiTekrarAraligi.Aylik:
      return 30 * 24 * 60 * 60 * 1000;
    case AsiTekrarAraligi.UcAylik:
      return 90 * 24 * 60 * 60 * 1000;
    case AsiTekrarAraligi.AltiAylik:
      return 180 * 24 * 60 * 60 * 1000;
    case AsiTekrarAraligi.Yillik:
      return 365 * 24 * 60 * 60 * 1000;
  }
}

export const asiTekrarAraligiListesi: AsiTekrarAraligi[] = [
  AsiTekrarAraligi.Aylik,
  AsiTekrarAraligi.UcAylik,
  AsiTekrarAraligi.AltiAylik,
  AsiTekrarAraligi.Yillik,
];

// -----------------------------------------------------------------------------
// 14. CerceveTipi (Harita marker çerçeve türleri - Premium)
// -----------------------------------------------------------------------------
export const CerceveTipi = {
  Normal: "Normal",
  KralTaci: "KralTaci",
  KraliceTaci: "KraliceTaci",
  KirmiziKurdele: "KirmiziKurdele",
  Yildiz: "Yildiz",
  Elmas: "Elmas",
  Ates: "Ates",
} as const;

export type CerceveTipi = (typeof CerceveTipi)[keyof typeof CerceveTipi];

export function cerceveTipiBaslik(c: CerceveTipi): string {
  switch (c) {
    case CerceveTipi.Normal:
      return "Normal";
    case CerceveTipi.KralTaci:
      return "Kral Tacı";
    case CerceveTipi.KraliceTaci:
      return "Kraliçe Tacı";
    case CerceveTipi.KirmiziKurdele:
      return "Kırmızı Kurdele";
    case CerceveTipi.Yildiz:
      return "Yıldız";
    case CerceveTipi.Elmas:
      return "Elmas";
    case CerceveTipi.Ates:
      return "Ateş";
  }
}

export function cerceveTipiEmoji(c: CerceveTipi): string {
  switch (c) {
    case CerceveTipi.Normal:
      return "⚪";
    case CerceveTipi.KralTaci:
      return "👑";
    case CerceveTipi.KraliceTaci:
      return "👸";
    case CerceveTipi.KirmiziKurdele:
      return "🎀";
    case CerceveTipi.Yildiz:
      return "⭐";
    case CerceveTipi.Elmas:
      return "💎";
    case CerceveTipi.Ates:
      return "🔥";
  }
}

export function cerceveTipiAciklama(c: CerceveTipi): string {
  switch (c) {
    case CerceveTipi.Normal:
      return "Varsayılan mavi çerçeve";
    case CerceveTipi.KralTaci:
      return "Altın taç ile özel çerçeve";
    case CerceveTipi.KraliceTaci:
      return "Pembe taç ile zarif çerçeve";
    case CerceveTipi.KirmiziKurdele:
      return "Kırmızı kurdele ile şık çerçeve";
    case CerceveTipi.Yildiz:
      return "Parlayan yıldız çerçeve";
    case CerceveTipi.Elmas:
      return "Elmas ile değerli çerçeve";
    case CerceveTipi.Ates:
      return "Ateş efekti ile dinamik çerçeve";
  }
}

// Premium çerçeveler (Normal hariç)
export const premiumCerceveler: CerceveTipi[] = [
  CerceveTipi.KralTaci,
  CerceveTipi.KraliceTaci,
  CerceveTipi.KirmiziKurdele,
  CerceveTipi.Yildiz,
  CerceveTipi.Elmas,
  CerceveTipi.Ates,
];

export const tumCerceveler: CerceveTipi[] = [
  CerceveTipi.Normal,
  ...premiumCerceveler,
];

// =============================================================================
// Mesaj Rengi (Premium özellik - Topluluk chat mesaj renkleri)
// =============================================================================

export const MesajRengi = {
  Varsayilan: "Varsayilan",
  Mor: "Mor",
  Mavi: "Mavi",
  Yesil: "Yesil",
  Kirmizi: "Kirmizi",
  Turuncu: "Turuncu",
} as const;

export type MesajRengi = (typeof MesajRengi)[keyof typeof MesajRengi];

export function mesajRengiBaslik(renk: MesajRengi): string {
  switch (renk) {
    case MesajRengi.Varsayilan:
      return "Varsayılan";
    case MesajRengi.Mor:
      return "Mor";
    case MesajRengi.Mavi:
      return "Mavi";
    case MesajRengi.Yesil:
      return "Yeşil";
    case MesajRengi.Kirmizi:
      return "Kırmızı";
    case MesajRengi.Turuncu:
      return "Turuncu";
  }
}

export function mesajRengiHex(renk: MesajRengi): string {
  switch (renk) {
    case MesajRengi.Varsayilan:
      return "#6b7280"; // Gray
    case MesajRengi.Mor:
      return "#8b5cf6"; // Purple
    case MesajRengi.Mavi:
      return "#3b82f6"; // Blue
    case MesajRengi.Yesil:
      return "#10b981"; // Green
    case MesajRengi.Kirmizi:
      return "#ef4444"; // Red
    case MesajRengi.Turuncu:
      return "#f97316"; // Orange
  }
}

// Premium mesaj renkleri (Varsayılan hariç)
export const premiumMesajRenkleri: MesajRengi[] = [
  MesajRengi.Mor,
  MesajRengi.Mavi,
  MesajRengi.Yesil,
  MesajRengi.Kirmizi,
  MesajRengi.Turuncu,
];

export const tumMesajRenkleri: MesajRengi[] = [
  MesajRengi.Varsayilan,
  ...premiumMesajRenkleri,
];
