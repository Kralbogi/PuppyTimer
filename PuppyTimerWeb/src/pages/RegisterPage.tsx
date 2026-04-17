// =============================================================================
// PawLand - RegisterPage (Kayıt Sayfası)
// Yeni kullanıcı hesabı oluşturma
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Loader2,
  UserPlus,
  Globe,
  MapPin,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { kayitOl } from "../services/authService";
import { kaydetFirestore } from "../services/languageService";
import type { Language } from "../contexts/LanguageContext";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["auth", "errors"]);
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [sifreTekrarGoster, setSifreTekrarGoster] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (i18n.language as Language) || "tr"
  );
  const [selectedCountry, setSelectedCountry] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // Şifre gücü hesaplama
  const sifreGucu = (() => {
    if (!sifre) return 0;
    let g = 0;
    if (sifre.length >= 6) g++;
    if (sifre.length >= 10) g++;
    if (/[A-Z]/.test(sifre)) g++;
    if (/[0-9]/.test(sifre)) g++;
    if (/[^A-Za-z0-9]/.test(sifre)) g++;
    return g;
  })();

  const sifreGucuRenk =
    sifreGucu <= 1 ? "#ef4444" : sifreGucu <= 2 ? "#f59e0b" : sifreGucu <= 3 ? "#3b82f6" : "#22c55e";
  const sifreGucuLabel =
    sifreGucu <= 1 ? "Zayıf" : sifreGucu <= 2 ? "Orta" : sifreGucu <= 3 ? "İyi" : "Güçlü";

  const sifreEslesiyor = sifreTekrar.length > 0 && sifre === sifreTekrar;
  const sifreEslesmedi = sifreTekrar.length > 0 && sifre !== sifreTekrar;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!ad.trim() || !email.trim() || !sifre || !sifreTekrar) return;

    if (sifre !== sifreTekrar) {
      setHata(t("errors:auth.passwordMismatch"));
      return;
    }
    if (sifre.length < 6) {
      setHata(t("errors:validation.passwordTooShort"));
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      await kayitOl(email.trim(), sifre, ad.trim());
      await kaydetFirestore(selectedLanguage, selectedCountry || undefined);
    } catch (err) {
      if (err instanceof Error) {
        const errorCode = (err as { code?: string }).code;
        switch (errorCode) {
          case "auth/email-already-in-use":
            setHata(t("errors:auth.emailInUse"));
            break;
          case "auth/invalid-email":
            setHata(t("errors:auth.invalidEmail"));
            break;
          case "auth/weak-password":
            setHata(t("errors:auth.weakPassword"));
            break;
          default:
            setHata(t("errors:auth.unknown"));
        }
      } else {
        setHata(t("errors:auth.unknown"));
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row overflow-hidden" style={{ background: "var(--color-bg)" }}>

      {/* ── SOL PANEL – Marka ── */}
      <div
        className="hidden md:flex md:w-[46%] lg:w-[42%] relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #ff8c42 0%, #e07a2f 55%, #b85919 100%)" }}
      >
        {/* Dekoratif daireler */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-44 h-44 rounded-full bg-white/[0.08] pointer-events-none" />

        {/* Yüzen pati izleri */}
        <span className="absolute top-10 left-10 text-white/20 text-5xl rotate-12 select-none">🐾</span>
        <span className="absolute bottom-20 right-14 text-white/20 text-3xl -rotate-15 select-none">🐾</span>
        <span className="absolute top-1/3 right-10 text-white/15 text-2xl rotate-6 select-none">🐾</span>
        <span className="absolute bottom-1/3 left-8 text-white/15 text-xl -rotate-8 select-none">🐾</span>

        <div className="relative z-10 text-white max-w-xs w-full">
          {/* Logo */}
          <div className="mb-7 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/pawlandlogo.png" alt="PawLand" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-none">PawLand</h1>
              <p className="text-white/70 text-sm mt-0.5">Köpeğinizin dijital dünyası</p>
            </div>
          </div>

          <p className="text-white/80 text-base leading-relaxed mb-8">
            Bugün ücretsiz hesap oluşturun ve köpeğinizin her anını kayıt altına alın.
          </p>

          {/* Özellikler */}
          <div className="space-y-3">
            {[
              { icon: "🎯", label: "Günlük aktivite takibi" },
              { icon: "💊", label: "Sağlık ve aşı takvimleri" },
              { icon: "📸", label: "Fotoğraf galerisi ve anılar" },
              { icon: "🏆", label: "Başarılar ve ödüller" },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium text-white/90">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SAĞ PANEL – Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 overflow-y-auto">

        {/* Mobilde görünen mini header */}
        <div className="md:hidden text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md overflow-hidden"
            style={{ background: "linear-gradient(135deg, #ff8c42, #e07a2f)" }}
          >
            <img src="/pawlandlogo.png" alt="PawLand" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>PawLand</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Köpeğinizin dijital dünyası</p>
        </div>

        <div className="w-full max-w-[380px] fade-scale-in py-4">

          {/* Başlık */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              {t("auth:register.title")}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Birkaç adımda ücretsiz hesabınızı oluşturun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ad Soyad */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                {t("auth:register.name.label")}
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: ad ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <input
                  type="text"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder={t("auth:register.name.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: ad ? "var(--color-primary)" : "var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = ad ? "var(--color-primary)" : "var(--color-border)")}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                {t("auth:register.email.label")}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: email ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth:register.email.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: email ? "var(--color-primary)" : "var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = email ? "var(--color-primary)" : "var(--color-border)")}
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                {t("auth:register.password.label")}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: sifre ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <input
                  type={sifreGoster ? "text" : "password"}
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder={t("auth:register.password.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: sifre ? "var(--color-primary)" : "var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = sifre ? "var(--color-primary)" : "var(--color-border)")}
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-text-muted)" }}
                  tabIndex={-1}
                >
                  {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Şifre gücü göstergesi */}
              {sifre.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: sifreGucu >= n ? sifreGucuRenk : "var(--color-border)" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: sifreGucuRenk }}>
                    Şifre gücü: {sifreGucuLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                {t("auth:register.passwordConfirm.label")}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: sifreEslesiyor
                      ? "#22c55e"
                      : sifreEslesmedi
                      ? "#ef4444"
                      : "var(--color-text-muted)",
                  }}
                />
                <input
                  type={sifreTekrarGoster ? "text" : "password"}
                  value={sifreTekrar}
                  onChange={(e) => setSifreTekrar(e.target.value)}
                  placeholder={t("auth:register.passwordConfirm.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: sifreEslesiyor
                      ? "#22c55e"
                      : sifreEslesmedi
                      ? "#ef4444"
                      : sifreTekrar
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text)",
                  }}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {sifreEslesiyor && <CheckCircle2 size={15} className="text-green-500" />}
                  {sifreEslesmedi && <XCircle size={15} className="text-red-500" />}
                  <button
                    type="button"
                    onClick={() => setSifreTekrarGoster(!sifreTekrarGoster)}
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: "var(--color-text-muted)" }}
                    tabIndex={-1}
                  >
                    {sifreTekrarGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {sifreEslesmedi && (
                <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
              )}
            </div>

            {/* Dil ve Ülke – yan yana */}
            <div className="grid grid-cols-2 gap-3">
              {/* Dil */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                  {t("auth:register.language.label")}
                </label>
                <div className="relative">
                  <Globe
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    disabled={yukleniyor}
                    className="w-full pl-8 pr-2 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-bg-card)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="tr">🇹🇷 Türkçe</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="ar">🇸🇦 العربية</option>
                  </select>
                </div>
              </div>

              {/* Ülke */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                  {t("auth:register.country.label")}
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    disabled={yukleniyor}
                    className="w-full pl-8 pr-2 py-3 rounded-xl border-2 outline-none text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-bg-card)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="">{t("auth:register.country.placeholder")}</option>
                    <option value="TR">🇹🇷 Türkiye</option>
                    <option value="US">🇺🇸 USA</option>
                    <option value="GB">🇬🇧 UK</option>
                    <option value="ES">🇪🇸 España</option>
                    <option value="MX">🇲🇽 México</option>
                    <option value="AR">🇦🇷 Argentina</option>
                    <option value="CO">🇨🇴 Colombia</option>
                    <option value="CL">🇨🇱 Chile</option>
                    <option value="DE">🇩🇪 Deutschland</option>
                    <option value="AT">🇦🇹 Österreich</option>
                    <option value="CH">🇨🇭 Schweiz</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="BR">🇧🇷 Brasil</option>
                    <option value="PT">🇵🇹 Portugal</option>
                    <option value="SA">🇸🇦 السعودية</option>
                    <option value="AE">🇦🇪 الإمارات</option>
                    <option value="EG">🇪🇬 مصر</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hata mesajı */}
            {hata && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "var(--color-error)",
                }}
              >
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{hata}</span>
              </div>
            )}

            {/* Kayıt Butonu */}
            <button
              type="submit"
              disabled={yukleniyor || !ad.trim() || !email.trim() || !sifre || !sifreTekrar}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #ff8c42, #e07a2f)" }}
            >
              {yukleniyor ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("auth:register.creating")}
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  {t("auth:register.submit")}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>veya</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          {/* Giriş yap linki */}
          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("auth:register.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-bold transition-opacity hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                {t("auth:register.login")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
