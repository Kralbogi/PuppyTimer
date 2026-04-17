// =============================================================================
// PawLand - FCM Token Servisi
// Kullanıcının push bildirim iznini alır ve FCM tokenını Firestore'a kaydeder.
// =============================================================================

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, firestore } from "./firebase";
import { kullaniciIdGetir } from "./kullaniciKimlik";

// Firebase projesi konsolundan alınan VAPID key
// (Firebase Console → Project Settings → Cloud Messaging → Web push certificates)
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;

let messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

/**
 * Kullanıcıdan bildirim izni ister ve FCM tokenını Firestore'a kaydeder.
 * Servis çalışanı kayıtlı olmalıdır (main.tsx'de yapılmaktadır).
 */
export async function fcmTokenKaydet(): Promise<string | null> {
  if (!("Notification" in window)) return null;
  if (!VAPID_KEY) {
    console.warn("[FCM] VITE_FCM_VAPID_KEY ortam değişkeni tanımlı değil.");
    return null;
  }

  try {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") return null;

    const msg = getMessagingInstance();
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (!token) return null;

    // Tokenı Firestore'a kaydet (kullanıcı ID ile ilişkilendir)
    const kullaniciId = kullaniciIdGetir();
    await setDoc(
      doc(firestore, "fcmTokenlari", kullaniciId),
      {
        token,
        kullaniciId,
        guncellenmeTarihi: Date.now(),
        platform: "web",
      },
      { merge: true }
    );

    return token;
  } catch (err) {
    console.error("[FCM] Token kaydedilemedi:", err);
    return null;
  }
}

/**
 * Ön planda (uygulama açıkken) gelen bildirimleri dinler.
 * Callback ile bildirim içeriğini iletir.
 */
export function onForegroundMessage(
  callback: (payload: { title: string; body: string }) => void
): () => void {
  const msg = getMessagingInstance();
  const unsubscribe = onMessage(msg, (payload) => {
    const title =
      payload.notification?.title ??
      (payload.data as Record<string, string> | undefined)?.title ??
      "PawLand";
    const body =
      payload.notification?.body ??
      (payload.data as Record<string, string> | undefined)?.body ??
      "";
    callback({ title, body });
  });
  return unsubscribe;
}
