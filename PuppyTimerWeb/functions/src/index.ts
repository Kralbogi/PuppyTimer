// =============================================================================
// PawLand Cloud Functions
// Scheduled cleanup for inactive shared dogs
// =============================================================================

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// -----------------------------------------------------------------------------
// Scheduled Cleanup: Runs every 5 minutes
// Marks dogs as inactive if guncellemeTarihi > 3 minutes ago
// -----------------------------------------------------------------------------

export const cleanupInactiveDogs = functions.pubsub
  .schedule("every 5 minutes")
  .timeZone("Europe/Istanbul")
  .onRun(async (context) => {
    const now = Date.now();
    const threeMinutesAgo = now - (3 * 60 * 1000);

    const db = admin.firestore();

    try {
      const snapshot = await db.collection("toplulukKopekleri")
        .where("aktif", "==", true)
        .where("guncellemeTarihi", "<", threeMinutesAgo)
        .get();

      if (snapshot.empty) {
        console.log("No inactive dogs to clean up");
        return null;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { aktif: false });
      });

      await batch.commit();
      console.log(`Successfully cleaned up ${snapshot.size} inactive dogs`);

      return null;
    } catch (error) {
      console.error("Error during cleanup:", error);
      throw error;
    }
  });

// -----------------------------------------------------------------------------
// One-Time Historical Cleanup (Callable Function)
// Run once to clean up existing old shared dogs
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Push Bildirim Gönderici — pushBildirimleri/{id} onCreate tetikleyicisi
// Admin yeni belge ekler → bu fonksiyon fcmTokenlari'den token'ları okur
// ve FCM ile tüm (veya belirli) kullanıcılara gönderir
// -----------------------------------------------------------------------------

export const sendPushBildirimi = functions.firestore
  .document("pushBildirimleri/{bildirimId}")
  .onCreate(async (snap) => {
    const db = admin.firestore();
    const messaging = admin.messaging();
    const bildirim = snap.data();

    if (!bildirim) {
      console.log("Bildirim verisi yok");
      return null;
    }

    const { baslik, govde, url, hedef } = bildirim;

    try {
      let tokenlar: string[] = [];

      if (hedef === "hepsi") {
        const tokenSnap = await db.collection("fcmTokenlari").get();
        tokenlar = tokenSnap.docs
          .map((d) => (d.data().token as string) || "")
          .filter(Boolean);
      } else {
        const tokenDoc = await db.collection("fcmTokenlari").doc(hedef).get();
        if (tokenDoc.exists && tokenDoc.data()?.token) {
          tokenlar = [tokenDoc.data()!.token as string];
        }
      }

      if (tokenlar.length === 0) {
        console.log("Gönderilecek FCM token bulunamadı");
        await snap.ref.update({ durum: "hata", hataMesaji: "Kayıtlı token bulunamadı" });
        return null;
      }

      const BATCH_SIZE = 500;
      let basariliSayisi = 0;

      for (let i = 0; i < tokenlar.length; i += BATCH_SIZE) {
        const batch = tokenlar.slice(i, i + BATCH_SIZE);

        const mesajlar = batch.map((token) => ({
          token,
          notification: { title: baslik, body: govde },
          data: { url: url || "" },
          webpush: {
            notification: {
              title: baslik,
              body: govde,
              icon: "https://pawland3448.web.app/icons/icon-192.png",
            },
            fcmOptions: url ? { link: url } : undefined,
          },
        }));

        const response = await messaging.sendEach(mesajlar);
        basariliSayisi += response.successCount;

        // Geçersiz token'ları temizle
        const gecersizTokenlar: string[] = [];
        response.responses.forEach((r, idx) => {
          if (!r.success) {
            const code = r.error?.code;
            if (
              code === "messaging/invalid-registration-token" ||
              code === "messaging/registration-token-not-registered"
            ) {
              gecersizTokenlar.push(batch[idx]);
            }
          }
        });

        if (gecersizTokenlar.length > 0) {
          const temizBatch = db.batch();
          for (const token of gecersizTokenlar) {
            const q = await db.collection("fcmTokenlari").where("token", "==", token).get();
            q.docs.forEach((d) => temizBatch.delete(d.ref));
          }
          await temizBatch.commit();
          console.log(`${gecersizTokenlar.length} geçersiz token temizlendi`);
        }
      }

      console.log(`Push gönderildi: ${basariliSayisi}/${tokenlar.length}`);

      await snap.ref.update({
        durum: "gonderildi",
        gonderilenSayisi: basariliSayisi,
        toplamToken: tokenlar.length,
        gonderimTarihi: Date.now(),
      });

      return null;
    } catch (error) {
      console.error("Push bildirim hatası:", error);
      await snap.ref.update({
        durum: "hata",
        hataMesaji: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return null;
    }
  });

export const cleanupOldSharedDogs = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to run cleanup"
    );
  }

  const db = admin.firestore();
  const now = Date.now();
  const threeMinutesAgo = now - (3 * 60 * 1000);

  try {
    const snapshot = await db.collection("toplulukKopekleri")
      .where("aktif", "==", true)
      .get();

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.guncellemeTarihi < threeMinutesAgo) {
        batch.update(doc.ref, { aktif: false });
        count++;
      }
    });

    await batch.commit();

    return {
      success: true,
      cleaned: count,
      message: `Successfully cleaned up ${count} old shared dogs`
    };
  } catch (error) {
    console.error("Error during historical cleanup:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to cleanup old dogs",
      error
    );
  }
});
