// =============================================================================
// PawLand — Firebase Cloud Functions
// 1. analyzeAI      — Claude AI proxy (premium kullanıcılara özel)
// 2. sendPush       — Firestore trigger: push bildirim gönder
// 3. createCheckout — Stripe ödeme oturumu oluştur
// 4. stripeWebhook  — Stripe webhook: ödeme tamamlandığında premium ver
// =============================================================================

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import Stripe from "stripe";

// Import validation, error handling, and rate limiting utilities
import {
  validateString,
  validateEmail,
  validateUID,
  validateBase64,
  validateMediaType,
  validateEnum,
  validateUrl,
} from "./validation";
import {
  authError,
  permissionError,
  validationError,
  serverError,
  serializeError,
} from "./errors";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "./rateLimiter";

admin.initializeApp();
const db = admin.firestore();

// ── Gizli anahtarlar (firebase functions:secrets:set ile yükle) ───────────────
const ANTHROPIC_KEY = defineSecret("ANTHROPIC_API_KEY");
const STRIPE_SECRET = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK = defineSecret("STRIPE_WEBHOOK_SECRET");

// =============================================================================
// 1. analyzeAI — Claude API proxy
//    Premium kullanıcı kontrolü sunucu tarafında yapılır.
//    İstemci API anahtarı görmez.
// =============================================================================
export const analyzeAI = onCall(
  { secrets: [ANTHROPIC_KEY], cors: true },
  async (request) => {
    try {
      // Verify authentication
      const uid = request.auth?.uid;
      if (!uid) throw authError("Giriş yapmalısınız.");

      // Enforce rate limit (10 requests per hour)
      await enforceRateLimit(uid, "ai_analysis", RATE_LIMITS.AI_ANALYSIS);

      // Validate input parameters
      const imageBase64 = validateBase64(
        request.data?.imageBase64,
        "imageBase64"
      );
      const mediaType = validateMediaType(request.data?.mediaType);
      const analysisType = validateEnum(
        request.data?.analysisType,
        "analysisType",
        ["dog", "stool"] as const
      );

      // Premium kontrolü
      const premiumDoc = await db
        .collection("premiumKullanicilar")
        .doc(uid)
        .get();
      const premiumData = premiumDoc.data();
      const isPremium =
        premiumData?.premium === true &&
        premiumData?.aktif === true &&
        (!premiumData?.bitisTarihi || premiumData.bitisTarihi > Date.now());

      if (!isPremium) {
        throw permissionError(
          "Bu özellik yalnızca Premium üyelere özeldir."
        );
      }

    const client = new Anthropic({ apiKey: ANTHROPIC_KEY.value() });

    const prompt =
      analysisType === "dog"
        ? `Bu köpek fotoğrafını analiz et. Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{"irk":"köpek ırkı","renk":"tüy rengi","boyut":"küçük/orta/büyük","kulakTipi":"dik/sarkık/yarı-dik","genel":"kısa Türkçe açıklama"}`
        : `Bu bir köpek dışkısı fotoğrafıdır. Veteriner perspektifinden analiz et.
Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{"durum":"normal/dikkat/acil","aciklama":"Türkçe açıklama","oneriler":["öneri1","öneri2"],"uyariMi":false}`;

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new HttpsError("internal", "AI yanıtı alınamadı.");
    }

    // JSON bloğunu çıkar
    let raw = textBlock.text.trim();
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) raw = jsonMatch[1].trim();
    if (!raw.startsWith("{")) {
      const idx = raw.indexOf("{");
      if (idx !== -1) raw = raw.substring(idx);
    }

    try {
      return { result: JSON.parse(raw) };
    } catch {
      throw new HttpsError("internal", `JSON parse hatası: ${raw.slice(0, 200)}`);
    }
  }
);

