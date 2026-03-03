// =============================================================================
// PuppyTimer Web - SettingsPage (Ayarlar Sayfasi)
// API anahtar yonetimi, uygulama bilgileri
// =============================================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  CheckCircle,
  XCircle,
  Save,
  TestTube2,
  Trash2,
  Loader2,
  Info,
  Shield,
  PawPrint,
  Users,
  LogOut,
  Package,
  ShoppingBag,
  ChevronRight,
  Ban,
  UserX,
  Crown,
  Sparkles,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage, type Language } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  kaydet,
  getir,
  sil,
  anahtarVarMi,
} from "../services/apiKeyStorage";
import {
  kullaniciIdGetir,
  kullaniciAdGetir,
  kullaniciAdiniGuncelle,
  rumuzKontrolEt,
  rumuzNormalize,
} from "../services/kullaniciKimlik";
import { cikisYap, mevcutKullanici } from "../services/authService";
import {
  engellenenKullanicilar,
  kullaniciEngelKaldir,
} from "../services/toplulukChatService";
import { premiumMi, rumuzDegisiklikHakkiKontrol, rumuzDegisiklikSayaciniArtir } from "../services/premiumService";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { firestore } from "../services/firebase";

// =============================================================================
// Main SettingsPage Component
// =============================================================================

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["settings", "common"]);
  const { language, setLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  // -- API Key state
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // -- Community profile state
  const [rumuz, setRumuz] = useState(() => kullaniciAdGetir());
  const kullaniciId = kullaniciIdGetir();
  const [rumuzKaydedildi, setRumuzKaydedildi] = useState(false);
  const [rumuzDurum, setRumuzDurum] = useState<"musait" | "alinmis" | "kendin" | "kontrol" | null>(null);
  const [rumuzHata, setRumuzHata] = useState<string | null>(null);
  const [rumuzKaydediliyor, setRumuzKaydediliyor] = useState(false);

  // -- Blocked users state
  const [engellenenler, setEngellenenler] = useState<
    Array<{ id: string; ad: string }>
  >([]);

  // -- Premium state
  const [isPremium, setIsPremium] = useState(false);

  // -- Check premium status
  useEffect(() => {
    const checkPremium = async () => {
      const premium = await premiumMi();
      setIsPremium(premium);
    };
    checkPremium();
  }, []);

  // -- Check existing key on mount
  useEffect(() => {
    setHasKey(anahtarVarMi());

    // Load blocked users with their names
    const loadEngellenenler = async () => {
      const blockedIds = engellenenKullanicilar();
      const kullaniciListesi: Array<{ id: string; ad: string }> = [];

      for (const userId of blockedIds) {
        try {
          // Find user's latest message to get their name
          const q = query(
            collection(firestore, "toplulukMesajlari"),
            where("gonderenId", "==", userId),
            where("aktif", "==", true),
            limit(1)
          );

          const snapshot = await getDocs(q);
          const ad = snapshot.empty
            ? "Bilinmeyen Kullanıcı"
            : snapshot.docs[0].data().gonderenAd;

          kullaniciListesi.push({ id: userId, ad });
        } catch (error) {
          console.error("Kullanıcı adı alınamadı:", error);
          kullaniciListesi.push({ id: userId, ad: "Bilinmeyen Kullanıcı" });
        }
      }

      setEngellenenler(kullaniciListesi);
    };

    loadEngellenenler();
  }, []);

  // -- Debounced rumuz uniqueness check
  useEffect(() => {
    const normalized = rumuzNormalize(rumuz);
    if (!normalized || normalized.length < 2) {
      setRumuzDurum(null);
      return;
    }
    setRumuzDurum("kontrol");
    const timer = setTimeout(async () => {
      const durum = await rumuzKontrolEt(rumuz);
      setRumuzDurum(durum);
    }, 600);
    return () => clearTimeout(timer);
  }, [rumuz]);

  // ---------------------------------------------------------------------------
  // Save API key
  // ---------------------------------------------------------------------------

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "API anahtari bos olamaz." });
      return;
    }
    kaydet(trimmed);
    setHasKey(true);
    setApiKey("");
    setMessage({ type: "success", text: "API anahtari basariyla kaydedildi." });
  };

  // ---------------------------------------------------------------------------
  // Test API key
  // ---------------------------------------------------------------------------

  const handleTest = async () => {
    const currentKey = getir();
    if (!currentKey) {
      setMessage({
        type: "error",
        text: "Once bir API anahtari kaydedin.",
      });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": currentKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: "Merhaba",
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "API anahtari gecerli! Baglanti basarili.",
        });
      } else {
        const errorText = await response.text().catch(() => "Bilinmeyen hata");
        setMessage({
          type: "error",
          text: `API hatasi (${response.status}): ${errorText.substring(0, 100)}`,
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessage({
          type: "error",
          text: "Istek zaman asimina ugradi (15 saniye).",
        });
      } else {
        setMessage({
          type: "error",
          text: `Baglanti hatasi: ${
            err instanceof Error ? err.message : String(err)
          }`,
        });
      }
    } finally {
      setTesting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete API key
  // ---------------------------------------------------------------------------

  const handleDelete = () => {
    sil();
    setHasKey(false);
    setApiKey("");
    setMessage({ type: "success", text: "API anahtari silindi." });
  };

  // ---------------------------------------------------------------------------
  // Unblock user
  // ---------------------------------------------------------------------------

  const handleEngelKaldir = (kullaniciId: string) => {
    if (
      window.confirm(
        "Bu kullanıcının engelini kaldırmak istediğinize emin misiniz?"
      )
    ) {
      kullaniciEngelKaldir(kullaniciId);
      setEngellenenler((prev) => prev.filter((k) => k.id !== kullaniciId));
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Ayarlar</h1>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* ================================================================ */}
        {/* Premium Section */}
        {/* ================================================================ */}
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <Crown size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Premium Üyelik</h2>
              <p className="text-xs text-gray-600">
                Özel özellikler ve sınırsız erişim
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {isPremium ? (
              // Premium kullanıcı görünümü
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Premium üyesiniz! 🎉
                  </span>
                </div>

                <div className="bg-white/60 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Aktif Özellikler:</p>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Sparkles size={14} className="text-orange-500" />
                      Sınırsız renk değiştirme
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles size={14} className="text-orange-500" />
                      Özel takı ve kıyafetler
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles size={14} className="text-orange-500" />
                      Gelecekteki tüm premium özellikler
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              // Free kullanıcı görünümü - Premium'a geçiş butonu
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Premium üyelikle özel özelliklere erişin ve deneyiminizi geliştirin!
                </p>

                <div className="bg-white/60 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Premium Özellikleri:</p>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-orange-500" />
                      Sınırsız renk değiştirme
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-orange-500" />
                      Özel 3D aksesuar ve kıyafetler
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-orange-500" />
                      Özel tema ve renkler
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown size={14} className="text-orange-500" />
                      Gelecekteki tüm premium özellikler
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => alert("Premium satın alma yakında eklenecek! Şimdilik admin panelinden premium verilebilir.")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Crown size={18} />
                  Premium'a Geç
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Test aşamasında admin panelinden premium verilmektedir
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* Language & Region Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {t("settings:language.title")}
              </h2>
              <p className="text-xs text-gray-500">
                {t("settings:language.description")}
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings:language.label")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white appearance-none"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="pt">🇵🇹 Português</option>
              <option value="ar">🇸🇦 العربية</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              {t("settings:language.changed")}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Dark Mode Section */}
        {/* ================================================================ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              {isDark ? (
                <Moon size={20} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Sun size={20} className="text-indigo-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Tema
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Koyu veya açık tema seçin
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-indigo-600"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDark ? '🌙 Koyu tema aktif' : '☀️ Açık tema aktif'}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Claude API Section */}
        {/* ================================================================ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Key size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Claude API</h2>
              <p className="text-xs text-gray-500">
                Yapay zeka analizi icin API anahtari
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Durum:</span>
              {hasKey ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle size={16} />
                  Anahtar mevcut
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-red-500">
                  <XCircle size={16} />
                  Anahtar bulunamadi
                </span>
              )}
            </div>

            {/* API Key input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                API Anahtari
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm font-mono"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <Save size={16} />
                Kaydet
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={!hasKey || testing}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Test...
                  </>
                ) : (
                  <>
                    <TestTube2 size={16} />
                    Test Et
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!hasKey}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                <Trash2 size={16} />
                Sil
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={16} className="flex-shrink-0" />
                ) : (
                  <XCircle size={16} className="flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-start gap-2 bg-yellow-50 px-4 py-3 rounded-xl">
              <Shield size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                API anahtariniz tarayicinizin yerel deposunda (localStorage)
                saklanir. Sunucuya gonderilmez. Paylasilan bilgisayarlarda
                dikkatli olun.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Community Profile Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Topluluk Profili
              </h2>
              <p className="text-xs text-gray-500">
                Topluluk haritasindaki kimliginiz
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Rumuz input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rümuz
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rumuz}
                  onChange={(e) => {
                    setRumuz(e.target.value);
                    setRumuzKaydedildi(false);
                    setRumuzHata(null);
                  }}
                  placeholder="Anonim Kullanıcı"
                  className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                    rumuzDurum === "alinmis"
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : rumuzDurum === "musait"
                      ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      : "border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  }`}
                />
                <button
                  type="button"
                  disabled={rumuzDurum === "alinmis" || rumuzDurum === "kontrol" || rumuzKaydediliyor}
                  onClick={async () => {
                    setRumuzKaydediliyor(true);
                    setRumuzHata(null);
                    try {
                      const mevcutRumuz = kullaniciAdGetir();
                      const rumuzDegisti = rumuz.trim() !== mevcutRumuz;

                      if (rumuzDegisti) {
                        // Rumuz değişikliği hakkı kontrolü
                        const isPremium = await premiumMi();
                        const { kalanHak, beklemeSuresi } = rumuzDegisiklikHakkiKontrol(kullaniciId, isPremium);

                        if (kalanHak <= 0 && beklemeSuresi !== null) {
                          // Premium kullanıcı 24 saat beklemeli
                          const kalanSaat = Math.ceil(beklemeSuresi / (60 * 60 * 1000));
                          setRumuzHata(`Rümuz değiştirme hakkınız doldu. ${kalanSaat} saat sonra tekrar deneyebilirsiniz.`);
                          setRumuzKaydediliyor(false);
                          return;
                        }

                        if (kalanHak <= 0) {
                          // Normal kullanıcı premium'a geçmeli
                          setRumuzHata(`Rümuz değiştirme hakkınız doldu. Premium'a geçerek ${isPremium ? '24 saat sonra' : 'daha fazla'} rümuz değiştirebilirsiniz.`);
                          setRumuzKaydediliyor(false);
                          return;
                        }
                      }

                      await kullaniciAdiniGuncelle(rumuz);

                      if (rumuzDegisti) {
                        rumuzDegisiklikSayaciniArtir(kullaniciId);
                      }

                      setRumuzKaydedildi(true);
                      setRumuzDurum("kendin");
                    } catch (err) {
                      setRumuzHata(err instanceof Error ? err.message : "Rümuz kaydedilemedi.");
                    } finally {
                      setRumuzKaydediliyor(false);
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                >
                  {rumuzKaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                </button>
              </div>

              {/* Availability feedback */}
              {rumuzDurum === "kontrol" && (
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" />
                  Kontrol ediliyor...
                </p>
              )}
              {rumuzDurum === "musait" && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  Kullanılabilir
                </p>
              )}
              {rumuzDurum === "kendin" && (
                <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  Mevcut rümuzunuz
                </p>
              )}
              {rumuzDurum === "alinmis" && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <XCircle size={11} />
                  Bu rümuz alınmış
                </p>
              )}
              {rumuzKaydedildi && rumuzDurum !== "alinmis" && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  Rümuz kaydedildi
                </p>
              )}
              {rumuzHata && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <XCircle size={11} />
                  {rumuzHata}
                </p>
              )}
            </div>

            {/* User ID display */}
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Kullanıcı ID:</span>{" "}
                <span className="font-mono">{kullaniciId.substring(0, 8)}...</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bu ID anonim olarak topluluk bölgelerinizi tanımlar.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Blocked Users Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Ban size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Engellenen Kullanıcılar
              </h2>
              <p className="text-xs text-gray-500">
                Topluluk chat'inde engellediğiniz kullanıcılar
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            {engellenenler.length === 0 ? (
              <div className="text-center py-8">
                <UserX size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Engellenmiş kullanıcı yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {engellenenler.map((kullanici) => (
                  <div
                    key={kullanici.id}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          @{kullanici.ad}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {kullanici.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEngelKaldir(kullanici.id)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Engeli Kaldır
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* Shopping Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Alışveriş</h2>
              <p className="text-xs text-gray-500">
                Sipariş geçmişi ve değerlendirmeler
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => navigate('/siparisler')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package size={18} className="text-orange-500" />
                <span className="text-sm font-medium text-gray-900">
                  Sipariş Geçmişim
                </span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Account Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <LogOut size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hesap</h2>
              <p className="text-xs text-gray-500">
                {mevcutKullanici()?.email || "Kullanıcı"}
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
                  await cikisYap();
                  // App.tsx'deki auth listener otomatik olarak login'e yonlendirecek
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* About Section */}
        {/* ================================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Info size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hakkinda</h2>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <PawPrint size={24} className="text-orange-500" />
              <div>
                <p className="font-bold text-gray-900">PuppyTimer v1.0</p>
                <p className="text-xs text-gray-500">Web Uygulamasi</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              PuppyTimer, kopeginizin gunluk bakimini kolayca takip etmenizi
              saglayan bir uygulamadir. Beslenme, su, yuruyus, tuvalet ve saglik
              kayitlarinizi tutabilir, yapay zeka destekli analizler
              alabilirsiniz. Tum verileriniz cihazinizda guvenle saklanir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
