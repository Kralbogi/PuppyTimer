// =============================================================================
// PawLand - LoginPage (Giriş Sayfası)
// Email/şifre ile giriş yapma + şifremi unuttum
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Loader2,
  LogIn,
  KeyRound,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { girisYap, sifreSifirla } from "../services/authService";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "errors"]);
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Şifremi unuttum state
  const [sifreSifirlaMode, setSifreSifirlaMode] = useState(false);
  const [sifirlaEmail, setSifirlaEmail] = useState("");
  const [sifirlaYukleniyor, setSifirlaYukleniyor] = useState(false);
  const [sifirlaBasarili, setSifirlaBasarili] = useState(false);
  const [sifirlaHata, setSifirlaHata] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email.trim() || !sifre) return;

    setYukleniyor(true);
    setHata(null);

    try {
      await girisYap(email.trim(), sifre);
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

  const handleSifreSifirla = async () => {
    if (!sifirlaEmail.trim()) return;
    setSifirlaYukleniyor(true);
    setSifirlaHata(null);
    setSifirlaBasarili(false);

    try {
      await sifreSifirla(sifirlaEmail.trim());
      setSifirlaBasarili(true);
    } catch (err) {
      if (err instanceof Error) {
        const errorCode = (err as { code?: string }).code;
        switch (errorCode) {
          case "auth/user-not-found":
            setSifirlaHata("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.");
            break;
          case "auth/invalid-email":
            setSifirlaHata("Geçersiz e-posta adresi.");
            break;
          case "auth/too-many-requests":
            setSifirlaHata("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.");
            break;
          default:
            setSifirlaHata("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } else {
        setSifirlaHata("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setSifirlaYukleniyor(false);
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
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-44 h-44 rounded-full bg-white/8 pointer-events-none" />

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
            Tüm aktiviteleri, anıları ve sağlık takibini tek bir yerde toplayın.
          </p>

          {/* Özellikler */}
          <div className="space-y-3">
            {[
              { icon: "🐕", label: "Köpek profilini kolayca yönet" },
              { icon: "⏱️", label: "Aktiviteleri takip et ve planla" },
              { icon: "🗺️", label: "Çevrendeki köpek sahipleriyle bağlan" },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium text-white/90">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SAĞ PANEL – Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">

        {/* Mobilde görünen mini header */}
        <div className="md:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md overflow-hidden"
               style={{ background: "linear-gradient(135deg, #ff8c42, #e07a2f)" }}>
            <img src="/pawlandlogo.png" alt="PawLand" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>PawLand</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Köpeğinizin dijital dünyası</p>
        </div>

        <div className="w-full max-w-[360px] fade-scale-in">

          {/* Başlık */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              {t("auth:login.title")}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Hesabınıza devam etmek için giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                {t("auth:login.email.label")}
              </label>
              <div className="relative group">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: email ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth:login.email.placeholder")}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {t("auth:login.password.label")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSifreSifirlaMode(true);
                    setSifirlaEmail(email);
                    setSifirlaBasarili(false);
                    setSifirlaHata(null);
                  }}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-primary)" }}
                >
                  Şifremi Unuttum
                </button>
              </div>
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
                  placeholder={t("auth:login.password.placeholder")}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-text-muted)" }}
                  tabIndex={-1}
                >
                  {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={yukleniyor || !email.trim() || !sifre}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #ff8c42, #e07a2f)",
              }}
            >
              {yukleniyor ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("auth:login.submit")}...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  {t("auth:login.submit")}
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

          {/* Kayıt ol */}
          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("auth:login.noAccount")}{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-bold transition-opacity hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                {t("auth:login.register")}
              </button>
            </p>
          </div>

          {/* Yasal linkler */}
          <div className="flex justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => navigate("/privacy-policy")}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-muted)" }}
            >
              Gizlilik Politikası
            </button>
            <span className="text-xs" style={{ color: "var(--color-border)" }}>•</span>
            <button
              type="button"
              onClick={() => navigate("/terms-of-service")}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-muted)" }}
            >
              Kullanım Koşulları
            </button>
          </div>
        </div>
      </div>

      {/* ── Şifremi Unuttum Modalı ── */}
      {sifreSifirlaMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
          <div
            className="w-full max-w-sm rounded-3xl p-7 shadow-2xl border fade-scale-in"
            style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border-light)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(224,122,47,0.12)" }}
              >
                <KeyRound size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>Şifre Sıfırlama</h3>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  E-posta adresinize sıfırlama bağlantısı göndereceğiz
                </p>
              </div>
            </div>

            {sifirlaBasarili ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">E-posta gönderildi!</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      <strong>{sifirlaEmail}</strong> adresine bağlantı gönderdik.
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Spam/gereksiz klasörünü de kontrol etmeyi unutmayın.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSifreSifirlaMode(false)}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ff8c42, #e07a2f)" }}
                >
                  Giriş Sayfasına Dön
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                    <input
                      type="email"
                      value={sifirlaEmail}
                      onChange={(e) => setSifirlaEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      disabled={sifirlaYukleniyor}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all disabled:opacity-50"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                  </div>
                </div>

                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    E-posta spam klasörüne düşebilir. Gelen kutunuzda bulamazsanız spam klasörünü kontrol edin.
                  </p>
                </div>

                {sifirlaHata && (
                  <div className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2"
                       style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-error)" }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    <span>{sifirlaHata}</span>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSifreSifirlaMode(false)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "var(--color-bg)" }}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleSifreSifirla}
                    disabled={sifirlaYukleniyor || !sifirlaEmail.trim()}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #ff8c42, #e07a2f)" }}
                  >
                    {sifirlaYukleniyor ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Gönder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
