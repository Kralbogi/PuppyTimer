// =============================================================================
// PawLand - AI Analiz Servisi
// Artık doğrudan Anthropic API'ye değil, kendi Firebase Cloud Function'ımıza
// bağlanıyor. API anahtarı sunucu tarafında güvenle saklanıyor.
// Yalnızca Premium kullanıcılar bu servisi kullanabilir.
// =============================================================================

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

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
// Firebase Functions referansı
// -----------------------------------------------------------------------------
const functions = getFunctions(app, "us-central1");
const analyzeAI = httpsCallable<
  { imageBase64: string; mediaType: string; analysisType: "dog" | "stool" },
  { result: unknown }
>(functions, "analyzeAI");

// -----------------------------------------------------------------------------
// Köpek Foto Analizi (Premium)
// -----------------------------------------------------------------------------
export async function kopekFotoAnalizEt(
  fotoBase64: string,
  mediaType: string
): Promise<KopekAnalizi> {
  try {
    const response = await analyzeAI({
      imageBase64: fotoBase64,
      mediaType,
      analysisType: "dog",
    });
    return response.data.result as KopekAnalizi;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("permission-denied")) {
      throw new ClaudeAPIHatasi(
        "Bu özellik yalnızca Premium üyelere özeldir. Planınızı yükseltin."
      );
    }
    if (msg.includes("unauthenticated")) {
      throw new ClaudeAPIHatasi("Bu özelliği kullanmak için giriş yapmalısınız.");
    }
    if (msg.includes("not-found") || msg.includes("UNAVAILABLE") || msg.includes("internal")) {
      throw new ClaudeAPIHatasi(
        "AI analizi şu an bakımda. Yakında aktif olacak."
      );
    }
    throw new ClaudeAPIHatasi(`AI analizi başarısız: ${msg}`);
  }
}

// -----------------------------------------------------------------------------
// Dışkı Foto Analizi (Premium)
// -----------------------------------------------------------------------------
export async function diskiAnalizEt(
  fotoBase64: string,
  mediaType: string
): Promise<DiskiAnalizi> {
  try {
    const response = await analyzeAI({
      imageBase64: fotoBase64,
      mediaType,
      analysisType: "stool",
    });
    return response.data.result as DiskiAnalizi;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("permission-denied")) {
      throw new ClaudeAPIHatasi(
        "Bu özellik yalnızca Premium üyelere özeldir. Planınızı yükseltin."
      );
    }
    if (msg.includes("unauthenticated")) {
      throw new ClaudeAPIHatasi("Bu özelliği kullanmak için giriş yapmalısınız.");
    }
    if (msg.includes("not-found") || msg.includes("UNAVAILABLE") || msg.includes("internal")) {
      throw new ClaudeAPIHatasi(
        "AI analizi şu an bakımda. Yakında aktif olacak."
      );
    }
    throw new ClaudeAPIHatasi(`AI analizi başarısız: ${msg}`);
  }
}
