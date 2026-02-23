// =============================================================================
// PuppyTimer Web - Claude API Servisi
// ClaudeAPIServisi.swift portu (fetch API ile)
// =============================================================================

import { getir as apiAnahtariGetir } from "./apiKeyStorage";

// -----------------------------------------------------------------------------
// Tipler
// -----------------------------------------------------------------------------
export interface KopekAnalizi {
  irk: string;
  renk: string;
  boyut: string;
  kulakTipi: string;
  genel: string;
}

export interface DiskiAnalizi {
  durum: string;
  aciklama: string;
  oneriler: string[];
  uyariMi: boolean;
}

export class ClaudeAPIHatasi extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeAPIHatasi";
  }
}

// -----------------------------------------------------------------------------
// Yapilandirma
// -----------------------------------------------------------------------------
const DEFAULT_BASE_URL = "https://api.anthropic.com";
const MODEL = "claude-sonnet-4-5-20250929";
const API_VERSION = "2023-06-01";
const MAX_TOKENS = 1024;

let baseUrl = DEFAULT_BASE_URL;

/**
 * Base URL'i degistir (CORS proxy kullanimi icin).
 * Ornek: setBaseUrl("https://my-cors-proxy.example.com")
 */
export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, ""); // Sondaki slash'leri kaldir
}

/**
 * Mevcut base URL'i dondur.
 */
export function getBaseUrl(): string {
  return baseUrl;
}

// -----------------------------------------------------------------------------
// Kopek Foto Analizi
// -----------------------------------------------------------------------------
export async function kopekFotoAnalizEt(
  fotoBase64: string,
  mediaType: string
): Promise<KopekAnalizi> {
  const mesajlar = [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: fotoBase64,
          },
        },
        {
          type: "text",
          text: `Bu köpek fotoğrafını analiz et. Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{
    "irk": "köpek ırkı (örn: Golden Retriever, Labrador, Karışık)",
    "renk": "tüy rengi (örn: sarı, siyah, beyaz, kahverengi)",
    "boyut": "küçük/orta/büyük",
    "kulakTipi": "dik/sarkık/yarı-dik",
    "genel": "köpek hakkında kısa bir Türkçe açıklama (1-2 cümle)"
}`,
        },
      ],
    },
  ];

  const yanit = await istekGonder(mesajlar);
  return yanitParsele<KopekAnalizi>(yanit);
}

// -----------------------------------------------------------------------------
// Diski Foto Analizi
// -----------------------------------------------------------------------------
export async function diskiAnalizEt(
  fotoBase64: string,
  mediaType: string
): Promise<DiskiAnalizi> {
  const mesajlar = [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: fotoBase64,
          },
        },
        {
          type: "text",
          text: `Bu bir köpek dışkısı fotoğrafıdır. Veteriner sağlık perspektifinden analiz et.
Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{
    "durum": "normal/dikkat/acil",
    "aciklama": "Dışkının durumu hakkında Türkçe açıklama (2-3 cümle)",
    "oneriler": ["öneri 1", "öneri 2"],
    "uyariMi": true/false
}

Dikkat edilecekler:
- Renk anormallikleri (kırmızı, siyah, yeşil = uyarı)
- Kıvam (çok sulu veya çok sert = dikkat)
- Parazit, mukus veya yabancı cisim belirtileri
- Normal ise bunu belirt ve "uyariMi": false yap`,
        },
      ],
    },
  ];

  const yanit = await istekGonder(mesajlar);
  return yanitParsele<DiskiAnalizi>(yanit);
}

// -----------------------------------------------------------------------------
// HTTP istek gonderici
// -----------------------------------------------------------------------------
interface ClaudeMessage {
  role: string;
  content: unknown;
}

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { type: string; message: string };
}

async function istekGonder(
  mesajlar: ClaudeMessage[]
): Promise<ClaudeResponse> {
  const apiKey = apiAnahtariGetir();
  if (!apiKey) {
    throw new ClaudeAPIHatasi(
      "Claude API anahtarı bulunamadı. Ayarlar'dan ekleyin."
    );
  }

  const url = `${baseUrl}/v1/messages`;

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: mesajlar,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000), // 60 saniye timeout
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ClaudeAPIHatasi("İstek zaman aşımına uğradı (60 saniye).");
    }
    throw new ClaudeAPIHatasi(
      `Ağ hatası: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  if (!response.ok) {
    let hataMetni: string;
    try {
      hataMetni = await response.text();
    } catch {
      hataMetni = "Bilinmeyen hata";
    }
    throw new ClaudeAPIHatasi(
      `HTTP ${response.status}: ${hataMetni}`
    );
  }

  let json: ClaudeResponse;
  try {
    json = (await response.json()) as ClaudeResponse;
  } catch {
    throw new ClaudeAPIHatasi("API yanıtı JSON olarak işlenemedi.");
  }

  return json;
}

// -----------------------------------------------------------------------------
// Yanit parse edici
// -----------------------------------------------------------------------------
function yanitParsele<T>(json: ClaudeResponse): T {
  if (!json.content || json.content.length === 0) {
    throw new ClaudeAPIHatasi("API yanıtında içerik bulunamadı.");
  }

  const ilkBlok = json.content[0];
  if (!ilkBlok.text) {
    throw new ClaudeAPIHatasi("API yanıtında metin bulunamadı.");
  }

  const temizMetin = jsonCikar(ilkBlok.text);

  try {
    return JSON.parse(temizMetin) as T;
  } catch {
    throw new ClaudeAPIHatasi(
      `JSON parse hatası. Ham yanıt: ${ilkBlok.text.substring(0, 200)}`
    );
  }
}

// -----------------------------------------------------------------------------
// JSON cikarici - Markdown kod bloklari icinden JSON'u cikarir
// ```json ... ``` veya ``` ... ``` bloklari desteklenir
// -----------------------------------------------------------------------------
function jsonCikar(metin: string): string {
  let temiz = metin.trim();

  // ```json ... ``` blogu varsa cikar
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const jsonMatch = temiz.match(jsonBlockRegex);
  if (jsonMatch) {
    temiz = jsonMatch[1].trim();
    return temiz;
  }

  // ``` ... ``` blogu varsa cikar
  const codeBlockRegex = /```\s*([\s\S]*?)```/;
  const codeMatch = temiz.match(codeBlockRegex);
  if (codeMatch) {
    temiz = codeMatch[1].trim();
    return temiz;
  }

  // { ile baslamiyor ama icinde { varsa, ilk {'den itibaren al
  if (!temiz.startsWith("{")) {
    const braceIdx = temiz.indexOf("{");
    if (braceIdx !== -1) {
      temiz = temiz.substring(braceIdx);
    }
  }

  return temiz.trim();
}
