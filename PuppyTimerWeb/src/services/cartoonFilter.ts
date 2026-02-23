// =============================================================================
// PuppyTimer Web - Cartoon/Anime Filtre Servisi
// Tamamen client-side HTML5 Canvas ile cartoon efekti uygular.
// Harici bagimliligi yoktur - saf Canvas API kullanir.
// =============================================================================

// -----------------------------------------------------------------------------
// Yardimci: Canvas olusturma (OffscreenCanvas veya fallback)
// -----------------------------------------------------------------------------
function canvasOlustur(genislik: number, yukseklik: number): {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
} {
  // OffscreenCanvas destegi varsa kullan
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(genislik, yukseklik);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("OffscreenCanvas 2D context alinamadi.");
    return { canvas, ctx };
  }

  // Fallback: document.createElement
  const canvas = document.createElement("canvas");
  canvas.width = genislik;
  canvas.height = yukseklik;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context alinamadi.");
  return { canvas, ctx };
}

// -----------------------------------------------------------------------------
// Yardimci: Base64 goruntusunu Image olarak yukle
// -----------------------------------------------------------------------------
function resimYukle(base64Foto: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Resim yuklenemedi."));

    // data: prefix yoksa ekle
    if (base64Foto.startsWith("data:")) {
      img.src = base64Foto;
    } else {
      img.src = `data:image/jpeg;base64,${base64Foto}`;
    }
  });
}

// -----------------------------------------------------------------------------
// Adim 1: Kare kirpma ve boyutlandirma
// Gorseli ortadan kirparak kare yapar ve hedef boyuta olcekler.
// -----------------------------------------------------------------------------
function kareKirpVeBoyutlandir(
  img: HTMLImageElement,
  boyut: number
): ImageData {
  // Kare kirpma: kisa kenar baz, ortadan kes
  const kaynakBoyut = Math.min(img.width, img.height);
  const kaynakX = Math.floor((img.width - kaynakBoyut) / 2);
  const kaynakY = Math.floor((img.height - kaynakBoyut) / 2);

  const { ctx } = canvasOlustur(boyut, boyut);
  ctx.drawImage(img, kaynakX, kaynakY, kaynakBoyut, kaynakBoyut, 0, 0, boyut, boyut);
  return ctx.getImageData(0, 0, boyut, boyut);
}

// -----------------------------------------------------------------------------
// Adim 2: Gaussian-benzeri blur (3x3 kutu blur, 2 pas)
// Cilt/tuy gibi alanlari pürüzsüzlestirir.
// -----------------------------------------------------------------------------
function bulaniklastir(veri: ImageData, pasSayisi: number): ImageData {
  const { width: w, height: h } = veri;
  let kaynak = new Uint8ClampedArray(veri.data);
  let hedef = new Uint8ClampedArray(veri.data.length);

  // 3x3 Gaussian-benzeri agirliklar (normalize edilmis)
  // [1 2 1]
  // [2 4 2] / 16
  // [1 2 1]
  const agirliklar = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const agirlikToplam = 16;

  for (let pas = 0; pas < pasSayisi; pas++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let ai = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            // Kenar sinirlamasi (clamp)
            const nx = Math.min(Math.max(x + dx, 0), w - 1);
            const ny = Math.min(Math.max(y + dy, 0), h - 1);
            const idx = (ny * w + nx) * 4;
            const agirlik = agirliklar[ai++];

            r += kaynak[idx] * agirlik;
            g += kaynak[idx + 1] * agirlik;
            b += kaynak[idx + 2] * agirlik;
          }
        }

        const hedefIdx = (y * w + x) * 4;
        hedef[hedefIdx] = r / agirlikToplam;
        hedef[hedefIdx + 1] = g / agirlikToplam;
        hedef[hedefIdx + 2] = b / agirlikToplam;
        hedef[hedefIdx + 3] = kaynak[hedefIdx + 3]; // Alpha koru
      }
    }

    // Sonraki pas icin kaynak ve hedef takas
    if (pas < pasSayisi - 1) {
      const gecici = kaynak;
      kaynak = hedef;
      hedef = gecici;
    }
  }

  const sonuc = new ImageData(w, h);
  sonuc.data.set(hedef);
  return sonuc;
}

