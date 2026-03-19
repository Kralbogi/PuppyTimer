// =============================================================================
// PawLand - Breed Image Service
// Dog CEO API'den cinse gore fotograf ceker ve localStorage'da cache'ler
// =============================================================================

const CACHE_KEY = "pawland_breed_images";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 gun

// =============================================================================
// Breed name → Dog CEO API format mapper
// =============================================================================

function toDogCeoBreed(irk: string): string | null {
  const b = irk.toLowerCase().trim();

  // Specific breed mappings (order matters - more specific first)
  const mappings: [RegExp, string][] = [
    [/golden retriever/i, "retriever/golden"],
    [/labrador retriever/i, "labrador"],
    [/german shepherd/i, "germanshepherd"],
    [/french bulldog/i, "bulldog/french"],
    [/english bulldog/i, "bulldog/english"],
    [/american bulldog/i, "bulldog/english"],
    [/boston terrier/i, "bulldog/boston"],
    [/australian shepherd/i, "australian/shepherd"],
    [/bernese mountain/i, "mountain/bernese"],
    [/swiss mountain/i, "mountain/swiss"],
    [/great dane/i, "dane/great"],
    [/great pyrenees/i, "pyrenees"],
    [/saint bernard/i, "stbernard"],
    [/st\. bernard/i, "stbernard"],
    [/shih tzu/i, "shihtzu"],
    [/pit\s?bull/i, "pitbull"],
    [/border collie/i, "collie/border"],
    [/cocker spaniel/i, "spaniel/cocker"],
    [/english springer/i, "springer/english"],
    [/irish setter/i, "setter/irish"],
    [/english setter/i, "setter/english"],
    [/gordon setter/i, "setter/gordon"],
    [/miniature schnauzer/i, "schnauzer/miniature"],
    [/giant schnauzer/i, "schnauzer/giant"],
    [/standard poodle/i, "poodle/standard"],
    [/miniature poodle/i, "poodle/miniature"],
    [/toy poodle/i, "poodle/toy"],
    [/bull mastiff/i, "mastiff/bull"],
    [/english mastiff/i, "mastiff/english"],
    [/tibetan mastiff/i, "mastiff/tibetan"],
    [/yorkshire terrier/i, "terrier/yorkshire"],
    [/west highland/i, "terrier/westhighland"],
    [/scottish terrier/i, "terrier/scottish"],
    [/irish terrier/i, "terrier/irish"],
    [/fox terrier/i, "terrier/fox"],
    [/jack russell/i, "terrier/russell"],
    [/cairn terrier/i, "terrier/cairn"],
    [/norfolk terrier/i, "terrier/norfolk"],
    [/staffordshire/i, "bullterrier/staffordshire"],
    [/rhodesian/i, "ridgeback/rhodesian"],
    [/bichon frise/i, "frise/bichon"],
    [/bichon/i, "frise/bichon"],
    [/lhasa apso/i, "lhasa"],
    [/norwegian elkhound/i, "elkhound/norwegian"],
    [/shetland sheepdog/i, "sheepdog/shetland"],
    [/old english sheepdog/i, "sheepdog/english"],
    [/cardigan corgi/i, "corgi/cardigan"],
    [/pembroke corgi/i, "pembroke"],
    [/italian greyhound/i, "greyhound/italian"],
    [/afghan hound/i, "hound/afghan"],
    [/basset hound/i, "hound/basset"],
    [/bloodhound/i, "hound/blood"],
    [/miniature pinscher/i, "pinscher/miniature"],
    [/german pointer/i, "pointer/german"],

    // Generic/simple name matches
    [/labradoodle/i, "labradoodle"],
    [/cockapoo/i, "cockapoo"],
    [/goldendoodle/i, "labradoodle"],
    [/akita/i, "akita"],
    [/beagle/i, "beagle"],
    [/boxer/i, "boxer"],
    [/chihuahua/i, "chihuahua"],
    [/chow/i, "chow"],
    [/dalmatian/i, "dalmatian"],
    [/doberman/i, "doberman"],
    [/havanese/i, "havanese"],
    [/husky/i, "husky"],
    [/keeshond/i, "keeshond"],
    [/komondor/i, "komondor"],
    [/labrador/i, "labrador"],
    [/malamute/i, "malamute"],
    [/malinois/i, "malinois"],
    [/maltese/i, "maltese"],
    [/newfoundland/i, "newfoundland"],
    [/papillon/i, "papillon"],
    [/pomeranian/i, "pomeranian"],
    [/pug/i, "pug"],
    [/rottweiler/i, "rottweiler"],
    [/saluki/i, "saluki"],
    [/samoyed/i, "samoyed"],
    [/shiba/i, "shiba"],
    [/vizsla/i, "vizsla"],
    [/weimaraner/i, "weimaraner"],
    [/whippet/i, "whippet"],
    [/dachshund/i, "dachshund"],

    // Fallback group matches
    [/poodle/i, "poodle/standard"],
    [/schnauzer/i, "schnauzer/miniature"],
    [/spaniel/i, "spaniel/cocker"],
    [/setter/i, "setter/irish"],
    [/shepherd/i, "germanshepherd"],
    [/retriever/i, "retriever/golden"],
    [/bulldog/i, "bulldog/english"],
    [/mastiff/i, "mastiff/english"],
    [/hound/i, "hound/basset"],
    [/collie/i, "collie/border"],
    [/corgi/i, "pembroke"],
    [/terrier/i, "terrier/russell"],
    [/sheepdog/i, "sheepdog/shetland"],
    [/greyhound/i, "greyhound/italian"],
  ];

  for (const [pattern, breed] of mappings) {
    if (pattern.test(b)) return breed;
  }

  return null;
}

// =============================================================================
// Cache helpers
// =============================================================================

interface CacheEntry {
  url: string;
  ts: number;
}

function getCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as Record<string, CacheEntry> : {};
  } catch {
    return {};
  }
}

function setCache(breed: string, url: string): void {
  const cache = getCache();
  cache[breed] = { url, ts: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full - ignore
  }
}

// =============================================================================
// Main fetch function
// =============================================================================

export async function fetchBreedImageUrl(irk: string): Promise<string | null> {
  const breed = toDogCeoBreed(irk);
  if (!breed) return null;

  // Check cache
  const cache = getCache();
  const cached = cache[breed];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.url;
  }

  try {
    const res = await fetch(
      `https://dog.ceo/api/breed/${breed}/images/random`
    );
    if (!res.ok) return null;
    const data = await res.json() as { status: string; message: string };
    if (data.status === "success" && data.message) {
      setCache(breed, data.message);
      return data.message;
    }
    return null;
  } catch {
    return null;
  }
}
