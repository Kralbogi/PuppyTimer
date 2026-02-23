// =============================================================================
// PuppyTimer Web - AsiTimerCard (Asi Tekrar Zamanlayici Karti)
// =============================================================================

import React, { useState, useEffect } from "react";
import { Syringe, CheckCircle, Trash2, Pause, Play } from "lucide-react";
import { asiTekrarAraligiBaslik } from "../../types/enums";
import type { AsiTekrari } from "../../types/models";

interface AsiTimerCardProps {
  tekrar: AsiTekrari;
  onTamamla: (id: number) => void;
  onSil: (id: number) => void;
  onToggle: (id: number) => void;
}

function geriSayimMetni(hedefMs: number): string {
  const fark = hedefMs - Date.now();
  if (fark <= 0) return "Suresi doldu!";

  const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
  const saat = Math.floor((fark % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const dakika = Math.floor((fark % (1000 * 60 * 60)) / (1000 * 60));

  if (gun > 0) return `${gun} gun ${saat} saat`;
  if (saat > 0) return `${saat} saat ${dakika} dk`;
  return `${dakika} dk`;
}

function ilerlemeYuzdesi(sonUygulama: number, sonrakiTarih: number): number {
  const toplam = sonrakiTarih - sonUygulama;
  if (toplam <= 0) return 100;
  const gecen = Date.now() - sonUygulama;
  return Math.min(100, Math.max(0, (gecen / toplam) * 100));
}

const AsiTimerCard: React.FC<AsiTimerCardProps> = ({
  tekrar,
  onTamamla,
  onSil,
  onToggle,
}) => {
  const [, setTick] = useState(0);

  // Geri sayim icin her dakika guncelle
  useEffect(() => {
    if (!tekrar.aktif) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [tekrar.aktif]);

  const sureDoldu = tekrar.sonrakiTarih <= Date.now();
  const yuzde = ilerlemeYuzdesi(tekrar.sonUygulamaTarihi, tekrar.sonrakiTarih);

  return (
    <div
      className={`rounded-xl p-4 mb-3 ${
        !tekrar.aktif
          ? "bg-gray-50 opacity-60"
          : sureDoldu
            ? "bg-red-50 border border-red-200"
            : "bg-blue-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              sureDoldu ? "bg-red-200" : "bg-blue-200"
            }`}
          >
            <Syringe
              size={20}
              className={sureDoldu ? "text-red-600" : "text-blue-600"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800">{tekrar.asiAdi}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {asiTekrarAraligiBaslik(tekrar.tekrarAraligi)}
              </span>
            </div>

            {/* Geri sayim */}
            {tekrar.aktif && (
              <p
                className={`text-sm font-medium mt-1 ${
                  sureDoldu ? "text-red-600" : "text-blue-600"
                }`}
              >
                {geriSayimMetni(tekrar.sonrakiTarih)}
              </p>
            )}

            {/* Ilerleme cubugu */}
            {tekrar.aktif && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    sureDoldu ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${yuzde}%` }}
                />
              </div>
            )}

            {tekrar.veterinerAdi && (
              <p className="text-xs text-gray-400 mt-1">
                Dr. {tekrar.veterinerAdi}
              </p>
            )}
            {tekrar.not && (
              <p className="text-xs text-gray-500 mt-0.5 italic">
                {tekrar.not}
              </p>
            )}

            {/* Uygulandi butonu */}
            {tekrar.aktif && (
              <button
                type="button"
                onClick={() => tekrar.id && onTamamla(tekrar.id)}
                className={`mt-2 flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  sureDoldu
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                <CheckCircle size={14} />
                Uygulandi
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => tekrar.id && onToggle(tekrar.id)}
            className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"
            title={tekrar.aktif ? "Duraklat" : "Devam et"}
          >
            {tekrar.aktif ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={() => tekrar.id && onSil(tekrar.id)}
            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsiTimerCard;
