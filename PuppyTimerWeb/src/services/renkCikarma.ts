// =============================================================================
// PuppyTimer Web - Fotograf Dominant Renk Cikarma
// Canvas API ile kopek fotografindan ana renkleri cikarir
// 3D model renklendirmesi icin kullanilir
// =============================================================================

// -----------------------------------------------------------------------------
// Yardimci: Base64 goruntusunu Image olarak yukle
// -----------------------------------------------------------------------------

function resimYukle(base64Foto: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Resim yuklenemedi"));

    if (base64Foto.startsWith("data:")) {
      img.src = base64Foto;
    } else {
      img.src = `data:image/jpeg;base64,${base64Foto}`;
    }
  });
}

// -----------------------------------------------------------------------------
// Yardimci: RGB -> Hex donusumu
// -----------------------------------------------------------------------------

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// -----------------------------------------------------------------------------
// Yardimci: RGB -> HSL parlaklik
// -----------------------------------------------------------------------------

function parlaklik(r: number, g: number, b: number): number {
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
}

// -----------------------------------------------------------------------------
// Ana fonksiyon: Fotograftan dominant renkleri cikar
// Histogram tabanli renk gruplama (4-bit kuantalama)
// -----------------------------------------------------------------------------

export async function dominantRenklerCikar(
  base64Foto: string
): Promise<{ primary: string; secondary: string; belly: string }> {
  const img = await resimYukle(base64Foto);

  // Kucuk boyuta olcekle
  const boyut = 128;
  const canvas = document.createElement("canvas");
  canvas.width = boyut;
  canvas.height = boyut;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context alinamadi");

  // Kare kirpma
  const kaynakBoyut = Math.min(img.width, img.height);
  const kaynakX = Math.floor((img.width - kaynakBoyut) / 2);
  const kaynakY = Math.floor((img.height - kaynakBoyut) / 2);
  ctx.drawImage(img, kaynakX, kaynakY, kaynakBoyut, kaynakBoyut, 0, 0, boyut, boyut);

  const imageData = ctx.getImageData(0, 0, boyut, boyut);
  const data = imageData.data;

  // Ic bolge orneklemesi (~%60 alan - kenarlardan %20 boslik birak)
  const kenarBosluk = Math.floor(boyut * 0.2);
  const basX = kenarBosluk;
  const basY = kenarBosluk;
  const bitX = boyut - kenarBosluk;
  const bitY = boyut - kenarBosluk;

  // 4-bit kuantalama histogrami (16x16x16 = 4096 bucket)
  const histogram = new Map<number, { r: number; g: number; b: number; count: number }>();

  for (let y = basY; y < bitY; y++) {
    for (let x = basX; x < bitX; x++) {
      const idx = (y * boyut + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Cok karanlik veya cok acik pikselleri atla (arka plan/parlama)
      const lum = (r + g + b) / 3;
      if (lum < 20 || lum > 240) continue;

      // 4-bit kuantalama
      const qr = r >> 4;
      const qg = g >> 4;
      const qb = b >> 4;
      const key = (qr << 8) | (qg << 4) | qb;

      const mevcut = histogram.get(key);
      if (mevcut) {
        mevcut.r += r;
        mevcut.g += g;
        mevcut.b += b;
        mevcut.count++;
      } else {
        histogram.set(key, { r, g, b, count: 1 });
      }
    }
  }

  // En yogun 3 rengi bul
  const sirali = [...histogram.values()]
    .map((v) => ({
      r: v.r / v.count,
      g: v.g / v.count,
      b: v.b / v.count,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count);

  // En az 3 renk grubu yoksa fallback
  const renkler = sirali.slice(0, Math.min(10, sirali.length));

  if (renkler.length === 0) {
    return { primary: "#C49347", secondary: "#A07830", belly: "#E8CC8B" };
  }

  // Primary: en yogun renk
  const primary = renkler[0];

  // Secondary: primary'den farkli ikinci en yogun
  let secondary = renkler.length > 1 ? renkler[1] : primary;

  // Belly: en acik tonlu renk (ilk 5 icinden)
  const ilkBesRenk = renkler.slice(0, Math.min(5, renkler.length));
  let belly = ilkBesRenk.reduce((enAcik, renk) => {
    return parlaklik(renk.r, renk.g, renk.b) > parlaklik(enAcik.r, enAcik.g, enAcik.b)
      ? renk
      : enAcik;
  }, ilkBesRenk[0]);

  // Belly cok karanliksa aciklatir
  if (parlaklik(belly.r, belly.g, belly.b) < 0.4) {
    belly = {
      r: Math.min(255, belly.r * 1.4),
      g: Math.min(255, belly.g * 1.4),
      b: Math.min(255, belly.b * 1.4),
      count: belly.count,
    };
  }

  return {
    primary: rgbToHex(primary.r, primary.g, primary.b),
    secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
    belly: rgbToHex(belly.r, belly.g, belly.b),
  };
}

// -----------------------------------------------------------------------------
// Cache'li foto renk cikarma (localStorage)
// -----------------------------------------------------------------------------

const CACHE_PREFIX = "puppytimer-foto-renkler-";

export async function fotoRenkleriniGetir(
  kopekId: number,
  fotoData?: string
): Promise<{ primary: string; secondary: string; belly: string } | null> {
  if (!fotoData) return null;

  // Cache kontrol
  const cacheKey = CACHE_PREFIX + kopekId;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { hash, renkler } = JSON.parse(cached);
      // Basit hash: fotoData'nin ilk 100 karakteri
      const currentHash = fotoData.substring(0, 100);
      if (hash === currentHash) return renkler;
    } catch {
      // cache bozuk, yeniden hesapla
    }
  }

  const renkler = await dominantRenklerCikar(fotoData);

  // Cache'e kaydet
  const hash = fotoData.substring(0, 100);
  localStorage.setItem(cacheKey, JSON.stringify({ hash, renkler }));

  return renkler;
}
