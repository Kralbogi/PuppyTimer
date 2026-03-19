// =============================================================================
// PawLand - Kopek Senkronizasyon Servisi
// IndexedDB <-> Firestore senkronizasyonu
// =============================================================================

import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { firestore } from "./firebase";
import { db } from "../db/database";
import { kullaniciIdGetir } from "./kullaniciKimlik";
import type { Kopek } from "../types/models";

// Firestore'dan tum kopekleri yukle ve IndexedDB'ye kaydet
export async function kopekleriFirestoreDanYukle(): Promise<void> {
  try {
    const kullaniciId = kullaniciIdGetir();
    const kopeklerRef = collection(firestore, `kullaniciKopekleri/${kullaniciId}/kopekler`);
    const snapshot = await getDocs(kopeklerRef);

    console.log(`Firestore'dan ${snapshot.size} kopek bulundu`);

    // Firestore'dan veri geldiyse senkronize et
    if (snapshot.size > 0) {
      // Mevcut yerel kopeklerin ID'lerini al
      const mevcutKopekler = await db.kopekler.toArray();
      const mevcutIdler = new Set(mevcutKopekler.map(k => k.id));
      const firestoreIdler = new Set<number>();

      // Firestore'dan gelen kopekleri ekle/guncelle
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        firestoreIdler.add(data.id);

        // Mevcut kopegi guncelle veya yeni ekle
        if (mevcutIdler.has(data.id)) {
          // Sadece metadata'yi güncelle, fotoData ve avatarData'yı koru
          const mevcutKopek = await db.kopekler.get(data.id);
          await db.kopekler.put({
            ...mevcutKopek,
            id: data.id,
            ad: data.ad,
            irk: data.irk,
            cinsiyet: data.cinsiyet,
            dogumTarihi: data.dogumTarihi,
            agirlik: data.agirlik,
            kisir: data.kisir,
            kisilikEtiketleri: data.kisilikEtiketleri,
            renkler: data.renkler,
            aksesuarlar: data.aksesuarlar,
            cerceveTipi: data.cerceveTipi,
            mesajRengi: data.mesajRengi,
            puan: data.puan,
            toplamBegeniler: data.toplamBegeniler,
            olusturmaTarihi: data.olusturmaTarihi ?? Date.now(),
          } as Kopek);
        } else {
          // Yeni köpek - fotoData ve avatarData olmadan ekle
          await db.kopekler.add({
            id: data.id,
            ad: data.ad,
            irk: data.irk,
            cinsiyet: data.cinsiyet,
            dogumTarihi: data.dogumTarihi,
            agirlik: data.agirlik,
            kisir: data.kisir,
            kisilikEtiketleri: data.kisilikEtiketleri,
            renkler: data.renkler,
            aksesuarlar: data.aksesuarlar,
            cerceveTipi: data.cerceveTipi,
            mesajRengi: data.mesajRengi,
            puan: data.puan,
            toplamBegeniler: data.toplamBegeniler,
            olusturmaTarihi: data.olusturmaTarihi ?? Date.now(),
          } as Kopek);
        }
      }

      // Firestore'da olmayan ama yerel'de olan kopekleri sil
      // (baska cihazdan silinmis olabilir)
      for (const mevcutId of mevcutIdler) {
        if (mevcutId && !firestoreIdler.has(mevcutId)) {
          await db.kopekler.delete(mevcutId);
          console.log(`Yerel kopek silindi (Firestore'da yok): ${mevcutId}`);
        }
      }

      console.log(`${snapshot.size} kopek senkronize edildi`);
    } else {
      // Firestore'da kopek yok ama yerel'de varsa, onlari Firestore'a yukle
      const yerelKopekler = await db.kopekler.toArray();
      if (yerelKopekler.length > 0) {
        console.log(`${yerelKopekler.length} yerel kopek Firestore'a yukleniyor...`);
        for (const kopek of yerelKopekler) {
          if (kopek.id) {
            await kopekFirestoreKaydet(kopek);
          }
        }
        console.log(`Yerel kopekler Firestore'a yuklendi`);
      } else {
        console.log(`ℹ Hic kopek bulunamadi (ne Firestore'da ne yerel'de)`);
      }
    }
  } catch (error) {
    console.error(" Kopekler yuklenemedi:", error);
    // Hata olsa bile yerel verileri KORUMAK icin throw yapma
    console.log("Firestore senkronizasyonu basarisiz, yerel veriler korunuyor");
  }
}

