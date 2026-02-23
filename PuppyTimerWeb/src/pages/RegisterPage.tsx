// =============================================================================
// PuppyTimer Web - RegisterPage (Kayit Sayfasi)
// Yeni kullanici hesabi olusturma
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, UserPlus } from "lucide-react";
import { kayitOl } from "../services/authService";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || !email.trim() || !sifre || !sifreTekrar) return;

    // Sifre kontrolu
    if (sifre !== sifreTekrar) {
      setHata("Şifreler eşleşmiyor");
      return;
    }

    if (sifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      await kayitOl(email.trim(), sifre, ad.trim());
      // Basarili kayit - App.tsx'deki auth listener yonlendirecek
    } catch (err) {
      if (err instanceof Error) {
        const errorCode = (err as { code?: string }).code;
        switch (errorCode) {
          case "auth/email-already-in-use":
            setHata("Bu e-posta adresi zaten kullanılıyor");
            break;
          case "auth/invalid-email":
            setHata("Geçersiz e-posta adresi");
            break;
          case "auth/weak-password":
            setHata("Şifre çok zayıf. Daha güçlü bir şifre seçin.");
            break;
          default:
            setHata("Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
        }
      } else {
        setHata("Bir hata oluştu");
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
          <p className="text-gray-600">Yeni hesap oluştur</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kayıt Ol</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adınız
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
                  placeholder="Adınız Soyadınız"
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-posta
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
                  placeholder="ornek@email.com"
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Şifre
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
                  placeholder="En az 6 karakter"
                  disabled={yukleniyor}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sifre Tekrar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Şifre Tekrar
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
                  placeholder="Şifrenizi tekrar girin"
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
                  Kayıt oluşturuluyor...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Kayıt Ol
                </>
              )}
            </button>
          </form>

          {/* Giris yap linki */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabınız var mı?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                Giriş Yap
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
