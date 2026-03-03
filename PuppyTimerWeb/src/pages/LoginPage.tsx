// =============================================================================
// PuppyTimer Web - LoginPage (Giris Sayfasi)
// Email/sifre ile giris yapma
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { girisYap } from "../services/authService";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "errors"]);
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !sifre) return;

    setYukleniyor(true);
    setHata(null);

    try {
      await girisYap(email.trim(), sifre);
      // Basarili giris - App.tsx'deki auth listener yonlendirecek
    } catch (err) {
      if (err instanceof Error) {
        const errorCode = (err as { code?: string }).code;
        switch (errorCode) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setHata(t("errors:auth.invalidCredentials"));
            break;
          case "auth/invalid-email":
            setHata(t("errors:auth.invalidEmail"));
            break;
          case "auth/too-many-requests":
            setHata(t("errors:auth.tooManyRequests"));
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
          <p className="text-gray-600">{t("auth:login.title")}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("auth:login.title")}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:login.email.label")}
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
                  placeholder={t("auth:login.email.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("auth:login.password.label")}
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
                  placeholder={t("auth:login.password.placeholder")}
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Hata mesaji */}
            {hata && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {hata}
              </div>
            )}

            {/* Giris butonu */}
            <button
              type="submit"
              disabled={yukleniyor || !email.trim() || !sifre}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {yukleniyor ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("auth:login.submit")}...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  {t("auth:login.submit")}
                </>
              )}
            </button>
          </form>

          {/* Kayit ol linki */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("auth:login.noAccount")}{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                {t("auth:login.register")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
