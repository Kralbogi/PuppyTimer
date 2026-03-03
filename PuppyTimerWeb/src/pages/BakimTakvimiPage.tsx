// =============================================================================
// PuppyTimer Web - Bakım Takvimi Sayfası
// Banyo, tırnak, traş, diş bakımı takibi
// =============================================================================

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Scissors, Bath, Activity, Sparkles, Plus, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { db } from "../db/database";
import type { BakimKaydi, BakimTuru } from "../types/models";
import {
  bakimKaydiEkle,
  kopekBakimKayitlariGetir,
  sonrakiBakimOneri,
  bakimIstatistikleri,
  yakindaBakimGerekenler,
  bakimKaydiSil,
} from "../services/bakimService";
import { bakimBasariKontrol } from "../services/basariService";
import { turkceTarihSaat, turkceTarih } from "../services/dateUtils";

const BAKIM_TURLERI: Array<{
  tur: BakimTuru;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  aciklama: string;
}> = [
  {
    tur: "banyo",
    label: "Banyo",
    icon: Bath,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    aciklama: "Her 30 günde bir önerilir",
  },
  {
    tur: "tirnak",
    label: "Tırnak Kesimi",
    icon: Scissors,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    aciklama: "Her 21 günde bir önerilir",
  },
  {
    tur: "tras",
    label: "Tüy Traşı",
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    aciklama: "Her 60 günde bir önerilir",
  },
  {
    tur: "dis",
    label: "Diş Temizliği",
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    aciklama: "Haftada 1 kez önerilir",
  },
];

export const BakimTakvimiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [kayitlar, setKayitlar] = useState<BakimKaydi[]>([]);
  const [yakindakiler, setYakindakiler] = useState<BakimKaydi[]>([]);
  const [istatistikler, setIstatistikler] = useState<any>(null);
  const [kopekAdi, setKopekAdi] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [secilenTur, setSecilenTur] = useState<BakimTuru>("banyo");

  // Form state
  const [profesyonel, setProfesyonel] = useState(false);
  const [maliyet, setMaliyet] = useState("");
  const [not, setNot] = useState("");

  useEffect(() => {
    yukle();
  }, [kopekId]);

  const yukle = async () => {
    if (!kopekId) return;

    const kopek = await db.kopekler.get(kopekId);
    if (kopek) setKopekAdi(kopek.ad);

    const data = await kopekBakimKayitlariGetir(kopekId);
    setKayitlar(data);

    const yakindaki = await yakindaBakimGerekenler(kopekId);
    setYakindakiler(yakindaki);

    const stats = await bakimIstatistikleri(kopekId);
    setIstatistikler(stats);
  };

  const handleEkle = async () => {
    if (!kopekId) return;

    const yeniKayit: Omit<BakimKaydi, "id"> = {
      kopekId,
      bakimTuru: secilenTur,
      tarih: Date.now(),
      sonrakiTarih: sonrakiBakimOneri(secilenTur),
      profesyonel,
      maliyet: maliyet ? parseFloat(maliyet) : undefined,
      not: not || undefined,
    };

    await bakimKaydiEkle(yeniKayit);
    await bakimBasariKontrol(kopekId);
    await yukle();

    // Reset form
    setShowModal(false);
    setProfesyonel(false);
    setMaliyet("");
    setNot("");
  };

  const handleSil = async (id: number) => {
    if (!confirm("Bu bakım kaydını silmek istediğinizden emin misiniz?")) return;
    await bakimKaydiSil(id);
    await yukle();
  };

  const getTurBilgi = (tur: BakimTuru) => BAKIM_TURLERI.find((t) => t.tur === tur)!;

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bakım Takvimi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {kopekAdi} için bakım takibi
        </p>
      </div>

      {/* Yakında yapılacak bakımlar */}
      {yakindakiler.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-orange-600" />
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              Yaklaşan Bakımlar
            </h3>
          </div>
          {yakindakiler.map((kayit) => {
            const turBilgi = getTurBilgi(kayit.bakimTuru);
            const Icon = turBilgi.icon;
            return (
              <div key={kayit.id} className="flex items-center gap-3 mt-2">
                <Icon size={16} className={turBilgi.color} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {turBilgi.label} - {turkceTarih(kayit.sonrakiTarih!)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* İstatistikler */}
      {istatistikler && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">İstatistikler</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {istatistikler.toplamKayit}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Toplam Bakım</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {istatistikler.profesyonelSayisi}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Profesyonel</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {istatistikler.evdeSayisi}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Evde Yapılan</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 flex items-center gap-1">
              <DollarSign size={16} className="text-gray-500" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {istatistikler.toplamMaliyet}₺
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bakım türleri - Hızlı ekleme */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BAKIM_TURLERI.map((tur) => {
          const Icon = tur.icon;
          const sayi = istatistikler?.turlereSayilar[tur.tur] || 0;
          return (
            <button
              key={tur.tur}
              onClick={() => {
                setSecilenTur(tur.tur);
                setShowModal(true);
              }}
              className={`${tur.bgColor} rounded-2xl p-4 text-left transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={24} className={tur.color} />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{sayi}×</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{tur.label}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tur.aciklama}</p>
            </button>
          );
        })}
      </div>

      {/* Geçmiş kayıtlar */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Geçmiş Kayıtlar</h3>
        {kayitlar.length === 0 ? (
          <div className="text-center py-12">
            <Scissors size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Henüz bakım kaydı yok</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Yukarıdaki butonlardan ekleyin
            </p>
          </div>
        ) : (
          kayitlar.map((kayit) => {
            const turBilgi = getTurBilgi(kayit.bakimTuru);
            const Icon = turBilgi.icon;
            return (
              <div
                key={kayit.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`${turBilgi.bgColor} w-10 h-10 rounded-full flex items-center justify-center`}>
                      <Icon size={18} className={turBilgi.color} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{turBilgi.label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {turkceTarihSaat(kayit.tarih)}
                      </p>
                      {kayit.profesyonel && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                          Profesyonel
                        </span>
                      )}
                      {kayit.maliyet && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Maliyet: {kayit.maliyet}₺
                        </p>
                      )}
                      {kayit.not && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                          "{kayit.not}"
                        </p>
                      )}
                      {kayit.sonrakiTarih && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                          Sonraki: {turkceTarih(kayit.sonrakiTarih)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSil(kayit.id!)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Yeni kayıt ekle */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {getTurBilgi(secilenTur).label} Ekle
            </h2>

            {/* Profesyonel mi? */}
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={profesyonel}
                onChange={(e) => setProfesyonel(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Profesyonel berber/veteriner
              </span>
            </label>

            {/* Maliyet */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Maliyet (₺) - Opsiyonel
              </label>
              <input
                type="number"
                value={maliyet}
                onChange={(e) => setMaliyet(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Not */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Not - Opsiyonel
              </label>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Detaylar..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleEkle}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BakimTakvimiPage;
