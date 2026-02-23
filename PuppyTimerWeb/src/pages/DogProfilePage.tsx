// =============================================================================
// PuppyTimer Web - DogProfilePage
// Dog profile with avatar, info cards, summary stats, and inline edit mode
// =============================================================================

import React, { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Timer,
  Footprints,
  Syringe,
  Pill,
  Leaf,
  MapPin,
  Pencil,
  Check,
  Weight,
  Venus,
  Mars,
  Calendar,
  Heart,
  Scissors,
  Trophy,
} from "lucide-react";
import AnimatedDog3D from "../components/common/AnimatedDog3D";
import BreedSelector from "../components/common/BreedSelector";
import PhotoPicker from "../components/common/PhotoPicker";
import AccessorySelector from "../components/dog/AccessorySelector";
import FrameSelector from "../components/dog/FrameSelector";
import MessageColorSelector from "../components/dog/MessageColorSelector";
import { db } from "../db/database";
import { cinsiyetBaslik, kisilikEtiketiBaslik, kisilikEtiketiRenk, kisilikEtiketiListesi, CerceveTipi, MesajRengi } from "../types/enums";
import type { KisilikEtiketi } from "../types/enums";
import type { Kopek } from "../types/models";
import { cartoonFiltresiUygula } from "../services/cartoonFilter";
import { kullaniciToplamBegenileriniGetir } from "../services/toplulukKopekService";
import { kopekFirestoreKaydet } from "../services/kopekSenkronizasyon";
import Balloons from "../components/common/Balloons";
import { bugunDogumGunuMu } from "../services/dateUtils";
import { premiumMi, renkDegisiklikHakkiKontrol, renkDegisiklikSayaciniArtir, isimDegisiklikHakkiKontrol, isimDegisiklikSayaciniArtir } from "../services/premiumService";

// -----------------------------------------------------------------------------
// Helper: Calculate age from birthdate timestamp
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Stat Box Component
// -----------------------------------------------------------------------------

interface StatBoxProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconColor: string;
  count: number;
  label: string;
}

