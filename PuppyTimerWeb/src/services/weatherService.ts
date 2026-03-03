// =============================================================================
// PuppyTimer Web - Hava Durumu Servisi
// Open-Meteo API (ücretsiz, API key gerekmez)
// =============================================================================

export interface HavaDurumu {
  sicaklik: number; // Celsius
  hissedilenSicaklik: number;
  nemOrani: number; // 0-100
  ruzgarHizi: number; // km/h
  yagis: number; // mm
  havaDurumu: string; // açıklama
  ikon: string; // emoji
  yuruyusUygun: boolean;
  uygunlukMesaji: string;
}

// WMO Weather interpretation codes (WW)
const HavaDurumuKodlari: Record<number, { tanim: string; emoji: string }> = {
  0: { tanim: "Açık", emoji: "☀️" },
  1: { tanim: "Az Bulutlu", emoji: "🌤️" },
  2: { tanim: "Parçalı Bulutlu", emoji: "⛅" },
  3: { tanim: "Bulutlu", emoji: "☁️" },
  45: { tanim: "Sisli", emoji: "🌫️" },
  48: { tanim: "Dondurucu Sis", emoji: "🌫️" },
  51: { tanim: "Hafif Çiseleyen", emoji: "🌦️" },
  53: { tanim: "Çiseleyen", emoji: "🌦️" },
  55: { tanim: "Yoğun Çiseleyen", emoji: "🌧️" },
  61: { tanim: "Hafif Yağmurlu", emoji: "🌧️" },
  63: { tanim: "Yağmurlu", emoji: "🌧️" },
  65: { tanim: "Şiddetli Yağmurlu", emoji: "⛈️" },
  71: { tanim: "Hafif Karlı", emoji: "🌨️" },
  73: { tanim: "Karlı", emoji: "❄️" },
  75: { tanim: "Yoğun Karlı", emoji: "❄️" },
  77: { tanim: "Kırağılı", emoji: "❄️" },
  80: { tanim: "Sağanak Yağışlı", emoji: "🌧️" },
  81: { tanim: "Orta Sağanak", emoji: "⛈️" },
  82: { tanim: "Şiddetli Sağanak", emoji: "⛈️" },
  85: { tanim: "Kar Fırtınası", emoji: "🌨️" },
  86: { tanim: "Yoğun Kar Fırtınası", emoji: "🌨️" },
  95: { tanim: "Gök Gürültülü Fırtına", emoji: "⛈️" },
  96: { tanim: "Dolu Fırtınası", emoji: "⛈️" },
  99: { tanim: "Şiddetli Dolu", emoji: "⛈️" },
};

// -----------------------------------------------------------------------------
// Koordinatlara göre hava durumu getir
// -----------------------------------------------------------------------------
export async function havaDurumuGetir(
  enlem: number,
  boylam: number
): Promise<HavaDurumu | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Hava durumu alınamadı");

    const data = await response.json();
    const current = data.current;

    const sicaklik = Math.round(current.temperature_2m);
    const hissedilenSicaklik = Math.round(current.apparent_temperature);
    const nemOrani = Math.round(current.relative_humidity_2m);
    const ruzgarHizi = Math.round(current.wind_speed_10m);
    const yagis = current.precipitation || 0;
    const weatherCode = current.weather_code;

    const durumBilgi = HavaDurumuKodlari[weatherCode] || {
      tanim: "Bilinmiyor",
      emoji: "❓",
    };

    // Yürüyüş uygunluğu kontrolü
    const { uygun, mesaj } = yuruyusUygunlukKontrol(
      sicaklik,
      yagis,
      ruzgarHizi,
      weatherCode
    );

    return {
      sicaklik,
      hissedilenSicaklik,
      nemOrani,
      ruzgarHizi,
      yagis,
      havaDurumu: durumBilgi.tanim,
      ikon: durumBilgi.emoji,
      yuruyusUygun: uygun,
      uygunlukMesaji: mesaj,
    };
  } catch (error) {
    console.error("Hava durumu hatası:", error);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Yürüyüş uygunluğu kontrolü
// -----------------------------------------------------------------------------
function yuruyusUygunlukKontrol(
  sicaklik: number,
  yagis: number,
  ruzgar: number,
  weatherCode: number
): { uygun: boolean; mesaj: string } {
  // Çok soğuk
  if (sicaklik < -5) {
    return {
      uygun: false,
      mesaj: "❄️ Çok soğuk! Kısa yürüyüş yapın ve köpeğinizi sıcak tutun.",
    };
  }

  // Çok sıcak
  if (sicaklik > 32) {
    return {
      uygun: false,
      mesaj: "🌡️ Çok sıcak! Sabah erken veya akşam geç saatlerde yürüyün.",
    };
  }

  // Yağışlı
  if (yagis > 5) {
    return {
      uygun: false,
      mesaj: "🌧️ Yağmurlu! Yağmurluk giydirin veya yağmur kesilene kadar bekleyin.",
    };
  }

  // Fırtınalı
  if (weatherCode >= 95) {
    return {
      uygun: false,
      mesaj: "⛈️ Fırtınalı! Güvenlik için evde kalın.",
    };
  }

  // Karlı
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      uygun: true,
      mesaj: "❄️ Karlı! Patileri koruyun ve kısa yürüyüş yapın.",
    };
  }

  // Rüzgarlı
  if (ruzgar > 40) {
    return {
      uygun: false,
      mesaj: "💨 Çok rüzgarlı! Dikkatli olun veya erteleyın.",
    };
  }

  // İdeal hava (15-25°C, yağışsız)
  if (sicaklik >= 15 && sicaklik <= 25 && yagis === 0) {
    return {
      uygun: true,
      mesaj: "✅ Mükemmel hava! Yürüyüş için ideal zaman.",
    };
  }

  // Kabul edilebilir
  return {
    uygun: true,
    mesaj: "👍 Yürüyüş yapılabilir. İyi eğlenceler!",
  };
}

// -----------------------------------------------------------------------------
// Konum izni al (tarayıcı Geolocation API)
// -----------------------------------------------------------------------------
export async function konumAl(): Promise<{ enlem: number; boylam: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Konum servisi desteklenmiyor");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          enlem: position.coords.latitude,
          boylam: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Konum alınamadı:", error);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 dakika cache
      }
    );
  });
}

// -----------------------------------------------------------------------------
// Varsayılan şehir konumları (kullanıcı izin vermezse)
// -----------------------------------------------------------------------------
export const VARSAYILAN_SEHIRLER = [
  { ad: "İstanbul", enlem: 41.0082, boylam: 28.9784 },
  { ad: "Ankara", enlem: 39.9334, boylam: 32.8597 },
  { ad: "İzmir", enlem: 38.4237, boylam: 27.1428 },
  { ad: "Antalya", enlem: 36.8969, boylam: 30.7133 },
  { ad: "Bursa", enlem: 40.1826, boylam: 29.0665 },
];
