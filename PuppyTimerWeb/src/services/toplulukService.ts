// =============================================================================
// PuppyTimer Web - Topluluk Servisi
// Firebase Firestore CRUD islemleri ve canli bolge algilama
// =============================================================================

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { firestore, auth, ensureAuth } from "./firebase";
import type { ToplulukBolge } from "../types/models";
import type { BolgeTuru } from "../types/enums";
import { icerikGecerliMi } from "../utils/validationUtils";
import { toplulukEngelliMi } from "./sikayetService";

const COLLECTION = "toplulukBolgeleri";

// -----------------------------------------------------------------------------
// Gercek zamanli dinleyici
// -----------------------------------------------------------------------------

export function bolgeleriDinle(
  callback: (bolgeler: ToplulukBolge[]) => void
): () => void {
  const q = query(
    collection(firestore, COLLECTION),
    where("aktif", "==", true),
    orderBy("olusturmaTarihi", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const bolgeler: ToplulukBolge[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ToplulukBolge[];
      callback(bolgeler);
    },
    (error) => {
      console.error("Firestore dinleme hatasi:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

// -----------------------------------------------------------------------------
// Bolge Ekle
// -----------------------------------------------------------------------------

export async function bolgeEkle(
  bolge: Omit<ToplulukBolge, "id">
): Promise<string> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }

  // Check if user is community banned (25+ total reports)
  const communityBanned = await toplulukEngelliMi(auth.currentUser.uid);
  if (communityBanned) {
    throw new Error("Topluluk engellisi nedeniyle bölge ekleyemezsiniz. Çok fazla şikayet aldınız.");
  }

  // Validate title
  const baslikValidasyon = icerikGecerliMi(bolge.baslik, true);
  if (!baslikValidasyon.gecerli) {
    throw new Error(baslikValidasyon.hata);
  }

  // Validate description if present
  if (bolge.aciklama) {
    const aciklamaValidasyon = icerikGecerliMi(bolge.aciklama, true);
    if (!aciklamaValidasyon.gecerli) {
      throw new Error(aciklamaValidasyon.hata);
    }
  }

  // olusturanId'yi otomatik ekle
  const veri = {
    ...bolge,
    olusturanId: auth.currentUser.uid,
  };

  const docRef = await addDoc(collection(firestore, COLLECTION), veri);
  return docRef.id;
}

// -----------------------------------------------------------------------------
// Bolge Sil (sadece kendi bolgesini silebilir)
// -----------------------------------------------------------------------------

export async function bolgeSil(bolgeId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await deleteDoc(doc(firestore, COLLECTION, bolgeId));
}

// -----------------------------------------------------------------------------
// Bolge Begen
// -----------------------------------------------------------------------------

export async function bolgeBegen(bolgeId: string): Promise<void> {
  await ensureAuth();
  if (!auth.currentUser) {
    throw new Error("Kimlik dogrulamasi basarisiz");
  }
  await updateDoc(doc(firestore, COLLECTION, bolgeId), {
    begeniler: increment(1),
    guncellemeTarihi: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Haversine uzaklik hesabi (metre)
// -----------------------------------------------------------------------------

function haversineUzaklik(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// -----------------------------------------------------------------------------
// Canli Bolge Algilama
// 200m icinde 3+ ayni tur bolge varsa "canli" olarak isaretler
// -----------------------------------------------------------------------------

export function canliAlgila(bolgeler: ToplulukBolge[]): ToplulukBolge[] {
  const canliSetIds = new Set<string>();

  // Her bolge turune gore grupla
  const turGruplari = new Map<BolgeTuru, ToplulukBolge[]>();
  for (const bolge of bolgeler) {
    const grup = turGruplari.get(bolge.tur) ?? [];
    grup.push(bolge);
    turGruplari.set(bolge.tur, grup);
  }

  // Her grup icinde yakinlik kontrol et
  for (const grup of turGruplari.values()) {
    for (let i = 0; i < grup.length; i++) {
      let yakinSayisi = 0;
      for (let j = 0; j < grup.length; j++) {
        if (i === j) continue;
        const mesafe = haversineUzaklik(
          grup[i].enlem,
          grup[i].boylam,
          grup[j].enlem,
          grup[j].boylam
        );
        if (mesafe <= 200) yakinSayisi++;
      }
      // 2+ yakin komsu = toplam 3+ cluster
      if (yakinSayisi >= 2) {
        canliSetIds.add(grup[i].id);
      }
    }
  }

  return bolgeler.map((b) => ({
    ...b,
    canli: canliSetIds.has(b.id),
  }));
}
