// =============================================================================
// PawLand - Yakındaki Yerler Servisi
// OpenStreetMap Overpass API kullanarak veteriner ve petshop arama
// =============================================================================

export type YerTipi = "veteriner" | "petshop";

export interface YakinYer {
  id: string;
  tip: YerTipi;
  ad: string;
  enlem: number;
  boylam: number;
  adres?: string;
  telefon?: string;
  mesafe?: number; // metre cinsinden
}

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// -----------------------------------------------------------------------------
// Yakındaki Yerleri Bul (Overpass API)
// -----------------------------------------------------------------------------

export async function yakinYerleriGetir(
  enlem: number,
  boylam: number,
  yaricap: number = 5000, // metre (varsayılan 5km)
  tipler: YerTipi[] = ["veteriner", "petshop"]
): Promise<YakinYer[]> {
  try {
    const yerler: YakinYer[] = [];

    // Veteriner sorgusu
    if (tipler.includes("veteriner")) {
      const veterinerler = await sorguYap(enlem, boylam, yaricap, "veteriner");
      yerler.push(...veterinerler);
    }

    // Petshop sorgusu
    if (tipler.includes("petshop")) {
      const petshoplar = await sorguYap(enlem, boylam, yaricap, "petshop");
      yerler.push(...petshoplar);
    }

    // Mesafeye göre sırala (yakından uzağa)
    yerler.sort((a, b) => (a.mesafe || 0) - (b.mesafe || 0));

    return yerler;
  } catch (error) {
    console.error("Yakındaki yerler alınamadı:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Overpass API Sorgusu
// -----------------------------------------------------------------------------

async function sorguYap(
  enlem: number,
  boylam: number,
  yaricap: number,
  tip: YerTipi
): Promise<YakinYer[]> {
  // Overpass QL sorgusu oluştur
  const tags = tip === "veteriner"
    ? ["amenity=veterinary"]
    : ["shop=pet", "shop=pet_grooming"];

  const tagQueries = tags.map(tag => `node["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:${yaricap},${enlem},${boylam});`).join("\n  ");

  const query = `
    [out:json][timeout:10];
    (
      ${tagQueries}
    );
    out body;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API hatası: ${response.status}`);
    }

    const data = await response.json();
    const yerler: YakinYer[] = [];

    for (const element of data.elements || []) {
      if (!element.lat || !element.lon) continue;

      const mesafe = mesafeHesapla(enlem, boylam, element.lat, element.lon);

      const yer: YakinYer = {
        id: `${tip}-${element.id}`,
        tip,
        ad: element.tags?.name || (tip === "veteriner" ? "Veteriner Kliniği" : "Pet Shop"),
        enlem: element.lat,
        boylam: element.lon,
        adres: formatAdres(element.tags),
        telefon: element.tags?.phone || element.tags?.["contact:phone"],
        mesafe,
      };

      yerler.push(yer);
    }

    return yerler;
  } catch (error) {
    console.error(`${tip} sorgusu başarısız:`, error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Yardımcı Fonksiyonlar
// -----------------------------------------------------------------------------

// Haversine formülü ile mesafe hesaplama (metre)
function mesafeHesapla(
  enlem1: number,
  boylam1: number,
  enlem2: number,
  boylam2: number
): number {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const φ1 = (enlem1 * Math.PI) / 180;
  const φ2 = (enlem2 * Math.PI) / 180;
  const Δφ = ((enlem2 - enlem1) * Math.PI) / 180;
  const Δλ = ((boylam2 - boylam1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Adres formatla
function formatAdres(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) return undefined;

  const parts: string[] = [];

  if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
    if (tags["addr:housenumber"]) {
      parts.push(tags["addr:housenumber"]);
    }
  }

  if (tags["addr:city"]) {
    parts.push(tags["addr:city"]);
  } else if (tags["addr:district"]) {
    parts.push(tags["addr:district"]);
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

// Mesafeyi okunabilir formatta döndür
export function mesafeFormat(mesafe: number): string {
  if (mesafe < 1000) {
    return `${mesafe}m`;
  } else {
    return `${(mesafe / 1000).toFixed(1)}km`;
  }
}
