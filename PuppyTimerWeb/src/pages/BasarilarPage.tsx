// =============================================================================
// PuppyTimer Web - Başarılar/Rozetler Sayfası
// Gamification - Achievement showcase
// =============================================================================

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Star, Lock, TrendingUp } from "lucide-react";
import { db } from "../db/database";
import type { Basari, BasariTuru } from "../types/models";
import {
  basarilariGetir,
  basariIstatistikleri,
  tumBasarilariKontrolEt,
  BASARI_TANIMLARI,
} from "../services/basariService";
import { turkceTarih } from "../services/dateUtils";

export const BasarilarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [kazanilanBasarilar, setKazanilanBasarilar] = useState<Basari[]>([]);
  const [istatistikler, setIstatistikler] = useState<any>(null);
  const [kopekAdi, setKopekAdi] = useState("");
  const [kopekPuan, setKopekPuan] = useState(0);

  useEffect(() => {
    yukle();
  }, [kopekId]);

  const yukle = async () => {
    if (!kopekId) return;

    const kopek = await db.kopekler.get(kopekId);
    if (kopek) {
      setKopekAdi(kopek.ad);
      setKopekPuan(kopek.puan || 0);
    }

    // Önce tüm başarıları kontrol et
    await tumBasarilariKontrolEt(kopekId);

    // Sonra kazanılanları getir
    const basarilar = await basarilariGetir(kopekId);
    setKazanilanBasarilar(basarilar);

    const stats = await basariIstatistikleri(kopekId);
    setIstatistikler(stats);
  };

  // Tüm başarılar (kazanılan + kilitli)
  const tumBasarilar = Object.entries(BASARI_TANIMLARI).map(([tur, tanim]) => {
    const kazanildi = kazanilanBasarilar.find((b) => b.basariTuru === tur);
    return {
      tur: tur as BasariTuru,
      ...tanim,
      kazanildi,
    };
  });

  // Kategorilere ayır
  const kategorilendir = () => {
    return {
      yuruyus: tumBasarilar.filter((b) => b.tur.startsWith("yuruyus")),
      saglik: tumBasarilar.filter((b) => b.tur.includes("asi")),
      bakim: tumBasarilar.filter((b) => b.tur.includes("bakim")),
      egitim: tumBasarilar.filter((b) => b.tur.includes("egitim") || b.tur.includes("komut")),
      sosyal: tumBasarilar.filter((b) => b.tur.includes("arkadas") || b.tur.includes("topluluk")),
      puan: tumBasarilar.filter((b) => b.tur.includes("puan")),
      diger: tumBasarilar.filter((b) => b.tur.includes("harita")),
    };
  };

  const kategoriler = kategorilendir();

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Başarılar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {kopekAdi} için kazanılan rozetler
        </p>
      </div>

      {/* İstatistikler Kartı */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Toplam Başarı</h3>
              <p className="text-purple-100 text-sm">{kopekAdi}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {istatistikler?.toplamBasari || 0}
            </div>
            <div className="text-purple-100 text-xs">/{Object.keys(BASARI_TANIMLARI).length}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-yellow-300" />
              <span className="text-xs text-purple-100">Toplam Puan</span>
            </div>
            <div className="text-xl font-bold text-white">{kopekPuan}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-300" />
              <span className="text-xs text-purple-100">İlerleme</span>
            </div>
            <div className="text-xl font-bold text-white">
              {Math.round(
                ((istatistikler?.toplamBasari || 0) / Object.keys(BASARI_TANIMLARI).length) * 100
              )}
              %
            </div>
          </div>
        </div>

        {istatistikler?.sonBasari && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{istatistikler.sonBasari.iconEmoji}</span>
              <div>
                <div className="text-white font-semibold text-sm">Son Kazanılan</div>
                <div className="text-purple-100 text-xs">
                  {istatistikler.sonBasari.baslik} -{" "}
                  {turkceTarih(istatistikler.sonBasari.kazanilmaTarihi)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kategoriler */}
      <div className="space-y-6">
        {/* Yürüyüş */}
        <KategoriSection baslik="🚶 Yürüyüş" basarilar={kategoriler.yuruyus} />

        {/* Sağlık */}
        <KategoriSection baslik="💉 Sağlık" basarilar={kategoriler.saglik} />

        {/* Bakım */}
        <KategoriSection baslik="✨ Bakım" basarilar={kategoriler.bakim} />

        {/* Eğitim */}
        <KategoriSection baslik="🎓 Eğitim" basarilar={kategoriler.egitim} />

        {/* Sosyal */}
        <KategoriSection baslik="🤝 Sosyal" basarilar={kategoriler.sosyal} />

        {/* Puan */}
        <KategoriSection baslik="⭐ Puan Milestones" basarilar={kategoriler.puan} />

        {/* Diğer */}
        <KategoriSection baslik="🗺️ Keşif" basarilar={kategoriler.diger} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Kategori Bölümü
// -----------------------------------------------------------------------------
const KategoriSection: React.FC<{
  baslik: string;
  basarilar: Array<{
    tur: BasariTuru;
    baslik: string;
    aciklama: string;
    icon: string;
    puan: number;
    kazanildi?: Basari;
  }>;
}> = ({ baslik, basarilar }) => {
  if (basarilar.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{baslik}</h3>
      <div className="grid grid-cols-2 gap-3">
        {basarilar.map((basari) => (
          <BasariKart key={basari.tur} basari={basari} />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Başarı Kartı
// -----------------------------------------------------------------------------
const BasariKart: React.FC<{
  basari: {
    tur: BasariTuru;
    baslik: string;
    aciklama: string;
    icon: string;
    puan: number;
    kazanildi?: Basari;
  };
}> = ({ basari }) => {
  const kazanildi = !!basari.kazanildi;

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        kazanildi
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800"
          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className={`text-4xl ${kazanildi ? "" : "grayscale opacity-40"}`}
          style={{ filter: kazanildi ? "none" : "grayscale(100%)" }}
        >
          {basari.icon}
        </div>
        {!kazanildi && <Lock size={16} className="text-gray-400" />}
      </div>

      <h4
        className={`font-semibold text-sm mb-1 ${
          kazanildi ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {basari.baslik}
      </h4>

      <p
        className={`text-xs mb-2 ${
          kazanildi ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {basari.aciklama}
      </p>

      {basari.puan > 0 && (
        <div className="flex items-center gap-1">
          <Star
            size={12}
            className={kazanildi ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}
          />
          <span
            className={`text-xs font-semibold ${
              kazanildi ? "text-yellow-700 dark:text-yellow-300" : "text-gray-400"
            }`}
          >
            +{basari.puan} puan
          </span>
        </div>
      )}

      {kazanildi && basari.kazanildi && (
        <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {turkceTarih(basari.kazanildi.kazanilmaTarihi)}
          </span>
        </div>
      )}
    </div>
  );
};

export default BasarilarPage;