// -----------------------------------------------------------------------------
// Adim 3: Renk posterizasyonu (niceleme)
// Her RGB kanalini ~8 seviyeye indirir -> duz cartoon alanlari olusturur.
// 256 / 8 = 32, her kanal 32'ye bolunup 32 ile carpilir.
// -----------------------------------------------------------------------------
function posterize(veri: ImageData): ImageData {
  const sonuc = new ImageData(new Uint8ClampedArray(veri.data), veri.width, veri.height);
  const d = sonuc.data;
  const seviye = 32; // 256 / 8

  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.floor(d[i] / seviye) * seviye + Math.floor(seviye / 2);
    d[i + 1] = Math.floor(d[i + 1] / seviye) * seviye + Math.floor(seviye / 2);
    d[i + 2] = Math.floor(d[i + 2] / seviye) * seviye + Math.floor(seviye / 2);
    // Alpha degismez
  }

  return sonuc;
}

// -----------------------------------------------------------------------------
// Adim 4: Kenar tespiti (Sobel gradyan + esikleme)
// Gri tonlamali Sobel gradyani hesaplar, esik degeri ile kenar maskesi uretir.
// Dondurur: kenar yogunlugu dizisi (0-255, 0=kenar yok, 255=guclu kenar)
// -----------------------------------------------------------------------------
function kenarTespitiYap(veri: ImageData, esikDegeri: number): Uint8ClampedArray {
  const { width: w, height: h } = veri;
  const d = veri.data;

  // Once gri tonlamaya cevir
  const gri = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    // ITU-R BT.601 agirliklari
    gri[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
  }

  // Sobel cekirdekleri
  // Gx: [-1 0 1]   Gy: [-1 -2 -1]
  //     [-2 0 2]        [ 0  0  0]
  //     [-1 0 1]        [ 1  2  1]

  const kenarlar = new Uint8ClampedArray(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // Komsu pikseller
      const solUst = gri[(y - 1) * w + (x - 1)];
      const ust = gri[(y - 1) * w + x];
      const sagUst = gri[(y - 1) * w + (x + 1)];
      const sol = gri[y * w + (x - 1)];
      const sag = gri[y * w + (x + 1)];
      const solAlt = gri[(y + 1) * w + (x - 1)];
      const alt = gri[(y + 1) * w + x];
      const sagAlt = gri[(y + 1) * w + (x + 1)];

      // Sobel gradyanlari
      const gx = -solUst + sagUst - 2 * sol + 2 * sag - solAlt + sagAlt;
      const gy = -solUst - 2 * ust - sagUst + solAlt + 2 * alt + sagAlt;

      // Gradyan buyuklugu
      const buyukluk = Math.sqrt(gx * gx + gy * gy);

      // Esikleme: kenar mi degil mi
      kenarlar[y * w + x] = buyukluk > esikDegeri ? 255 : 0;
    }
  }

  return kenarlar;
}

// -----------------------------------------------------------------------------
// Adim 5: Kenarlari posterize goruntunun uzerine bindirme
// Kenar olan pikselleri koyu (siyaha yakin) yapar -> cartoon dis hatlari.
// -----------------------------------------------------------------------------
function kenarlariBindir(
  posterizeVeri: ImageData,
  kenarlar: Uint8ClampedArray,
  kenarKaranlikOrani: number
): ImageData {
  const sonuc = new ImageData(
    new Uint8ClampedArray(posterizeVeri.data),
    posterizeVeri.width,
    posterizeVeri.height
  );
  const d = sonuc.data;
  const w = posterizeVeri.width;
  const h = posterizeVeri.height;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const kenarIdx = y * w + x;
      if (kenarlar[kenarIdx] > 0) {
        const pikselIdx = kenarIdx * 4;
        // Kenar piksellerini karanlastir
        d[pikselIdx] = Math.floor(d[pikselIdx] * kenarKaranlikOrani);
        d[pikselIdx + 1] = Math.floor(d[pikselIdx + 1] * kenarKaranlikOrani);
        d[pikselIdx + 2] = Math.floor(d[pikselIdx + 2] * kenarKaranlikOrani);
      }
    }
  }

  return sonuc;
}

