"use strict";
// =============================================================================
// PawLand — Firebase Cloud Functions
// 1. analyzeAI      — Claude AI proxy (premium kullanıcılara özel)
// 2. sendPush       — Firestore trigger: push bildirim gönder
// 3. createCheckout — Stripe ödeme oturumu oluştur
// 4. stripeWebhook  — Stripe webhook: ödeme tamamlandığında premium ver
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.hatirlaticiKontrol = exports.stripeWebhook = exports.createCheckout = exports.sendPush = exports.analyzeAI = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const sdk_1 = require("@anthropic-ai/sdk");
const stripe_1 = require("stripe");
admin.initializeApp();
const db = admin.firestore();
// ── Gizli anahtarlar (firebase functions:secrets:set ile yükle) ───────────────
const ANTHROPIC_KEY = (0, params_1.defineSecret)("ANTHROPIC_API_KEY");
const STRIPE_SECRET = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK = (0, params_1.defineSecret)("STRIPE_WEBHOOK_SECRET");
// =============================================================================
// 1. analyzeAI — Claude API proxy
//    Premium kullanıcı kontrolü sunucu tarafında yapılır.
//    İstemci API anahtarı görmez.
// =============================================================================
exports.analyzeAI = (0, https_1.onCall)({ secrets: [ANTHROPIC_KEY], cors: true }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Giriş yapmalısınız.");
    // Premium kontrolü
    const premiumDoc = await db
        .collection("premiumKullanicilar")
        .doc(uid)
        .get();
    const premiumData = premiumDoc.data();
    const isPremium = premiumData?.premium === true &&
        premiumData?.aktif === true &&
        (!premiumData?.bitisTarihi || premiumData.bitisTarihi > Date.now());
    if (!isPremium) {
        throw new https_1.HttpsError("permission-denied", "Bu özellik yalnızca Premium üyelere özeldir.");
    }
    const { imageBase64, mediaType, analysisType } = request.data;
    if (!imageBase64 || !mediaType || !analysisType) {
        throw new https_1.HttpsError("invalid-argument", "Eksik parametre.");
    }
    const client = new sdk_1.default({ apiKey: ANTHROPIC_KEY.value() });
    const prompt = analysisType === "dog"
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
                            media_type: mediaType,
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
        throw new https_1.HttpsError("internal", "AI yanıtı alınamadı.");
    }
    // JSON bloğunu çıkar
    let raw = textBlock.text.trim();
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch)
        raw = jsonMatch[1].trim();
    if (!raw.startsWith("{")) {
        const idx = raw.indexOf("{");
        if (idx !== -1)
            raw = raw.substring(idx);
    }
    try {
        return { result: JSON.parse(raw) };
    }
    catch {
        throw new https_1.HttpsError("internal", `JSON parse hatası: ${raw.slice(0, 200)}`);
    }
});
// =============================================================================
// 2. sendPush — Firestore trigger: "pushBildirimleri" koleksiyonuna belge
//    eklendiğinde FCM ile push bildirim gönder
// =============================================================================
exports.sendPush = (0, firestore_1.onDocumentCreated)("pushBildirimleri/{docId}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const { baslik, govde, hedef, url } = data;
    const docRef = event.data.ref;
    try {
        let tokens = [];
        if (hedef === "hepsi") {
            // Tüm kayıtlı FCM tokenları al
            const snapshot = await db.collection("fcmTokenlari").get();
            tokens = snapshot.docs.map((d) => d.data().token).filter(Boolean);
        }
        else {
            // Belirli kullanıcının tokenını al
            const tokenDoc = await db.collection("fcmTokenlari").doc(hedef).get();
            if (tokenDoc.exists && tokenDoc.data()?.token) {
                tokens = [tokenDoc.data().token];
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
                if (!res.success &&
                    (res.error?.code === "messaging/invalid-registration-token" ||
                        res.error?.code === "messaging/registration-token-not-registered")) {
                    db.collection("fcmTokenlari").doc(batch[idx]).delete().catch(() => { });
                }
            });
        }
        await docRef.update({
            durum: "gonderildi",
            gonderilenSayisi,
            toplamToken: tokens.length,
        });
    }
    catch (err) {
        await docRef.update({
            durum: "hata",
            hata: err instanceof Error ? err.message : String(err),
        });
    }
});
// =============================================================================
// 3. createCheckout — Stripe ödeme oturumu oluştur
// =============================================================================
exports.createCheckout = (0, https_1.onCall)({ secrets: [STRIPE_SECRET], cors: true }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Giriş yapmalısınız.");
    const { priceId, successUrl, cancelUrl } = request.data;
    if (!priceId || !successUrl || !cancelUrl) {
        throw new https_1.HttpsError("invalid-argument", "Eksik parametre.");
    }
    const stripe = new stripe_1.default(STRIPE_SECRET.value());
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
    return { sessionId: session.id, url: session.url };
});
// =============================================================================
// 4. stripeWebhook — Ödeme tamamlandığında premium ver
// =============================================================================
exports.stripeWebhook = (0, https_1.onRequest)({ secrets: [STRIPE_SECRET, STRIPE_WEBHOOK] }, async (req, res) => {
    const stripe = new stripe_1.default(STRIPE_SECRET.value());
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Signature eksik.");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK.value());
    }
    catch (err) {
        res.status(400).send(`Webhook hatası: ${err}`);
        return;
    }
    if (event.type === "checkout.session.completed" ||
        event.type === "payment_intent.succeeded") {
        const session = event.data.object;
        const uid = session.metadata?.uid;
        if (!uid) {
            res.status(400).send("UID bulunamadı.");
            return;
        }
        // Abonelik türünü belirle
        let tur = "lifetime";
        if (session.mode === "subscription") {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const priceId = lineItems.data[0]?.price?.id || "";
            if (priceId.includes("monthly"))
                tur = "monthly";
            else if (priceId.includes("yearly"))
                tur = "yearly";
        }
        // Premium ver
        const bitisTarihi = tur === "monthly"
            ? Date.now() + 30 * 24 * 60 * 60 * 1000
            : tur === "yearly"
                ? Date.now() + 365 * 24 * 60 * 60 * 1000
                : undefined;
        const premiumData = {
            id: uid,
            premium: true,
            baslangicTarihi: Date.now(),
            odemeTuru: tur,
            aktif: true,
            stripeSessionId: session.id,
        };
        if (bitisTarihi)
            premiumData.bitisTarihi = bitisTarihi;
        await db.collection("premiumKullanicilar").doc(uid).set(premiumData);
    }
    res.json({ received: true });
});
// =============================================================================
// 5. hatirlaticiKontrol — Her dakika çalışır, vadesi gelen hatırlatıcılara FCM push gönderir
// =============================================================================
exports.hatirlaticiKontrol = (0, scheduler_1.onSchedule)({ schedule: "every 1 minutes", timeZone: "Europe/Istanbul" }, async () => {
    const simdi = new Date();
    const saat = `${String(simdi.getHours()).padStart(2, "0")}:${String(simdi.getMinutes()).padStart(2, "0")}`;
    // JS: 0=Pazar → bizim: 6=Pazar; JS:1=Pzt → bizim: 0=Pzt
    const jsDay = simdi.getDay();
    const gun = jsDay === 0 ? 6 : jsDay - 1;
    const snapshot = await db.collection("hatirlaticilar").get();
    for (const kullaniciDoc of snapshot.docs) {
        const userId = kullaniciDoc.id;
        const liste = (kullaniciDoc.data().liste ?? []);
        for (const h of liste) {
            if (!h.aktif)
                continue;
            if (h.saat !== saat)
                continue;
            if (!h.gunler.includes(gun))
                continue;
            // Bugün bu alarm zaten gönderildi mi?
            const firedKey = `${simdi.toDateString()}_${h.id}`;
            const firedDoc = await db
                .collection("hatirlaticiGonderildi")
                .doc(`${userId}_${firedKey}`)
                .get();
            if (firedDoc.exists)
                continue;
            // FCM tokenı al
            const tokenDoc = await db.collection("fcmTokenlari").doc(userId).get();
            const token = tokenDoc.data()?.token;
            if (!token)
                continue;
            // Push gönder
            const TUR_EMOJI = {
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
            }
            catch (err) {
                console.error(`[hatirlaticiKontrol] Push gönderilemedi ${userId}:`, err);
                // Geçersiz token ise sil
                if (err.code === "messaging/registration-token-not-registered") {
                    await db.collection("fcmTokenlari").doc(userId).delete();
                }
            }
        }
    }
});
//# sourceMappingURL=index.js.map