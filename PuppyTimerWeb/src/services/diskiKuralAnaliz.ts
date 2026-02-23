// =============================================================================
// PuppyTimer Web - Kural Tabanli Diski/Idrar Analizi
// Veteriner bilgisine dayali otomatik saglik degerlendirmesi
// API gerektirmez, tamamen offline calisir
// =============================================================================

import type { TuvaletKaydi } from "../types/models";
import type { DiskiAnalizi } from "./claudeApi";
import {
  TuvaletTuru,
  DiskiRenk,
  DiskiKivam,
  DiskilamaSekli,
  DiskilamaMiktar,
  IdrarRenk,
} from "../types/enums";

// -----------------------------------------------------------------------------
// Dahili tipler
// -----------------------------------------------------------------------------

type Siddet = "normal" | "dikkat" | "acil";

interface KuralSonucu {
  siddet: Siddet;
  aciklama: string;
  oneriler: string[];
}

// -----------------------------------------------------------------------------
// Siddet oncelik sirasi
// -----------------------------------------------------------------------------

const SIDDET_ONCELIK: Record<Siddet, number> = {
  normal: 0,
  dikkat: 1,
  acil: 2,
};

// =============================================================================
// ANA FONKSİYON
// =============================================================================

export function kuralTabanliAnaliz(kayit: TuvaletKaydi): DiskiAnalizi {
  const sonuclar: KuralSonucu[] =
    kayit.tur === TuvaletTuru.Buyuk
      ? buyukTuvaletKurallari(kayit)
      : kucukTuvaletKurallari(kayit);

  return birlesikSonucOlustur(sonuclar, kayit.tur);
}

// =============================================================================
// BUYUK TUVALET KURALLARI
// =============================================================================

