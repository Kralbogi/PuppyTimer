// =============================================================================
// PawLand - Eğitim Tracker Sayfası
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
    <div className="pb-24 px-4 pt-6" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Eğitim Tracker</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {kopekAdi} için komut ve eğitim takibi
        </p>
      </div>

      {/* İstatistikler */}
      {istatistikler && (
        <div
          className="rounded-2xl soft-shadow border p-4 mb-6"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>İstatistikler</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, rgba(224,122,47,0.08), rgba(224,122,47,0.15))' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {istatistikler.toplamKomut}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Toplam Komut</div>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-2xl font-bold text-green-700">
                {istatistikler.ustalasanKomutSayisi}
              </div>
              <div className="text-xs text-green-600">Ustalaşılan</div>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-2xl font-bold text-blue-700">
                {istatistikler.toplamSeans}
              </div>
              <div className="text-xs text-blue-600">Toplam Seans</div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-1" style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.1), rgba(224,122,47,0.18))' }}>
              <Clock size={16} style={{ color: 'var(--color-primary)' }} />
              <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {istatistikler.ortalamaSure}dk
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kayıt Ekle Butonu */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full text-white rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 font-semibold soft-shadow smooth-transition"
        style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
      >
        <Plus size={20} />
        Yeni Eğitim Kaydı Ekle
      </button>

      {/* Öğrenilen Komutlar */}
      {komutListesi.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
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
                  className="rounded-xl border p-3"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {popKomut && <span className="text-xl">{popKomut.emoji}</span>}
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{komut}</h4>
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
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
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
        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Geçmiş Kayıtlar</h3>
        {kayitlar.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap size={48} className="mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Henüz eğitim kaydı yok</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Yukarıdaki butondan ekleyin
            </p>
          </div>
        ) : (
          kayitlar.map((kayit) => {
            const popKomut = POPULER_KOMUTLAR.find((k) => k.komut === kayit.komut);
            return (
              <div
                key={kayit.id}
                className="rounded-2xl soft-shadow border p-4"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(224,122,47,0.1)' }}
                    >
                      <span className="text-xl">{popKomut?.emoji || ""}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{kayit.komut}</h4>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Target size={12} />
                            {kayit.basariOrani}%
                          </span>
                        )}
                        {kayit.sure && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(224,122,47,0.1)', color: 'var(--color-primary)' }}>
                            <Clock size={12} />
                            {kayit.sure}dk
                          </span>
                        )}
                      </div>
                      {kayit.not && (
                        <p className="text-sm mt-2 italic" style={{ color: 'var(--color-text-muted)' }}>
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
            className="rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--color-bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Eğitim Kaydı Ekle
            </h2>

            {/* Komut Seçimi */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Komut Seç veya Yeni Ekle
              </label>
              <select
                value={secilenKomut}
                onChange={(e) => setSecilenKomut(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border mb-2"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="">Popüler Komutlar</option>
                {POPULER_KOMUTLAR.map((k) => (
                  <option key={k.komut} value={k.komut}>
                    {k.emoji} {k.komut} ({k.kategori})
                  </option>
                ))}
                <option value="yeni"> Yeni Komut Ekle</option>
              </select>

              {secilenKomut === "yeni" && (
                <input
                  type="text"
                  value={yeniKomut}
                  onChange={(e) => setYeniKomut(e.target.value)}
                  placeholder="Komut adı girin (ör: Slalom)"
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
              )}
            </div>

            {/* Seviye */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
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
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {seviyeEmoji(s)} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Başarı Oranı */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Süre (dakika) - Opsiyonel
              </label>
              <input
                type="number"
                value={sure}
                onChange={(e) => setSure(e.target.value)}
                placeholder="15"
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Not */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Not - Opsiyonel
              </label>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Eğitim detayları..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border resize-none"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium"
                style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}
              >
                İptal
              </button>
              <button
                onClick={handleEkle}
                className="flex-1 px-4 py-3 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
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
