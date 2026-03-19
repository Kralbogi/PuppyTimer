// =============================================================================
// PawLand - PulsingCircle (Yanip Sonen Daire)
// Topluluk haritasinda tehlikeli/sosyal bolgeleri gosterir
// =============================================================================

import React from "react";
import { Circle, Popup } from "react-leaflet";
import { Heart, Trash2, Zap } from "lucide-react";
import { BolgeTuru, bolgeTuruBaslik, bolgeTuruRenk } from "../../types/enums";
import { useAnimasyonTick } from "../../hooks/useAnimasyonTick";

interface PulsingCircleProps {
  center: [number, number];
  radius: number;
  tur: BolgeTuru;
  canli: boolean;
  baslik: string;
  aciklama?: string;
  olusturanAd: string;
  tarih: number;
  begeniler: number;
  benimMi: boolean;
  onBegen: () => void;
  onSil: () => void;
}

function zamanOnce(tarih: number): string {
  const fark = Date.now() - tarih;
  const dakika = Math.floor(fark / 60000);
  if (dakika < 1) return "Az önce";
  if (dakika < 60) return `${dakika} dk önce`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}

const PulsingCircle: React.FC<PulsingCircleProps> = ({
  center,
  radius,
  tur,
  canli,
  baslik,
  aciklama,
  olusturanAd,
  tarih,
  begeniler,
  benimMi,
  onBegen,
  onSil,
}) => {
  const normalTick = useAnimasyonTick(2000);
  const hizliTick = useAnimasyonTick(800);
  const pulse = canli ? hizliTick : normalTick;

  const baseColor = bolgeTuruRenk(tur);
  const fillOpacity = 0.08 + pulse * 0.22;
  const strokeWeight = 1.5 + pulse * 1.5;

  return (
    <>
      {/* Sabit arka plan daire */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          fillColor: baseColor,
          fillOpacity: 0.06,
          color: baseColor,
          weight: 1,
          dashArray: "6,4",
        }}
      />
      {/* Animasyonlu nabiz daire */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          fillColor: baseColor,
          fillOpacity,
          color: baseColor,
          weight: strokeWeight,
          opacity: 0.6 + pulse * 0.4,
        }}
      >
        <Popup>
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              {canli && <Zap size={14} className="text-yellow-500" />}
              <p className="font-bold text-sm text-gray-900">{baslik}</p>
            </div>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: baseColor }}
            >
              {bolgeTuruBaslik(tur)}
              {canli && " \u2022 Canlı Bölge"}
            </p>
            {aciklama && (
              <p className="text-xs text-gray-500 mb-2">{aciklama}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2 mt-1">
              <span>@{olusturanAd}</span>
              <span>{zamanOnce(tarih)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBegen();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
              >
                <Heart size={12} />
                {begeniler}
              </button>
              {benimMi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSil();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={12} />
                  Sil
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Circle>
    </>
  );
};

export default PulsingCircle;