function buyukTuvaletKurallari(k: TuvaletKaydi): KuralSonucu[] {
  const sonuclar: KuralSonucu[] = [];

  // -- Kombinasyon kurallari (oncelikli) --

  if (
    k.diskiRenk === DiskiRenk.Siyah &&
    (k.kivam === DiskiKivam.Sulu || k.sekil === DiskilamaSekli.Sulu)
  ) {
    sonuclar.push({
      siddet: "acil",
      aciklama:
        "Siyah ve sulu dışkı üst sindirim sistemi kanamasının ciddi belirtisidir.",
      oneriler: [
        "DERHAL veterinere başvurun.",
        "Köpeğinizi yakın takibe alın.",
      ],
    });
  } else if (
    k.diskiRenk === DiskiRenk.Kirmizi &&
    k.sekil === DiskilamaSekli.Sulu
  ) {
    sonuclar.push({
      siddet: "acil",
      aciklama:
        "Kanlı ishal ciddi bir acil durumdur. Hemorajik gastroenterit veya parvo virüsü olabilir.",
      oneriler: [
        "DERHAL veteriner acil servise başvurun.",
        "Köpeğinizi sıcak ve rahat tutun.",
        "Diğer köpeklerden izole edin.",
      ],
    });
  } else if (
    k.sekil === DiskilamaSekli.Sulu &&
    k.kivam === DiskiKivam.Sulu
  ) {
    sonuclar.push({
      siddet: "acil",
      aciklama:
        "Tamamen sulu dışkı ciddi ishal ve akut dehidrasyon riski taşır. Enfeksiyon, zehirlenme veya ciddi sindirim bozukluğu olabilir.",
      oneriler: [
        "Acil veteriner muayenesi gerekebilir.",
        "Dehidrasyon belirtilerini izleyin (kurumuş dişeti, halsizlik).",
        "Son 24 saatte yediği tüm besinleri not edin.",
      ],
    });
  }

  if (
    k.sekil === DiskilamaSekli.YuvarlakKucuk &&
    k.kivam === DiskiKivam.Sert &&
    k.miktar === DiskilamaMiktar.Az
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Küçük, sert ve az miktar ciddi kabızlık belirtisi olabilir. Barsak tıkanması riski değerlendirilmelidir.",
      oneriler: [
        "Su alımını artırın.",
        "Hareketi artırın.",
        "2 günden fazla sürerse veterinere danışın.",
      ],
    });
  }

  if (
    (k.kivam === DiskiKivam.Sulu || k.kivam === DiskiKivam.Yumusak) &&
    k.miktar === DiskilamaMiktar.Cok
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Fazla miktarda yumuşak/sulu dışkı barsak iltihabına veya besin intoleransına işaret edebilir.",
      oneriler: [
        "Beslenme programını gözden geçirin.",
        "Son mama değişikliğini kontrol edin.",
        "48 saat içinde düzelme olmazsa veterinere danışın.",
      ],
    });
  }

  // -- Tekil renk kurallari --

  if (!sonuclar.some((s) => s.siddet === "acil")) {
    if (k.diskiRenk === DiskiRenk.Siyah) {
      sonuclar.push({
        siddet: "acil",
        aciklama:
          "Siyah dışkı sindirim sisteminin üst kısmında kanamaya işaret edebilir (melena). Bu ciddi bir bulgu olabilir.",
        oneriler: [
          "Acil veteriner muayenesi önerilir.",
          "Köpeğinizin genel durumunu (halsizlik, iştahsızlık) izleyin.",
        ],
      });
    } else if (k.diskiRenk === DiskiRenk.Kirmizi) {
      sonuclar.push({
        siddet: "acil",
        aciklama:
          "Kırmızı dışkı sindirim sisteminin alt kısmında kanama veya kolon iltihabına işaret edebilir.",
        oneriler: [
          "Acil veteriner muayenesi önerilir.",
          "Kanama miktarını ve sıklığını not edin.",
        ],
      });
    }
  }

  if (k.diskiRenk === DiskiRenk.Yesil) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Yeşil dışkı safra pigmenti sorunlarına, ot yemeye veya sindirim bozukluğuna işaret edebilir.",
      oneriler: [
        "Köpeğinizin ot yiyip yemediğini kontrol edin.",
        "24 saat içinde düzelme olmazsa veterinere danışın.",
      ],
    });
  }

  if (k.diskiRenk === DiskiRenk.Acik) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Açık renkli (solgun) dışkı karaciğer veya safra kesesi sorunlarına işaret edebilir.",
      oneriler: [
        "Devam ederse veteriner muayenesi önerilir.",
        "Beslenme değişikliklerini not edin.",
      ],
    });
  }

  // -- Tekil kivam kurallari --

  if (
    k.kivam === DiskiKivam.Sulu &&
    !sonuclar.some((s) => s.aciklama.includes("sulu"))
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama: "Sulu kıvam ishal belirtisidir. Dehidrasyon riski taşır.",
      oneriler: [
        "Temiz su erişimini artırın.",
        "24 saatten uzun sürerse veterinere danışın.",
        "Beslenmeyi hafifletin (pirinç, haşlama tavuk).",
      ],
    });
  }

  if (k.kivam === DiskiKivam.Sert && !sonuclar.some((s) => s.aciklama.includes("kabızlık"))) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Sert kıvam kabızlık belirtisi olabilir. Yetersiz su alımı veya lif eksikliği olabilir.",
      oneriler: [
        "Su alımını artırın.",
        "Beslenmeye lif eklemeyi deneyin.",
        "Devam ederse veterinere danışın.",
      ],
    });
  }

  // -- Tekil sekil kurallari --

  if (
    k.sekil === DiskilamaSekli.Sulu &&
    !sonuclar.some((s) => s.aciklama.includes("ishal"))
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama: "Şekilsiz/sulu dışkı akut ishal belirtisi olabilir.",
      oneriler: [
        "Besin alerjisi veya enfeksiyon açısından değerlendirin.",
        "Bugün-yarın içerisinde düzelme olmazsa veterinere danışın.",
      ],
    });
  }

  if (
    k.sekil === DiskilamaSekli.YuvarlakKucuk &&
    !sonuclar.some((s) => s.aciklama.includes("kabızlık"))
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Yuvarlak küçük parçalar halindeki dışkı kabızlık ve dehidrasyon belirtisi olabilir.",
      oneriler: [
        "Su alımını kontrol edin.",
        "Egzersiz miktarını artırmayı deneyin.",
      ],
    });
  }

  // -- Miktar kurallari --

  if (k.miktar === DiskilamaMiktar.Cok && !sonuclar.some((s) => s.aciklama.includes("miktar"))) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Normalden fazla miktar emilim bozukluğu veya aşırı beslenme belirtisi olabilir.",
      oneriler: [
        "Porsiyon miktarını gözden geçirin.",
        "Mama değişikliği yapıldıysa geçiş sürecine dikkat edin.",
      ],
    });
  }

  return sonuclar;
}

// =============================================================================
// KUCUK TUVALET KURALLARI
// =============================================================================

