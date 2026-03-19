// =============================================================================
// PawLand - SettingsPage (Ayarlar Sayfasi)
// API anahtar yonetimi, uygulama bilgileri
// =============================================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  Info,
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage, type Language } from "../contexts/LanguageContext";
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

  // -- Load blocked users on mount
  useEffect(() => {
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
  // (API key section removed — AI is now a backend-managed Premium feature)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Placeholder for removed test function
  // ---------------------------------------------------------------------------

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
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg)' }}>
      {/* Header with back button */}
      <div
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 transition-colors smooth-transition"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Ayarlar</h1>
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Premium Üyelik</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
                    Premium üyesiniz!
                  </span>
                </div>

                <div className="bg-white/60 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Aktif Özellikler:</p>
                  <ul className="text-sm space-y-1.5" style={{ color: 'var(--color-text-muted)' }}>
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
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Premium üyelikle özel özelliklere erişin ve deneyiminizi geliştirin!
                </p>

                <div className="bg-white/60 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Premium Özellikleri:</p>
                  <ul className="text-sm space-y-1.5" style={{ color: 'var(--color-text-muted)' }}>
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
                  onClick={() => navigate('/premium')}
                  className="w-full px-4 py-3 text-white font-semibold rounded-xl smooth-transition active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
                >
                  <Crown size={18} />
                  Premium'a Geç
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* Language & Region Section */}
        {/* ================================================================ */}
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {t("settings:language.title")}
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t("settings:language.description")}
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              {t("settings:language.label")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-4 py-3 rounded-xl border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="tr"> Türkçe</option>
              <option value="en"> English</option>
              <option value="es"> Español</option>
              <option value="de"> Deutsch</option>
              <option value="fr"> Français</option>
              <option value="pt"> Português</option>
              <option value="ar"> العربية</option>
            </select>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t("settings:language.changed")}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Community Profile Section */}
        {/* ================================================================ */}
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Topluluk Profili
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Topluluk haritasindaki kimliginiz
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Rumuz input */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
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
                      : "focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  }`}
                  style={
                    rumuzDurum !== "alinmis" && rumuzDurum !== "musait"
                      ? { background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }
                      : { background: 'var(--color-bg-card)', color: 'var(--color-text)' }
                  }
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
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
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
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span className="font-medium">Kullanıcı ID:</span>{" "}
                <span className="font-mono">{kullaniciId.substring(0, 8)}...</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Bu ID anonim olarak topluluk bölgelerinizi tanımlar.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Blocked Users Section */}
        {/* ================================================================ */}
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Ban size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Engellenen Kullanıcılar
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Topluluk chat'inde engellediğiniz kullanıcılar
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            {engellenenler.length === 0 ? (
              <div className="text-center py-8">
                <UserX size={32} className="mx-auto mb-2" style={{ color: 'var(--color-border)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Engellenmiş kullanıcı yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {engellenenler.map((kullanici) => (
                  <div
                    key={kullanici.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-border)' }}
                      >
                        <Users size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          @{kullanici.ad}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
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
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Alışveriş</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Sipariş geçmişi ve değerlendirmeler
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => navigate('/siparisler')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors smooth-transition"
              style={{ background: 'var(--color-bg)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
            >
              <div className="flex items-center gap-3">
                <Package size={18} className="text-orange-500" />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Sipariş Geçmişim
                </span>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Account Section */}
        {/* ================================================================ */}
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <LogOut size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Hesap</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Info size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Hakkinda</h2>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <PawPrint size={24} className="text-orange-500" />
              <div>
                <p className="font-bold" style={{ color: 'var(--color-text)' }}>PawLand v1.0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Web Uygulamasi</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              PawLand, kopeginizin gunluk bakimini kolayca takip etmenizi
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
