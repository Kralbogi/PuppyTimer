// =============================================================================
// PuppyTimer Web - Eğitim Tracker Sayfası
// Köpek eğitimi ve komut öğrenme takibi
// =============================================================================

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GraduationCap, Plus, TrendingUp, Target, Clock, Trophy, Star } from "lucide-react";
import { db } from "../db/database";
import type { EgitimKaydi, EgitimSeviye } from "../types/models";
import {
  egitimKaydiEkle,
  kopekEgitimKayitlariGetir,
  egitimIstatistikleri,
  ogrendigiKomutlar,
  komutBasariOraniHesapla,
  komutSeviyesiGetir,
  egitimKaydiSil,
  seviyeBadgeRengi,
  seviyeEmoji,
  POPULER_KOMUTLAR,
} from "../services/egitimService";
import { egitimBasariKontrol } from "../services/basariService";
import { turkceTarihSaat } from "../services/dateUtils";

export const EgitimTrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [kayitlar, setKayitlar] = useState<EgitimKaydi[]>([]);
  const [istatistikler, setIstatistikler] = useState<any>(null);
  const [komutListesi, setKomutListesi] = useState<string[]>([]);
  const [kopekAdi, setKopekAdi] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [secilenKomut, setSecilenKomut] = useState("");
  const [yeniKomut, setYeniKomut] = useState("");

  // Form state
  const [seviye, setSeviye] = useState<EgitimSeviye>("ogreniyor");
  const [basariOrani, setBasariOrani] = useState(50);
  const [sure, setSure] = useState("");
  const [not, setNot] = useState("");

  useEffect(() => {
    yukle();
  }, [kopekId]);

  const yukle = async () => {
    if (!kopekId) return;

    const kopek = await db.kopekler.get(kopekId);
    if (kopek) setKopekAdi(kopek.ad);

    const data = await kopekEgitimKayitlariGetir(kopekId);
    setKayitlar(data);

    const komutlar = await ogrendigiKomutlar(kopekId);
    setKomutListesi(komutlar);

    const stats = await egitimIstatistikleri(kopekId);
    setIstatistikler(stats);
  };

  const handleEkle = async () => {
    if (!kopekId) return;

    const kullanilacakKomut = secilenKomut === "yeni" ? yeniKomut : secilenKomut;
    if (!kullanilacakKomut.trim()) {
      alert("Lütfen bir komut seçin veya girin");
      return;
    }

    const yeniKayit: Omit<EgitimKaydi, "id"> = {
      kopekId,
      komut: kullanilacakKomut,
      seviye,
      tarih: Date.now(),
      basariOrani,
      sure: sure ? parseInt(sure, 10) : undefined,
      not: not || undefined,
    };

    await egitimKaydiEkle(yeniKayit);
    await egitimBasariKontrol(kopekId);
    await yukle();

    // Reset form
    setShowModal(false);
    setSecilenKomut("");
    setYeniKomut("");
    setSeviye("ogreniyor");
    setBasariOrani(50);
    setSure("");
    setNot("");
  };

  const handleSil = async (id: number) => {
    if (!confirm("Bu eğitim kaydını silmek istediğinizden emin misiniz?")) return;
    await egitimKaydiSil(id);
    await yukle();
  };

  // Komut kartları için detay bilgileri
  const [komutDetaylari, setKomutDetaylari] = useState<
    Record<string, { seviye: EgitimSeviye | null; basariOrani: number }>
  >({});

  useEffect(() => {
    const detaylariYukle = async () => {
      const detaylar: Record<string, { seviye: EgitimSeviye | null; basariOrani: number }> = {};
      for (const komut of komutListesi) {
        const seviye = await komutSeviyesiGetir(kopekId, komut);
        const oran = await komutBasariOraniHesapla(kopekId, komut);
        detaylar[komut] = { seviye, basariOrani: oran };
      }
      setKomutDetaylari(detaylar);
    };

    if (komutListesi.length > 0) {
      detaylariYukle();
    }
  }, [komutListesi, kopekId]);

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eğitim Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {kopekAdi} için komut ve eğitim takibi
        </p>
      </div>

      {/* İstatistikler */}
      {istatistikler && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">İstatistikler</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-3">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {istatistikler.toplamKomut}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Toplam Komut</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {istatistikler.ustalasanKomutSayisi}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Ustalaşılan</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {istatistikler.toplamSeans}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Toplam Seans</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 flex items-center gap-1">
              <Clock size={16} className="text-orange-600" />
              <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {istatistikler.ortalamaSure}dk
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kayıt Ekle Butonu */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 font-semibold shadow-lg"
      >
        <Plus size={20} />
        Yeni Eğitim Kaydı Ekle
      </button>

      {/* Öğrenilen Komutlar */}
      {komutListesi.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            Öğrenilen Komutlar ({komutListesi.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {komutListesi.map((komut) => {
              const detay = komutDetaylari[komut];
              const popKomut = POPULER_KOMUTLAR.find((k) => k.komut === komut);
              return (
                <div
                  key={komut}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {popKomut && <span className="text-xl">{popKomut.emoji}</span>}
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{komut}</h4>
                  </div>
                  {detay && detay.seviye && (
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${seviyeBadgeRengi(
                          detay.seviye
                        )}`}
                      >
                        {seviyeEmoji(detay.seviye)} {detay.seviye}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {detay.basariOrani}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Geçmiş Kayıtlar */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Geçmiş Kayıtlar</h3>
        {kayitlar.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Henüz eğitim kaydı yok</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Yukarıdaki butondan ekleyin
            </p>
          </div>
        ) : (
          kayitlar.map((kayit) => {
            const popKomut = POPULER_KOMUTLAR.find((k) => k.komut === kayit.komut);
            return (
              <div
                key={kayit.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-xl">{popKomut?.emoji || "🎓"}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{kayit.komut}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {turkceTarihSaat(kayit.tarih)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${seviyeBadgeRengi(
                            kayit.seviye
                          )}`}
                        >
                          {seviyeEmoji(kayit.seviye)} {kayit.seviye}
                        </span>
                        {kayit.basariOrani !== undefined && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Target size={12} />
                            {kayit.basariOrani}%
                          </span>
                        )}
                        {kayit.sure && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={12} />
                            {kayit.sure}dk
                          </span>
                        )}
                      </div>
                      {kayit.not && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                          "{kayit.not}"
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
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Eğitim Kaydı Ekle
            </h2>

            {/* Komut Seçimi */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Komut Seç veya Yeni Ekle
              </label>
              <select
                value={secilenKomut}
                onChange={(e) => setSecilenKomut(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
              >
                <option value="">Popüler Komutlar</option>
                {POPULER_KOMUTLAR.map((k) => (
                  <option key={k.komut} value={k.komut}>
                    {k.emoji} {k.komut} ({k.kategori})
                  </option>
                ))}
                <option value="yeni">✏️ Yeni Komut Ekle</option>
              </select>

              {secilenKomut === "yeni" && (
                <input
                  type="text"
                  value={yeniKomut}
                  onChange={(e) => setYeniKomut(e.target.value)}
                  placeholder="Komut adı girin (ör: Slalom)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
            </div>

            {/* Seviye */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seviye
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ogreniyor", "ilerliyor", "ustalasti"] as EgitimSeviye[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeviye(s)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      seviye === s
                        ? seviyeBadgeRengi(s)
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {seviyeEmoji(s)} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Başarı Oranı */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başarı Oranı: {basariOrani}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={basariOrani}
                onChange={(e) => setBasariOrani(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Süre */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Süre (dakika) - Opsiyonel
              </label>
              <input
                type="number"
                value={sure}
                onChange={(e) => setSure(e.target.value)}
                placeholder="15"
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
                placeholder="Eğitim detayları..."
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
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

export default EgitimTrackerPage;