// =============================================================================
// 2. sendPush — Firestore trigger: "pushBildirimleri" koleksiyonuna belge
//    eklendiğinde FCM ile push bildirim gönder
// =============================================================================
export const sendPush = onDocumentCreated(
  "pushBildirimleri/{docId}",
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) {
        console.warn("sendPush: No data found in event");
        return;
      }

      // Validate required fields
      const baslik = validateString(data.baslik, "baslik", 1, 200);
      const govde = validateString(data.govde, "govde", 1, 500);
      const hedef = validateString(data.hedef, "hedef", 1, 100);
      const url = data.url ? validateUrl(data.url) : undefined;

      const docRef = event.data!.ref;

      let tokens: string[] = [];

      if (hedef === "hepsi") {
        // Tüm kayıtlı FCM tokenları al
        const snapshot = await db.collection("fcmTokenlari").get();
        tokens = snapshot.docs
          .map((d) => d.data().token as string)
          .filter((token): token is string => typeof token === "string" && token.length > 0);
      } else {
        // Belirli kullanıcının tokenını al
        const tokenDoc = await db.collection("fcmTokenlari").doc(hedef).get();
        if (tokenDoc.exists && tokenDoc.data()?.token) {
          tokens = [tokenDoc.data()!.token as string];
        }
      }

      if (tokens.length === 0) {
        await docRef.update({ durum: "hata", hata: "Token bulunamadı." });
        return;
      }

      // 500'lük batch'ler halinde gönder (FCM limiti)
      let gonderilenSayisi = 0;
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: baslik, body: govde },
          data: url ? { url } : {},
          webpush: url
            ? { fcmOptions: { link: url } }
            : undefined,
        });
        gonderilenSayisi += response.successCount;

        // Geçersiz tokenları temizle
        response.responses.forEach((res, idx) => {
          if (
            !res.success &&
            (res.error?.code === "messaging/invalid-registration-token" ||
              res.error?.code === "messaging/registration-token-not-registered")
          ) {
            db.collection("fcmTokenlari").doc(batch[idx]).delete().catch(() => {});
          }
        });
      }

      await docRef.update({
        durum: "gonderildi",
        gonderilenSayisi,
        toplamToken: tokens.length,
      });
    } catch (error) {
      console.error("sendPush error:", serializeError(error));
      const docRef = event.data!.ref;
      await docRef.update({
        durum: "hata",
        hata: error instanceof Error ? error.message : String(error),
      }).catch(() => {});
    }
  }
);
          tokens = [tokenDoc.data()!.token as string];
        }
      }

      if (tokens.length === 0) {
        await docRef.update({ durum: "hata", hata: "Token bulunamadı." });
        return;
      }

      // 500'lük batch'ler halinde gönder (FCM limiti)
      let gonderilenSayisi = 0;
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: baslik, body: govde },
          data: url ? { url } : {},
          webpush: url
            ? { fcmOptions: { link: url } }
            : undefined,
        });
        gonderilenSayisi += response.successCount;

        // Geçersiz tokenları temizle
        response.responses.forEach((res, idx) => {
          if (
            !res.success &&
            (res.error?.code === "messaging/invalid-registration-token" ||
              res.error?.code === "messaging/registration-token-not-registered")
          ) {
            db.collection("fcmTokenlari").doc(batch[idx]).delete().catch(() => {});
          }
        });
      }

      await docRef.update({
        durum: "gonderildi",
        gonderilenSayisi,
        toplamToken: tokens.length,
      });
    } catch (err) {
      await docRef.update({
        durum: "hata",
        hata: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

// =============================================================================
// 3. createCheckout — Stripe ödeme oturumu oluştur
// =============================================================================
export const createCheckout = onCall(
  { secrets: [STRIPE_SECRET], cors: true },
  async (request) => {
    try {
      const uid = request.auth?.uid;
      if (!uid) throw authError("Giriş yapmalısınız.");

      // Enforce rate limit (5 checkout attempts per day)
      await enforceRateLimit(uid, "checkout", RATE_LIMITS.CHECKOUT);

      // Validate input parameters
      const priceId = validateString(request.data?.priceId, "priceId", 1, 100);
      const successUrl = validateUrl(request.data?.successUrl);
      const cancelUrl = validateUrl(request.data?.cancelUrl);

      const stripe = new Stripe(STRIPE_SECRET.value());

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: priceId.includes("monthly") || priceId.includes("yearly")
          ? "subscription"
          : "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { uid },
      });

      if (!session.id || !session.url) {
        throw serverError("Checkout session creation failed");
      }

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("createCheckout error:", serializeError(error));
      throw serverError("Failed to create checkout session");
    }
  }
);

// =============================================================================
// 4. stripeWebhook — Ödeme tamamlandığında premium ver
// =============================================================================
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET, STRIPE_WEBHOOK] },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET.value());
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      res.status(400).send("Signature eksik.");
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK.value()
      );
    } catch (err) {
      res.status(400).send(`Webhook hatası: ${err}`);
      return;
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "payment_intent.succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      if (!uid) {
        res.status(400).send("UID bulunamadı.");
        return;
      }

      // Abonelik türünü belirle
      let tur: "lifetime" | "monthly" | "yearly" = "lifetime";
      if (session.mode === "subscription") {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );
        const priceId = lineItems.data[0]?.price?.id || "";
        if (priceId.includes("monthly")) tur = "monthly";
        else if (priceId.includes("yearly")) tur = "yearly";
      }

      // Premium ver
      const bitisTarihi =
        tur === "monthly"
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : tur === "yearly"
          ? Date.now() + 365 * 24 * 60 * 60 * 1000
          : undefined;

      const premiumData: Record<string, unknown> = {
        id: uid,
        premium: true,
        baslangicTarihi: Date.now(),
        odemeTuru: tur,
        aktif: true,
        stripeSessionId: session.id,
      };
      if (bitisTarihi) premiumData.bitisTarihi = bitisTarihi;

      await db.collection("premiumKullanicilar").doc(uid).set(premiumData);
    }

    res.json({ received: true });
  }
);