// Bir kopegi Firestore'a kaydet
export async function kopekFirestoreKaydet(kopek: Kopek): Promise<void> {
  try {
    const kullaniciId = kullaniciIdGetir();
    const kopekRef = doc(firestore, `kullaniciKopekleri/${kullaniciId}/kopekler/${kopek.id}`);

    // NOT: fotoData ve avatarData Firestore'a kaydedilmez (1MB limit)
    // Bunlar sadece IndexedDB'de saklanir
    const firestoreData = {
      id: kopek.id,
      ad: kopek.ad,
      irk: kopek.irk,
      cinsiyet: kopek.cinsiyet,
      dogumTarihi: kopek.dogumTarihi,
      agirlik: kopek.agirlik ?? null,
      kisir: kopek.kisir ?? false,
      kisilikEtiketleri: kopek.kisilikEtiketleri ?? [],
      renkler: kopek.renkler ?? null,
      aksesuarlar: kopek.aksesuarlar ?? [],
      cerceveTipi: kopek.cerceveTipi ?? null,
      mesajRengi: kopek.mesajRengi ?? null,
      puan: kopek.puan ?? 0,
      toplamBegeniler: kopek.toplamBegeniler ?? 0,
      olusturmaTarihi: kopek.olusturmaTarihi ?? Date.now(),
      guncellemeTarihi: Date.now(),
    };

    // Debug: Gönderilen veri boyutunu log'la
    const dataSize = JSON.stringify(firestoreData).length;
    console.log(`Firestore'a gönderilecek veri boyutu: ${dataSize} bytes`);

    if (dataSize > 900000) { // 900KB'den büyükse uyar
      console.warn(` Veri boyutu çok büyük! (${dataSize} bytes)`);
    }

    await setDoc(kopekRef, firestoreData);

    console.log(`Kopek Firestore'a kaydedildi: ${kopek.ad}`);
  } catch (error) {
    console.error(" Kopek kaydedilemedi:", error);
    throw error;
  }
}

// Bir kopegi Firestore'dan sil
export async function kopekFirestoreSil(kopekId: number): Promise<void> {
  try {
    const kullaniciId = kullaniciIdGetir();
    const kopekRef = doc(firestore, `kullaniciKopekleri/${kullaniciId}/kopekler/${kopekId}`);
    await deleteDoc(kopekRef);
    console.log(`Kopek Firestore'dan silindi: ${kopekId}`);
  } catch (error) {
    console.error(" Kopek silinemedi:", error);
    throw error;
  }
}

// Tum kopekleri IndexedDB'den Firestore'a senkronize et (ilk yuklemede)
export async function tumKopekleriSenkronizeEt(): Promise<void> {
  try {
    const kopekler = await db.kopekler.toArray();

    for (const kopek of kopekler) {
      if (kopek.id) {
        await kopekFirestoreKaydet(kopek);
      }
    }

    console.log(`${kopekler.length} kopek Firestore'a senkronize edildi`);
  } catch (error) {
    console.error(" Senkronizasyon hatasi:", error);
    throw error;
  }
}

// Firestore'daki degisiklikleri dinle ve IndexedDB'yi guncelle
export function firestoreDegisiklikleriniDinle(callback?: () => void): () => void {
  try {
    const kullaniciId = kullaniciIdGetir();
    const kopeklerRef = collection(firestore, `kullaniciKopekleri/${kullaniciId}/kopekler`);
    const q = query(kopeklerRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();

        if (change.type === "added" || change.type === "modified") {
          // IndexedDB'de var mi kontrol et
          const existing = await db.kopekler.get(data.id);
          if (existing) {
            // Sadece metadata'yi güncelle, fotoData ve avatarData'yı koru
            await db.kopekler.update(data.id, {
              ad: data.ad,
              irk: data.irk,
              cinsiyet: data.cinsiyet,
              dogumTarihi: data.dogumTarihi,
              agirlik: data.agirlik,
              kisir: data.kisir,
              kisilikEtiketleri: data.kisilikEtiketleri,
              renkler: data.renkler,
              aksesuarlar: data.aksesuarlar,
              cerceveTipi: data.cerceveTipi,
              mesajRengi: data.mesajRengi,
              puan: data.puan,
              toplamBegeniler: data.toplamBegeniler,
              olusturmaTarihi: data.olusturmaTarihi,
            });
          } else {
            // Yeni köpek - fotoData ve avatarData olmadan ekle
            await db.kopekler.add({
              id: data.id,
              ad: data.ad,
              irk: data.irk,
              cinsiyet: data.cinsiyet,
              dogumTarihi: data.dogumTarihi,
              agirlik: data.agirlik,
              kisir: data.kisir,
              kisilikEtiketleri: data.kisilikEtiketleri,
              renkler: data.renkler,
              aksesuarlar: data.aksesuarlar,
              cerceveTipi: data.cerceveTipi,
              mesajRengi: data.mesajRengi,
              puan: data.puan,
              toplamBegeniler: data.toplamBegeniler,
              olusturmaTarihi: data.olusturmaTarihi ?? Date.now(),
            } as Kopek);
          }
        } else if (change.type === "removed") {
          await db.kopekler.delete(data.id);
        }
      }

      if (callback) callback();
    });

    return unsubscribe;
  } catch (error) {
    console.error(" Firestore dinleme hatasi:", error);
    return () => {};
  }
}