// -----------------------------------------------------------------------------
// Adim 6: Doygunluk artirma (HSL uzayinda)
// Renkleri daha canli/parlak yapar - cartoon gorunumu guclendirir.
// -----------------------------------------------------------------------------
function doygunlukArtir(veri: ImageData, artisOrani: number): ImageData {
  const sonuc = new ImageData(
    new Uint8ClampedArray(veri.data),
    veri.width,
    veri.height
  );
  const d = sonuc.data;

  for (let i = 0; i < d.length; i += 4) {
    // RGB -> HSL donusumu
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;

    const maks = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const aralik = maks - min;

    let h = 0;
    let s = 0;
    const l = (maks + min) / 2;

    if (aralik > 0) {
      s = l > 0.5 ? aralik / (2 - maks - min) : aralik / (maks + min);

      if (maks === r) {
        h = ((g - b) / aralik + (g < b ? 6 : 0)) / 6;
      } else if (maks === g) {
        h = ((b - r) / aralik + 2) / 6;
      } else {
        h = ((r - g) / aralik + 4) / 6;
      }
    }

    // Doygunluk artir
    s = Math.min(s * (1 + artisOrani), 1);

    // HSL -> RGB geri donusum
    if (s === 0) {
      d[i] = d[i + 1] = d[i + 2] = Math.round(l * 255);
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      d[i] = Math.round(hslBilesenHesapla(p, q, h + 1 / 3) * 255);
      d[i + 1] = Math.round(hslBilesenHesapla(p, q, h) * 255);
      d[i + 2] = Math.round(hslBilesenHesapla(p, q, h - 1 / 3) * 255);
    }
    // Alpha degismez
  }

  return sonuc;
}

/**
 * HSL -> RGB donusumunde tek bir renk bileseni hesaplar.
 */
function hslBilesenHesapla(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

// -----------------------------------------------------------------------------
// Yardimci: ImageData'yi JPEG base64'e cevir
// -----------------------------------------------------------------------------
function imageDataToBase64Jpeg(
  imgData: ImageData,
  kalite: number
): string {
  const { ctx, canvas } = canvasOlustur(imgData.width, imgData.height);
  ctx.putImageData(imgData, 0, 0);

  let dataUrl: string;

  if (canvas instanceof OffscreenCanvas) {
    // OffscreenCanvas: toDataURL yok, gecici normal canvas kullan
    const geciciCanvas = document.createElement("canvas");
    geciciCanvas.width = imgData.width;
    geciciCanvas.height = imgData.height;
    const geciciCtx = geciciCanvas.getContext("2d");
    if (!geciciCtx) throw new Error("Gecici canvas context alinamadi.");
    geciciCtx.putImageData(imgData, 0, 0);
    dataUrl = geciciCanvas.toDataURL("image/jpeg", kalite);
  } else {
    dataUrl = canvas.toDataURL("image/jpeg", kalite);
  }

  // "data:image/jpeg;base64," on ekini kaldir, sadece ham base64 dondur
  const virgulIdx = dataUrl.indexOf(",");
  if (virgulIdx !== -1) {
    return dataUrl.substring(virgulIdx + 1);
  }
  return dataUrl;
}

// =============================================================================
// ANA FONKSIYON: Cartoon filtresi uygula
// =============================================================================

/**
 * Base64 formatindaki bir gorsele cartoon/anime filtresi uygular.
 * Tum isleme client-side Canvas API ile yapilir.
 *
 * @param base64Foto - Girdi resmi (ham base64 veya data: prefix'li)
 * @param boyut - Cikti boyutu (piksel, varsayilan 512, kare olarak)
 * @returns Ham base64 JPEG string (data: prefix'siz)
 */
export async function cartoonFiltresiUygula(
  base64Foto: string,
  boyut: number = 512
): Promise<string> {
  // 1. Resmi yukle
  const img = await resimYukle(base64Foto);

  // 2. Kare kirp ve hedef boyuta olcekle
  const kirpilmis = kareKirpVeBoyutlandir(img, boyut);

  // 3. Gaussian-benzeri blur (3x3, 2 pas) - pürüzsüzlestirme
  const bulanik = bulaniklastir(kirpilmis, 2);

  // 4. Renk posterizasyonu (~8 seviye)
  const posterizeDurum = posterize(bulanik);

  // 5. Kenar tespiti (orijinal bulanik goruntu uzerinden, daha temiz kenarlar icin)
  const kenarMaskesi = kenarTespitiYap(bulanik, 50);

  // 6. Kenarlari posterize goruntunun uzerine bindir
  const kenarliGoruntu = kenarlariBindir(posterizeDurum, kenarMaskesi, 0.15);

  // 7. Doygunluk artir (%30)
  const canliGoruntu = doygunlukArtir(kenarliGoruntu, 0.3);

  // 8. Sonucu JPEG base64 olarak dondur (daha agresif sıkıştırma)
  return imageDataToBase64Jpeg(canliGoruntu, 0.75);
}