const StatBox: React.FC<StatBoxProps> = ({
  icon: Icon,
  iconColor,
  count,
  label,
}) => {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <Icon size={24} className={iconColor} />
      <span className="text-xl font-bold text-gray-900">{count}</span>
      <span className="text-xs text-gray-500 text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Info Card Component (3-column grid)
// -----------------------------------------------------------------------------

interface InfoCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconColor: string;
  label: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  iconColor,
  label,
  value,
}) => {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <Icon size={20} className={iconColor} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main DogProfilePage Component
// -----------------------------------------------------------------------------

interface DogProfilePageProps {
  kopekId: number;
}

export const DogProfilePage: React.FC<DogProfilePageProps> = ({ kopekId }) => {
  const [editMode, setEditMode] = useState(false);
  const [editAd, setEditAd] = useState("");
  const [editIrk, setEditIrk] = useState("");
  const [editAgirlik, setEditAgirlik] = useState("");
  const [editFoto, setEditFoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editEtiketler, setEditEtiketler] = useState<string[]>([]);
  const [editKisir, setEditKisir] = useState(false);
  const [editRenkler, setEditRenkler] = useState<{ primary: string; secondary: string; belly: string } | undefined>(undefined);
  const [editAksesuarlar, setEditAksesuarlar] = useState<string[]>([]);
  const [editCerceve, setEditCerceve] = useState<CerceveTipi>(CerceveTipi.Normal);
  const [editMesajRengi, setEditMesajRengi] = useState<MesajRengi>(MesajRengi.Varsayilan);
  const [showBirthdayBalloons, setShowBirthdayBalloons] = useState(false);

  // Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [kalanRenkHakki, setKalanRenkHakki] = useState(2);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ---------------------------------------------------------------------------
  // Live queries
  // ---------------------------------------------------------------------------

  const kopek = useLiveQuery(() => db.kopekler.get(kopekId), [kopekId]);

  // ---------------------------------------------------------------------------
  // Birthday check
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (kopek && bugunDogumGunuMu(kopek.dogumTarihi)) {
      setShowBirthdayBalloons(true);
    } else {
      setShowBirthdayBalloons(false);
    }
  }, [kopek?.dogumTarihi]);

  // ---------------------------------------------------------------------------
  // Premium check and color change limit
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkPremium = async () => {
      const premium = await premiumMi();
      setIsPremium(premium);

      if (!premium && kopek?.id) {
        const { kalanHak } = renkDegisiklikHakkiKontrol(kopek.id);
        setKalanRenkHakki(kalanHak);
      }
    };

    checkPremium();
  }, [kopek?.id]);

  // ---------------------------------------------------------------------------
  // Fetch total likes from Firestore
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!kopek || !kopek.ad) return;

    const fetchToplamBegeniler = async () => {
      try {
        const toplamBegeni = await kullaniciToplamBegenileriniGetir(kopek.ad);
        if (toplamBegeni > 0 && kopek.toplamBegeniler !== toplamBegeni) {
          await db.kopekler.update(kopekId, { toplamBegeniler: toplamBegeni });
        }
      } catch (err) {
        console.error("Toplam begeni getirilemedi:", err);
      }
    };

    fetchToplamBegeniler();
  }, [kopek?.ad, kopekId]);

  const aktivBeslenmeCount = useLiveQuery(
    () =>
      db.beslenmeProgramlari
        .where({ kopekId, aktif: 1 })
        .count()
        .catch(() =>
          db.beslenmeProgramlari
            .where("kopekId")
            .equals(kopekId)
            .filter((p) => p.aktif === true)
            .count()
        ),
    [kopekId],
    0
  );

  const aktivSuCount = useLiveQuery(
    () =>
      db.suProgramlari
        .where({ kopekId, aktif: 1 })
        .count()
        .catch(() =>
          db.suProgramlari
            .where("kopekId")
            .equals(kopekId)
            .filter((p) => p.aktif === true)
            .count()
        ),
    [kopekId],
    0
  );

  const aktivYuruyusCount = useLiveQuery(
    () =>
      db.yuruyusProgramlari
        .where({ kopekId, aktif: 1 })
        .count()
        .catch(() =>
          db.yuruyusProgramlari
            .where("kopekId")
            .equals(kopekId)
            .filter((p) => p.aktif === true)
            .count()
        ),
    [kopekId],
    0
  );

  const asiCount = useLiveQuery(
    () => db.asiKayitlari.where("kopekId").equals(kopekId).count(),
    [kopekId],
    0
  );

  const aktivIlacCount = useLiveQuery(
    () =>
      db.ilacTakipleri
        .where({ kopekId, aktif: 1 })
        .count()
        .catch(() =>
          db.ilacTakipleri
            .where("kopekId")
            .equals(kopekId)
            .filter((p) => p.aktif === true)
            .count()
        ),
    [kopekId],
    0
  );

  const bugunTuvaletCount = useLiveQuery(
    () => {
      const bugunBaslangic = new Date();
      bugunBaslangic.setHours(0, 0, 0, 0);
      return db.tuvaletKayitlari
        .where("kopekId")
        .equals(kopekId)
        .filter((k) => k.tarih >= bugunBaslangic.getTime())
        .count();
    },
    [kopekId],
    0
  );

  const haritaCount = useLiveQuery(
    () => db.haritaIsaretcileri.where("kopekId").equals(kopekId).count(),
    [kopekId],
    0
  );

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const aktifZamanlayiciCount = useMemo(
    () => (aktivBeslenmeCount ?? 0) + (aktivSuCount ?? 0),
    [aktivBeslenmeCount, aktivSuCount]
  );

  const yasMetni = useMemo(
    () => hesaplaYas(kopek?.dogumTarihi),
    [kopek?.dogumTarihi]
  );

  // ---------------------------------------------------------------------------
  // Edit mode handlers
  // ---------------------------------------------------------------------------

  const startEdit = () => {
    if (!kopek) return;
    setEditAd(kopek.ad);
    setEditIrk(kopek.irk);
    setEditAgirlik(kopek.agirlik != null ? String(kopek.agirlik) : "");
    setEditFoto(kopek.fotoData ?? null);
    setEditEtiketler(kopek.kisilikEtiketleri ?? []);
    setEditKisir(kopek.kisir ?? false);
    setEditRenkler(kopek.renkler);
    setEditAksesuarlar(kopek.aksesuarlar ?? []);
    setEditCerceve(kopek.cerceveTipi ?? CerceveTipi.Normal);
    setEditMesajRengi(kopek.mesajRengi ?? MesajRengi.Varsayilan);
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!kopek || !kopek.id) return;
    setSaving(true);
    try {
      const updates: Partial<Kopek> = {};

      // İsim değişikliği kontrolü
      const isimDegisti = editAd.trim() !== kopek.ad;
      if (isimDegisti) {
        const { kalanHak, beklemeSuresi } = isimDegisiklikHakkiKontrol(kopek.id, isPremium);

        if (kalanHak <= 0 && beklemeSuresi !== null) {
          // Premium kullanıcı 24 saat beklemeli
          const kalanSaat = Math.ceil(beklemeSuresi / (60 * 60 * 1000));
          alert(`İsim değiştirme hakkınız doldu. ${kalanSaat} saat sonra tekrar deneyebilirsiniz.`);
          setSaving(false);
          return;
        }

        if (kalanHak <= 0) {
          // Normal kullanıcı premium'a geçmeli
          alert(`İsim değiştirme hakkınız doldu. Premium'a geçerek ${isPremium ? '24 saat sonra' : 'daha fazla'} isim değiştirebilirsiniz.`);
          setSaving(false);
          return;
        }

        updates.ad = editAd.trim();

        // Sayacı artır
        isimDegisiklikSayaciniArtir(kopek.id);
      } else if (editAd.trim()) {
        updates.ad = editAd.trim();
      }

      if (editIrk.trim() !== kopek.irk) updates.irk = editIrk.trim();
      const agirlikNum = parseFloat(editAgirlik);
      if (!isNaN(agirlikNum) && agirlikNum > 0) {
        updates.agirlik = agirlikNum;
      } else if (editAgirlik === "") {
        updates.agirlik = undefined;
      }

      // Foto degistiyse cartoon avatar olustur
      if (editFoto !== kopek.fotoData) {
        updates.fotoData = editFoto ?? undefined;
        if (editFoto) {
          try {
            updates.avatarData = await cartoonFiltresiUygula(editFoto, 512);
          } catch {
            // Cartoon filtresi basarisiz olursa devam et
          }
        } else {
          updates.avatarData = undefined;
        }
      }

      // Kisilik etiketleri
      updates.kisilikEtiketleri = editEtiketler;

      // Kisir durumu
      updates.kisir = editKisir;

      // Aksesuarlar (Premium özellik - sadece kaydet)
      if (isPremium) {
        updates.aksesuarlar = editAksesuarlar;
      }

      // Çerçeve Tipi (Premium özellik - sadece kaydet)
      if (isPremium && editCerceve !== CerceveTipi.Normal) {
        updates.cerceveTipi = editCerceve;
      } else if (!isPremium) {
        updates.cerceveTipi = CerceveTipi.Normal;
      } else {
        updates.cerceveTipi = editCerceve;
      }

      // Mesaj Rengi (Premium özellik - sadece kaydet)
      if (isPremium && editMesajRengi !== MesajRengi.Varsayilan) {
        updates.mesajRengi = editMesajRengi;
      } else if (!isPremium) {
        updates.mesajRengi = MesajRengi.Varsayilan;
      } else {
        updates.mesajRengi = editMesajRengi;
      }

      // Renkler - Premium kontrolü
      const renklerDegisti = JSON.stringify(editRenkler) !== JSON.stringify(kopek.renkler);
      if (editRenkler && renklerDegisti) {
        // Premium değilse ve hakkı yoksa uyarı göster
        if (!isPremium && kalanRenkHakki <= 0) {
          setShowPremiumModal(true);
          setSaving(false);
          return;
        }

        updates.renkler = editRenkler;

        // Free kullanıcı için sayacı artır
        if (!isPremium) {
          renkDegisiklikSayaciniArtir(kopek.id);
          setKalanRenkHakki(kalanRenkHakki - 1);
        }
      }

      await db.kopekler.update(kopek.id, updates);

      // Firestore'a da kaydet
      const updatedKopek = await db.kopekler.get(kopek.id);
      if (updatedKopek) {
        await kopekFirestoreKaydet(updatedKopek);
      }

      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (!kopek) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Yukleniyor...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 3D Animated Dog + Name + Breed */}
      <div className="flex flex-col items-center gap-2">
        <AnimatedDog3D
          irk={kopek.irk}
          size={160}
          fotoData={kopek.fotoData}
          showColorPicker={editMode}
          customColors={editMode ? editRenkler : kopek.renkler}
          onColorChange={editMode ? setEditRenkler : undefined}
          aksesuarlar={editMode ? editAksesuarlar : kopek.aksesuarlar}
        />
        <p className="text-[10px] text-gray-300 -mt-2">Dokun veya dondur!</p>

        {/* Renk değiştirme hakkı göstergesi (sadece free users için) */}
        {editMode && !isPremium && (
          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
            Kalan renk değiştirme hakkı: {kalanRenkHakki}/2
          </div>
        )}

        {editMode ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {/* Foto degistir */}
            <div className="w-full">
              <PhotoPicker
                fotoData={editFoto}
                onChange={(data) => setEditFoto(data)}
              />
            </div>
            <input
              type="text"
              value={editAd}
              onChange={(e) => setEditAd(e.target.value)}
              className="text-center text-2xl font-bold w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
            <div className="w-full">
              <BreedSelector
                value={editIrk}
                onChange={setEditIrk}
                placeholder="Cins seciniz..."
              />
            </div>

            {/* Aksesuar Seçici (Premium) */}
            <div className="w-full">
              <AccessorySelector
                seciliAksesuarlar={editAksesuarlar}
                onChange={setEditAksesuarlar}
                isPremium={isPremium}
              />
            </div>

            {/* Çerçeve Seçici (Premium) */}
            <div className="w-full">
              <FrameSelector
                seciliCerceve={editCerceve}
                onChange={setEditCerceve}
                isPremium={isPremium}
              />
            </div>

            {/* Mesaj Rengi Seçici (Premium) */}
            <div className="w-full">
              <MessageColorSelector
                seciliRenk={editMesajRengi}
                onChange={setEditMesajRengi}
                isPremium={isPremium}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{kopek.ad}</h1>
              <div className="flex items-center gap-1 px-2 py-1 bg-pink-50 rounded-full">
                <Heart size={14} className="text-pink-500 fill-pink-500" />
                <span className="text-xs font-semibold text-pink-600">
                  {kopek.toplamBegeniler ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full border border-orange-200">
                <Trophy size={14} className="text-orange-500" />
                <span className="text-xs font-semibold text-orange-600">
                  {kopek.puan ?? 0}
                </span>
              </div>
            </div>
            {kopek.irk && (
              <p className="text-sm text-gray-500 -mt-1">{kopek.irk}</p>
            )}
          </>
        )}

        {/* Edit / Done button */}
        <button
          type="button"
          onClick={editMode ? saveEdit : startEdit}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full border transition-colors disabled:opacity-50"
          style={{
            borderColor: editMode ? "#22c55e" : "#d1d5db",
            color: editMode ? "#22c55e" : "#6b7280",
          }}
        >
          {saving ? (
            <span>Kaydediliyor...</span>
          ) : editMode ? (
            <>
              <Check size={14} />
              Bitti
            </>
          ) : (
            <>
              <Pencil size={14} />
              Duzenle
            </>
          )}
        </button>
      </div>

      {/* 3-column info grid: Gender, Weight, Age */}
      <div className="grid grid-cols-3 gap-3">
        <InfoCard
          icon={kopek.cinsiyet === "Erkek" ? Mars : Venus}
          iconColor={
            kopek.cinsiyet === "Erkek" ? "text-blue-500" : "text-pink-500"
          }
          label="Cinsiyet"
          value={cinsiyetBaslik(kopek.cinsiyet)}
        />
        <InfoCard
          icon={Weight}
          iconColor="text-purple-500"
          label="Agirlik"
          value={
            editMode ? (
              ""
            ) : kopek.agirlik != null ? (
              `${kopek.agirlik} kg`
            ) : (
              "-"
            )
          }
        />
        <InfoCard
          icon={Calendar}
          iconColor="text-teal-500"
          label="Yas"
          value={yasMetni}
        />
      </div>

      {/* Kisilik Etiketleri */}
      {editMode ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Kisilik Ozellikleri
          </label>
          <div className="flex flex-wrap gap-2">
            {kisilikEtiketiListesi.map((etiket) => {
              const secili = editEtiketler.includes(etiket);
              return (
                <button
                  key={etiket}
                  type="button"
                  onClick={() =>
                    setEditEtiketler((prev) =>
                      secili
                        ? prev.filter((e) => e !== etiket)
                        : [...prev, etiket]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    secili
                      ? kisilikEtiketiRenk(etiket) + " ring-2 ring-offset-1 ring-orange-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {kisilikEtiketiBaslik(etiket)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        kopek.kisilikEtiketleri && kopek.kisilikEtiketleri.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kopek.kisilikEtiketleri.map((etiket) => (
              <span
                key={etiket}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${kisilikEtiketiRenk(
                  etiket as KisilikEtiketi
                )}`}
              >
                {kisilikEtiketiBaslik(etiket as KisilikEtiketi)}
              </span>
            ))}
          </div>
        )
      )}

      {/* Edit mode weight and kisir inputs */}
      {editMode && (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Agirlik (kg)
            </label>
            <input
              type="number"
              value={editAgirlik}
              onChange={(e) => setEditAgirlik(e.target.value)}
              placeholder="Ornek: 12.5"
              min="0"
              step="0.1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-xl">
                  <Scissors size={18} className="text-indigo-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kısırlaştırma Durumu
                  </label>
                  <p className="text-xs text-gray-500">
                    Köpeğiniz {editKisir ? "kısırlaştırılmış" : "kısırlaştırılmamış"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditKisir(!editKisir)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  editKisir
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {editKisir ? "Evet" : "Hayır"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Ozet Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Ozet</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={Timer}
            iconColor="text-orange-500"
            count={aktifZamanlayiciCount}
            label="Aktif Zamanlayici"
          />
          <StatBox
            icon={Footprints}
            iconColor="text-green-500"
            count={aktivYuruyusCount ?? 0}
            label="Yuruyus Programi"
          />
          <StatBox
            icon={Syringe}
            iconColor="text-blue-500"
            count={asiCount ?? 0}
            label="Asi Kaydi"
          />
          <StatBox
            icon={Pill}
            iconColor="text-purple-500"
            count={aktivIlacCount ?? 0}
            label="Aktif Ilac"
          />
          <StatBox
            icon={Leaf}
            iconColor="text-amber-600"
            count={bugunTuvaletCount ?? 0}
            label="Tuvalet (Bugun)"
          />
          <StatBox
            icon={MapPin}
            iconColor="text-red-500"
            count={haritaCount ?? 0}
            label="Harita Isaretci"
          />
          <StatBox
            icon={Heart}
            iconColor="text-pink-500"
            count={kopek?.toplamBegeniler ?? 0}
            label="Toplam Begeni"
          />
        </div>
      </div>

      {/* Dogum gunu kutlamasi */}
      {showBirthdayBalloons && (
        <Balloons onComplete={() => setShowBirthdayBalloons(false)} />
      )}

      {/* Premium Modal - Renk değiştirme limiti */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Renk Değiştirme Hakkınız Doldu
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Ücretsiz kullanıcılar sadece 2 kere renk değiştirebilir.
                Sınırsız renk değiştirme ve özel aksesuarlar için Premium'a geçin!
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left space-y-2 mb-4">
                <p className="text-sm font-semibold text-orange-900">Premium Özellikleri:</p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>✨ Sınırsız renk değiştirme</li>
                  <li>🎩 Özel takı ve kıyafetler</li>
                  <li>🎨 Daha fazla özelleştirme seçeneği</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPremiumModal(false);
                  window.location.href = "/#/settings";
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-colors"
              >
                Premium'a Geç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogProfilePage;