// =============================================================================
// 5. hatirlaticiKontrol — Her dakika çalışır, vadesi gelen hatırlatıcılara FCM push gönderir
// =============================================================================
export const hatirlaticiKontrol = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Europe/Istanbul" },
  async () => {
    const simdi = new Date();
    const saat = `${String(simdi.getHours()).padStart(2, "0")}:${String(simdi.getMinutes()).padStart(2, "0")}`;
    // JS: 0=Pazar → bizim: 6=Pazar; JS:1=Pzt → bizim: 0=Pzt
    const jsDay = simdi.getDay();
    const gun = jsDay === 0 ? 6 : jsDay - 1;

    const snapshot = await db.collection("hatirlaticilar").get();

    for (const kullaniciDoc of snapshot.docs) {
      const userId = kullaniciDoc.id;
      const liste = (kullaniciDoc.data().liste ?? []) as Array<{
        id: string;
        baslik: string;
        tur: string;
        saat: string;
        gunler: number[];
        aktif: boolean;
      }>;

      for (const h of liste) {
        if (!h.aktif) continue;
        if (h.saat !== saat) continue;
        if (!h.gunler.includes(gun)) continue;

        // Bugün bu alarm zaten gönderildi mi?
        const firedKey = `${simdi.toDateString()}_${h.id}`;
        const firedDoc = await db
          .collection("hatirlaticiGonderildi")
          .doc(`${userId}_${firedKey}`)
          .get();
        if (firedDoc.exists) continue;

        // FCM tokenı al
        const tokenDoc = await db.collection("fcmTokenlari").doc(userId).get();
        const token = tokenDoc.data()?.token as string | undefined;
        if (!token) continue;

        // Push gönder
        const TUR_EMOJI: Record<string, string> = {
          beslenme: "🍖", yuruyus: "🦮", ilac: "💊", asi: "💉",
          bakim: "✂️", veteriner: "🏥", diger: "🔔",
        };

        try {
          await admin.messaging().send({
            token,
            notification: {
              title: `${TUR_EMOJI[h.tur] ?? "🔔"} ${h.baslik}`,
              body: "PawLand hatırlatıcısı",
            },
            webpush: {
              notification: {
                icon: "https://pawland3448.web.app/icons/icon-192.png",
                badge: "https://pawland3448.web.app/icons/icon-192.png",
                vibrate: [100, 50, 100],
              },
              fcmOptions: { link: "https://pawland3448.web.app" },
            },
          });

          // Gönderildi olarak işaretle (24 saat sonra temizlenmesi için TTL)
          await db
            .collection("hatirlaticiGonderildi")
            .doc(`${userId}_${firedKey}`)
            .set({ gonderildiAt: admin.firestore.FieldValue.serverTimestamp() });
        } catch (err) {
          console.error(`[hatirlaticiKontrol] Push gönderilemedi ${userId}:`, err);
          // Geçersiz token ise sil
          if ((err as { code?: string }).code === "messaging/registration-token-not-registered") {
            await db.collection("fcmTokenlari").doc(userId).delete();
          }
        }
      }
    }
  }
);