function kucukTuvaletKurallari(k: TuvaletKaydi): KuralSonucu[] {
  const sonuclar: KuralSonucu[] = [];

  // -- Kombinasyon kurallari --

  if (k.idrarRenk === IdrarRenk.Koyu && k.idrarMiktar === DiskilamaMiktar.Az) {
    sonuclar.push({
      siddet: "acil",
      aciklama:
        "Koyu renkli ve az miktarda idrar ciddi dehidrasyon veya böbrek yetmezliği belirtisi olabilir.",
      oneriler: [
        "Acil veteriner muayenesi önerilir.",
        "Hemen su verin.",
        "Son 24 saatteki su alımını değerlendirin.",
      ],
    });
    return sonuclar; // En ciddi durum, diger kurallara gerek yok
  }

  if (
    k.idrarRenk === IdrarRenk.Acik &&
    k.idrarMiktar === DiskilamaMiktar.Cok
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Çok miktarda açık renkli idrar (poliüri) diyabet, böbrek sorunu veya Cushing sendromu belirtisi olabilir.",
      oneriler: [
        "Su tüketimini ölçün.",
        "Kilo kaybı veya aşırı iştah olup olmadığını izleyin.",
        "Veterinere danışın.",
      ],
    });
  }

  // -- Tekil renk kurallari --

  if (k.idrarRenk === IdrarRenk.Kirmizi) {
    sonuclar.push({
      siddet: "acil",
      aciklama:
        "Kırmızı/kanlı idrar (hematüri) mesane enfeksiyonu, böbrek taşı veya ciddi üriner sistem sorunu olabilir.",
      oneriler: [
        "Acil veteriner muayenesi önerilir.",
        "İdrar sıklığını ve miktarını not edin.",
        "Köpeğinizin ağrı belirtisi gösterip göstermediğini izleyin.",
      ],
    });
  }

  if (k.idrarRenk === IdrarRenk.Koyu && !sonuclar.some((s) => s.siddet === "acil")) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Koyu renkli idrar dehidrasyon, karaciğer sorunu veya kas hasarı belirtisi olabilir.",
      oneriler: [
        "Su alımını derhal artırın.",
        "İdrar rengi 24 saat içinde normalleşmezse veterinere danışın.",
      ],
    });
  }

  // -- Tekil miktar kurallari --

  if (
    k.idrarMiktar === DiskilamaMiktar.Az &&
    !sonuclar.some((s) => s.siddet === "acil")
  ) {
    sonuclar.push({
      siddet: "dikkat",
      aciklama:
        "Az miktarda işeme üriner sistem tıkanması veya böbrek sorunu belirtisi olabilir.",
      oneriler: [
        "İşeme sırasında zorluk çekip çekmediğini izleyin.",
        "Devam ederse veterinere danışın.",
      ],
    });
  }

  return sonuclar;
}

// =============================================================================
// SONUC BIRLESTIRME
// =============================================================================

function birlesikSonucOlustur(
  sonuclar: KuralSonucu[],
  tur: TuvaletKaydi["tur"]
): DiskiAnalizi {
  // Sadece normal olmayan sonuclari filtrele
  const anormalSonuclar = sonuclar.filter((s) => s.siddet !== "normal");

  if (anormalSonuclar.length === 0) {
    const normalMesaj =
      tur === TuvaletTuru.Buyuk
        ? "Dışkı özellikleri normal sınırlar içerisinde görünüyor. Sağlıklı sindirim belirtisi."
        : "İdrar özellikleri normal sınırlar içerisinde görünüyor. Sağlıklı böbrek fonksiyonu belirtisi.";

    return {
      durum: "normal",
      aciklama: normalMesaj,
      oneriler: [
        "Mevcut beslenme düzeniyle devam edin.",
        "Düzenli tuvalet takibine devam edin.",
      ],
      uyariMi: false,
    };
  }

  // En yuksek siddeti bul
  const enYuksekSiddet = anormalSonuclar.reduce<Siddet>((max, s) => {
    return SIDDET_ONCELIK[s.siddet] > SIDDET_ONCELIK[max] ? s.siddet : max;
  }, "dikkat");

  // Aciklamalari birlestir
  const aciklama = anormalSonuclar.map((s) => s.aciklama).join("\n\n");

  // Onerileri tekillestiir
  const tumOneriler = anormalSonuclar.flatMap((s) => s.oneriler);
  const benzersizOneriler = [...new Set(tumOneriler)];

  return {
    durum: enYuksekSiddet,
    aciklama,
    oneriler: benzersizOneriler,
    uyariMi: true,
  };
}
