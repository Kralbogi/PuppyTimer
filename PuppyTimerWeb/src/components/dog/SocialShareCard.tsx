// =============================================================================
// PawLand - Social Share Card
// Instagram-style shareable cards for dog profiles
// =============================================================================

import React, { useRef, useState } from "react";
import { X, Download, Share2, Heart, Calendar, Trophy } from "lucide-react";
import type { Kopek } from "../../types/models";
import DogAvatar from "../common/DogAvatar";
import html2canvas from "html2canvas";

interface SocialShareCardProps {
  kopek: Kopek;
  onClose: () => void;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({
  kopek,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const yasHesapla = (): string => {
    if (!kopek.dogumTarihi) return "-";
    const dogum = new Date(kopek.dogumTarihi);
    const simdi = new Date();
    let yil = simdi.getFullYear() - dogum.getFullYear();
    let ay = simdi.getMonth() - dogum.getMonth();

    if (ay < 0) {
      yil--;
      ay += 12;
    }

    if (yil > 0 && ay > 0) return `${yil} yaş ${ay} ay`;
    if (yil > 0) return `${yil} yaş`;
    if (ay > 0) return `${ay} ay`;
    return "Yeni doğan";
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${kopek.ad}-share-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      const file = new File([blob], `${kopek.ad}-share-card.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${kopek.ad} - PawLand`,
          text: `${kopek.ad}'ın profil kartını gör! `,
          files: [file],
        });
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Paylaşım Kartı</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Shareable Card */}
        <div className="mb-4">
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-2xl p-6 shadow-xl border-2 border-white"
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg">
                <DogAvatar
                  fotoData={kopek.fotoData}
                  avatarData={kopek.avatarData}
                  cinsiyet={kopek.cinsiyet}
                  irk={kopek.irk}
                  size={56}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {kopek.ad}
                </h3>
                <p className="text-sm text-gray-600">{kopek.irk}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                <Calendar size={20} className="text-teal-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 mb-0.5">Yaş</p>
                <p className="text-sm font-bold text-gray-900">
                  {yasHesapla()}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                <Heart
                  size={20}
                  className="text-pink-500 mx-auto mb-1 fill-pink-500"
                />
                <p className="text-xs text-gray-600 mb-0.5">Beğeniler</p>
                <p className="text-sm font-bold text-gray-900">
                  {kopek.toplamBegeniler ?? 0}
                </p>
              </div>

              {kopek.agirlik && (
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                  <span className="text-lg mb-1 block"></span>
                  <p className="text-xs text-gray-600 mb-0.5">Ağırlık</p>
                  <p className="text-sm font-bold text-gray-900">
                    {kopek.agirlik} kg
                  </p>
                </div>
              )}

              {kopek.puan !== undefined && kopek.puan > 0 && (
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
                  <Trophy size={20} className="text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 mb-0.5">Puan</p>
                  <p className="text-sm font-bold text-gray-900">
                    {kopek.puan}
                  </p>
                </div>
              )}
            </div>

            {/* Personality Tags */}
            {kopek.kisilikEtiketleri && kopek.kisilikEtiketleri.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {kopek.kisilikEtiketleri.slice(0, 4).map((etiket) => (
                  <span
                    key={etiket}
                    className="px-3 py-1 bg-white/80 backdrop-blur rounded-full text-xs font-medium text-gray-700"
                  >
                    {etiket}
                  </span>
                ))}
              </div>
            )}

            {/* Footer - Branding */}
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/40">
              <span className="text-2xl"></span>
              <span className="text-sm font-bold text-gray-700">
                PawLand
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-medium rounded-xl transition-colors"
          >
            <Download size={18} />
            <span>{isGenerating ? "Oluşturuluyor..." : "İndir"}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            <Share2 size={18} />
            <span>{isGenerating ? "Oluşturuluyor..." : "Paylaş"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialShareCard;
