// =============================================================================
// PuppyTimer Web - RegisterPage (Kayit Sayfasi)
// Yeni kullanici hesabi olusturma
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, UserPlus, Globe, MapPin } from "lucide-react";
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
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (i18n.language as Language) || "tr"
  );
  const [selectedCountry, setSelectedCountry] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Change language when selector changes
  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || !email.trim() || !sifre || !sifreTekrar) return;

    // Sifre kontrolu
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
      // Save language and country preference to Firestore
      await kaydetFirestore(selectedLanguage, selectedCountry || undefined);
      // Basarili kayit - App.tsx'deki auth listener yonlendirecek
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐾</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PuppyTimer</h1>
          <p className="text-gray-600">{t("auth:register.title")}</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("auth:register.title")}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.name.label")}
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder={t("auth:register.name.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.email.label")}
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth:register.email.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.password.label")}
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder={t("auth:register.password.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sifre Tekrar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.passwordConfirm.label")}
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={sifreTekrar}
                  onChange={(e) => setSifreTekrar(e.target.value)}
                  placeholder={t("auth:register.passwordConfirm.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.language.label")}
              </label>
              <div className="relative">
                <Globe
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none bg-white"
                >
                  <option value="tr">🇹🇷 Türkçe</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="ar">🇸🇦 العربية</option>
                </select>
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:register.country.label")}
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none bg-white"
                >
                  <option value="">{t("auth:register.country.placeholder")}</option>
                  <option value="TR">🇹🇷 Türkiye</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
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

            {/* Hata mesaji */}
            {hata && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {hata}
              </div>
            )}

            {/* Kayit butonu */}
            <button
              type="submit"
              disabled={
                yukleniyor ||
                !ad.trim() ||
                !email.trim() ||
                !sifre ||
                !sifreTekrar
              }
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {yukleniyor ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("auth:register.creating")}
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  {t("auth:register.submit")}
                </>
              )}
            </button>
          </form>

          {/* Giris yap linki */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("auth:register.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
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
