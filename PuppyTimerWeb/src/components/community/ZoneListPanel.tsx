// =============================================================================
// PawLand - ZoneListPanel (Bolge Listesi Paneli)
// Topluluk bolgelerini yatay kaydirmali kartlar olarak gosterir
// =============================================================================

import React from "react";
import { Heart, Trash2, Zap, AlertTriangle, Users, MessageCircle, Navigation } from "lucide-react";
import type { ToplulukBolge } from "../../types/models";
import { BolgeTuru, bolgeTuruBaslik } from "../../types/enums";

interface ZoneListPanelProps {
  bolgeler: ToplulukBolge[];
  kullaniciId: string;
  onBegen: (bolgeId: string) => void;
  onSil: (bolgeId: string) => void;
  onZoneClick: (bolge: ToplulukBolge) => void;
  onNavigate?: (enlem: number, boylam: number, yaricap: number) => void;
  onYolTarifi?: (enlem: number, boylam: number, baslik: string) => void;
}

function zamanOnce(tarih: number): string {
  const fark = Date.now() - tarih;
  const dakika = Math.floor(fark / 60000);
  if (dakika < 1) return "Az önce";
  if (dakika < 60) return `${dakika} dk`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} saat`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün`;
}

const ZoneListPanel: React.FC<ZoneListPanelProps> = ({
  bolgeler,
  kullaniciId,
  onBegen,
  onSil,
  onZoneClick,
  onNavigate,
  onYolTarifi,
}) => {
  if (bolgeler.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        Henüz topluluk bölgesi yok. Haritaya tıklayarak
        ekleyin.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {bolgeler.map((bolge) => {
        const benimMi = bolge.olusturanId === kullaniciId;
        const tehlikeli = bolge.tur === BolgeTuru.Tehlikeli;

        return (
          <div
            key={bolge.id}
            onClick={() => {
              onNavigate?.(bolge.enlem, bolge.boylam, bolge.yaricap);
              onZoneClick(bolge);
            }}
            className={`flex-shrink-0 w-52 rounded-xl p-3 border cursor-pointer hover:shadow-md transition-shadow ${
              tehlikeli
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {tehlikeli ? (
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <Users size={14} className="text-green-600 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm font-semibold truncate ${
                      tehlikeli ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {bolge.baslik}
                  </p>
                  {bolge.canli && (
                    <Zap
                      size={12}
                      className="text-yellow-500 flex-shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bolgeTuruBaslik(bolge.tur)} \u2022 {bolge.yaricap}m
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>@{bolge.olusturanAd}</span>
                  <span>\u2022</span>
                  <span>{zamanOnce(bolge.olusturmaTarihi)}</span>
                </div>
              </div>

              {benimMi && (
                <button
                  type="button"
                  onClick={() => onSil(bolge.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Begeni + Yorum + Yol Tarifi */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBegen(bolge.id);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-pink-500 text-xs font-medium hover:bg-pink-50 transition-colors"
              >
                <Heart size={11} />
                {bolge.begeniler}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onZoneClick(bolge);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-orange-500 text-xs font-medium hover:bg-orange-50 transition-colors"
              >
                <MessageCircle size={11} />
                Yorum
              </button>
              {onYolTarifi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onYolTarifi(bolge.enlem, bolge.boylam, bolge.baslik);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  <Navigation size={11} />
                  Yol Tarifi
                </button>
              )}
              {bolge.canli && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                  <Zap size={10} />
                  Canlı
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ZoneListPanel;
