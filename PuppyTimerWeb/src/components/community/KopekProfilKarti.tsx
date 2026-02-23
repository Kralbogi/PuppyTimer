// =============================================================================
// PuppyTimer Web - KopekProfilKarti
// Topluluk haritasinda kopek pinine tiklandiginda gorunen profil karti
// =============================================================================

import React, { useState, useEffect } from "react";
import { Weight, Calendar, Venus, Mars, Scissors, X, Heart, MessageCircle, UserPlus, UserCheck, Clock, Navigation, Flag } from "lucide-react";
import { cinsiyetBaslik, CerceveTipi } from "../../types/enums";
import { turkceTarihSaat, bugunDogumGunuMu } from "../../services/dateUtils";
import type { ToplulukKopek, SikayetKategorisi } from "../../types/models";
import { useArkadasViewModel } from "../../hooks/useArkadasViewModel";
import Confetti from "../common/Confetti";
import AnimatedDog3D from "../common/AnimatedDog3D";
import { SikayetModal } from "./SikayetModal";
import { sikayetGonder } from "../../services/sikayetService";

// Yas hesaplama (DogProfilePage'deki ile ayni mantik)
function hesaplaYas(dogumTarihi?: number): string {
  if (!dogumTarihi) return "-";
  const dogum = new Date(dogumTarihi);
  const simdi = new Date();

  let yil = simdi.getFullYear() - dogum.getFullYear();
  let ay = simdi.getMonth() - dogum.getMonth();

  if (ay < 0) {
    yil--;
    ay += 12;
  }

  if (simdi.getDate() < dogum.getDate()) {
    ay--;
    if (ay < 0) {
      yil--;
      ay += 12;
    }
  }

  if (yil > 0 && ay > 0) return `${yil} yil ${ay} ay`;
  if (yil > 0) return `${yil} yil`;
  if (ay > 0) return `${ay} ay`;

  const gunFark = Math.floor(
    (simdi.getTime() - dogum.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (gunFark > 0) return `${gunFark} gun`;
  return "Yeni dogan";
}

interface KopekProfilKartiProps {
  kopek: ToplulukKopek;
  benimMi: boolean;
  onKapat: () => void;
  onSil?: () => void;
  onBegen?: () => void;
  onYorumAc?: () => void;
  begenildiMi?: boolean;
  onYolTarifi?: (hedef: [number, number], kopekAd: string) => void;
  onMesajGonder?: (karsiTarafId: string, karsiTarafAd: string) => void;
}

const KopekProfilKarti: React.FC<KopekProfilKartiProps> = ({
  kopek,
  benimMi,
  onKapat,
  onSil,
  onBegen,
  onYorumAc,
  begenildiMi,
  onYolTarifi,
  onMesajGonder,
}) => {
  const CinsiyetIcon = kopek.cinsiyet === "Erkek" ? Mars : Venus;
  const cinsiyetRenk = kopek.cinsiyet === "Erkek" ? "text-blue-500" : "text-pink-500";

  const arkadasVM = useArkadasViewModel();
  const [arkadasDurumu, setArkadasDurumu] = useState<"yukleniyor" | "yok" | "beklemede" | "arkadas">("yukleniyor");
  const [arkadasEkleniyor, setArkadasEkleniyor] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSikayetModal, setShowSikayetModal] = useState(false);

  // Dogum gunu kontrol et
  useEffect(() => {
    if (bugunDogumGunuMu(kopek.dogumTarihi)) {
      setShowConfetti(true);
    }
  }, [kopek.dogumTarihi]);

  // Arkadas durumunu kontrol et
  useEffect(() => {
    if (benimMi) {
      setArkadasDurumu("yok");
      return;
    }

    const kontrolEt = async () => {
      try {
        const arkadasMi = await arkadasVM.arkadasKontrol(kopek.olusturanId, kopek.id);
        if (arkadasMi) {
          setArkadasDurumu("arkadas");
          return;
        }

        const bekleyenVar = await arkadasVM.bekleyenIstekKontrol(kopek.olusturanId, kopek.id);
        if (bekleyenVar) {
          setArkadasDurumu("beklemede");
          return;
        }

        setArkadasDurumu("yok");
      } catch {
        setArkadasDurumu("yok");
      }
    };

    kontrolEt();
  }, [benimMi, kopek.olusturanId, kopek.id, arkadasVM]);

  // Arkadas ekle butonu tiklama
  const arkadasEkle = async () => {
    if (arkadasEkleniyor || arkadasDurumu !== "yok") return;

    setArkadasEkleniyor(true);
    try {
      await arkadasVM.istekGonder(
        kopek.olusturanId,
        kopek.olusturanAd,
        kopek.id,
        kopek.kopekAd
      );
      setArkadasDurumu("beklemede");
    } catch (err) {
      // Hata mesaji gosterildi
    } finally {
      setArkadasEkleniyor(false);
    }
  };

  const handleSikayetGonder = async (kategori: SikayetKategorisi, aciklama?: string) => {
    await sikayetGonder(kopek.olusturanId, kopek.id, kategori, aciklama);
    alert("Şikayetiniz başarıyla gönderildi. Teşekkür ederiz.");
  };

  // Premium çerçeve renkleri ve efektleri
  const isPremium = kopek.cerceveTipi && kopek.cerceveTipi !== CerceveTipi.Normal;
  let borderColor = "#f97316"; // Default orange
  let borderGlow = "";
  let frameEmoji = "";
  let animationClass = "";

  if (isPremium && kopek.cerceveTipi) {
    switch (kopek.cerceveTipi) {
      case CerceveTipi.KralTaci:
        borderColor = "#fbbf24"; // Gold
        borderGlow = "shadow-[0_0_12px_rgba(251,191,36,0.6)]";
        frameEmoji = "👑";
        animationClass = "animate-gold-pulse";
        break;
      case CerceveTipi.KraliceTaci:
        borderColor = "#ec4899"; // Pink
        borderGlow = "shadow-[0_0_12px_rgba(236,72,153,0.6)]";
        frameEmoji = "👑";
        animationClass = "animate-pink-shimmer";
        break;
      case CerceveTipi.KirmiziKurdele:
        borderColor = "#dc2626"; // Red
        borderGlow = "shadow-[0_0_12px_rgba(220,38,38,0.6)]";
        frameEmoji = "🎀";
        animationClass = "animate-red-glow";
        break;
      case CerceveTipi.Yildiz:
        borderColor = "#3b82f6"; // Blue
        borderGlow = "shadow-[0_0_12px_rgba(59,130,246,0.6)]";
        frameEmoji = "⭐";
        animationClass = "animate-star-twinkle";
        break;
      case CerceveTipi.Elmas:
        borderColor = "#8b5cf6"; // Purple
        borderGlow = "shadow-[0_0_12px_rgba(139,92,246,0.6)]";
        frameEmoji = "💎";
        animationClass = "animate-diamond-shimmer";
        break;
      case CerceveTipi.Ates:
        borderColor = "#f97316"; // Orange
        borderGlow = "shadow-[0_0_12px_rgba(249,115,22,0.6)]";
        frameEmoji = "🔥";
        animationClass = "animate-fire-flame";
        break;
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-sm relative ${animationClass}`}
      style={{
        border: `${isPremium ? '3px' : '2px'} solid ${borderColor}`,
      }}
    >
      {/* Dogum gunu konfetisi */}
      {showConfetti && (
        <Confetti onComplete={() => setShowConfetti(false)} />
      )}

      {/* Premium frame emoji - top right corner of card */}
      {frameEmoji && (
        <div className="absolute -top-2 -right-2 text-2xl z-10">
          {frameEmoji}
        </div>
      )}

      {/* Ust kisim - Foto + ad + irk */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        {/* Avatar - AnimatedDog3D with Premium Frame */}
        <div className="relative flex-shrink-0 w-20 h-20">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${borderGlow}`}
            style={{
              border: `${isPremium ? '4px' : '3px'} solid ${borderColor}`,
              backgroundColor: '#fff'
            }}
          >
            <div className="w-16 h-16">
              <AnimatedDog3D
                irk={kopek.irk || ""}
                size={64}
                customColors={kopek.renkler}
                aksesuarlar={kopek.aksesuarlar}
              />
            </div>
          </div>
        </div>

        {/* Ad ve irk */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {kopek.kopekAd}
          </h3>
          {kopek.irk && (
            <p className="text-sm text-gray-500 truncate">{kopek.irk}</p>
          )}
        </div>

        {/* Kapat butonu */}
        <button
          type="button"
          onClick={onKapat}
          className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Bilgi satirlari */}
      <div className="px-4 py-3 space-y-2">
        {/* Cinsiyet */}
        <div className="flex items-center gap-2">
          <CinsiyetIcon size={16} className={cinsiyetRenk} />
          <span className="text-sm text-gray-600">Cinsiyet:</span>
          <span className="text-sm font-medium text-gray-900">
            {cinsiyetBaslik(kopek.cinsiyet)}
          </span>
        </div>

        {/* Yas */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-teal-500" />
          <span className="text-sm text-gray-600">Yas:</span>
          <span className="text-sm font-medium text-gray-900">
            {hesaplaYas(kopek.dogumTarihi)}
          </span>
        </div>

        {/* Agirlik */}
        <div className="flex items-center gap-2">
          <Weight size={16} className="text-purple-500" />
          <span className="text-sm text-gray-600">Agirlik:</span>
          <span className="text-sm font-medium text-gray-900">
            {kopek.agirlik != null ? `${kopek.agirlik} kg` : "-"}
          </span>
        </div>

        {/* Kisir durumu */}
        <div className="flex items-center gap-2">
          <Scissors size={16} className="text-indigo-500" />
          <span className="text-sm text-gray-600">Kisir:</span>
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              kopek.kisir
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {kopek.kisir ? "Evet" : "Hayir"}
          </span>
        </div>
      </div>

      {/* Sosyal aksiyonlar - Begeni + Yorum + Arkadas (sadece baska kullanicilarin kopekleri icin) */}
      {!benimMi && (onBegen || onYorumAc || arkadasDurumu !== "yukleniyor") && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
          {onBegen && (
            <button
              type="button"
              onClick={onBegen}
              disabled={begenildiMi}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                begenildiMi
                  ? "bg-pink-100 text-pink-600 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-pink-100 text-gray-600 hover:text-pink-600"
              }`}
            >
              <Heart size={16} className={begenildiMi ? "fill-current" : ""} />
              {kopek.toplamBegeniler || 0}
            </button>
          )}
          {onYorumAc && (
            <button
              type="button"
              onClick={onYorumAc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors"
            >
              <MessageCircle size={16} />
              Yorum
            </button>
          )}

          {/* Yol Tarifi butonu (sadece arkadaslar icin) */}
          {onYolTarifi && (
            arkadasDurumu === "arkadas" ? (
              <button
                type="button"
                onClick={() => onYolTarifi([kopek.enlem, kopek.boylam], kopek.kopekAd)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
              >
                <Navigation size={16} />
                Yol Tarifi
              </button>
            ) : (
              <button
                type="button"
                onClick={() => alert("Yol tarifi kullanmak için arkadaş olmalısınız")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-300 text-gray-500 font-medium text-sm cursor-not-allowed"
                disabled
              >
                <Navigation size={16} />
                Yol Tarifi
              </button>
            )
          )}

          {/* Mesaj Gonder butonu (sadece arkadalar icin) */}
          {arkadasDurumu === "arkadas" && onMesajGonder && (
            <button
              type="button"
              onClick={() => onMesajGonder(kopek.olusturanId, kopek.olusturanAd)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm transition-colors"
            >
              <MessageCircle size={16} />
              Mesaj Gönder
            </button>
          )}

          {/* Arkadas butonu */}
          {arkadasDurumu === "yok" && (
            <button
              type="button"
              onClick={arkadasEkle}
              disabled={arkadasEkleniyor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium text-sm transition-colors"
            >
              <UserPlus size={16} />
              {arkadasEkleniyor ? "Gonderiliyor..." : "Arkadas Ekle"}
            </button>
          )}
          {arkadasDurumu === "beklemede" && (
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-medium text-sm cursor-not-allowed"
            >
              <Clock size={16} />
              Istek Gonderildi
            </button>
          )}
          {arkadasDurumu === "arkadas" && (
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 font-medium text-sm cursor-not-allowed"
            >
              <UserCheck size={16} />
              Arkadas
            </button>
          )}
        </div>
      )}

      {/* Alt kisim - Kullanici + zaman + sil/sikayet butonu */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          @{kopek.olusturanAd} • {turkceTarihSaat(kopek.olusturmaTarihi)}
        </span>
        <div className="flex items-center gap-3">
          {benimMi && onSil && (
            <button
              type="button"
              onClick={onSil}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Geri Cek
            </button>
          )}
          {!benimMi && (
            <button
              type="button"
              onClick={() => setShowSikayetModal(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 font-medium transition-colors"
              title="Şikayet Et"
            >
              <Flag size={14} />
              Şikayet Et
            </button>
          )}
        </div>
      </div>

      {/* Şikayet Modal */}
      {showSikayetModal && (
        <SikayetModal
          kullaniciAd={kopek.olusturanAd}
          kullaniciId={kopek.olusturanId}
          kopekId={kopek.id}
          onGonder={handleSikayetGonder}
          onKapat={() => setShowSikayetModal(false)}
        />
      )}
    </div>
  );
};

export default KopekProfilKarti;
