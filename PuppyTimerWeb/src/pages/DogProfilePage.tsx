// =============================================================================
// PawLand - DogProfilePage
// Dog profile with avatar, info cards, summary stats, and inline edit mode
// =============================================================================

import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
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
  QrCode,
  Share2,
  Bot,
} from "lucide-react";
const AnimatedDog3D = lazy(() => import("../components/common/AnimatedDog3D"));
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
import QRCodeModal from "../components/dog/QRCodeModal";
import SocialShareCard from "../components/dog/SocialShareCard";
import AIAssistantModal from "../components/ai/AIAssistantModal";

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

  if (yil > 0 && ay > 0) return `${yil} yıl ${ay} ay`;
  if (yil > 0) return `${yil} yıl`;
  if (ay > 0) return `${ay} ay`;

  const gunFark = Math.floor(
    (simdi.getTime() - dogum.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (gunFark > 0) return `${gunFark} gün`;
  return "Yeni doğan";
}

// -----------------------------------------------------------------------------
// Stat Box Component
// -----------------------------------------------------------------------------

interface StatBoxProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  count: number;
  label: string;
}

const StatBox: React.FC<StatBoxProps> = ({ icon: Icon, iconBg, iconColor, count, label }) => {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 smooth-transition card-hover-lift"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>{count}</p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Info Card Component (3-column grid)
// -----------------------------------------------------------------------------

interface InfoCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, iconBg, iconColor, label, value }) => {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl p-4 smooth-transition"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div className={`${iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>{value}</p>
      </div>
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

  // QR Code modal state
  const [showQRModal, setShowQRModal] = useState(false);

  // Social share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // AI Assistant modal state
  const [showAIModal, setShowAIModal] = useState(false);

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
        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="pb-10 smooth-transition" style={{ background: 'var(--color-bg)' }}>

      {/* ── HERO BANNER ───────────────────────────────────────────────── */}
      <div className="relative">
        {/* Gradient background */}
        <div className="h-36 w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #ff8c42 0%, #e07a2f 60%, #f59e0b 100%)' }}>
          <div className="absolute top-3 right-10 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute top-10 right-24 w-14 h-14 rounded-full bg-white/10" />
          <div className="absolute -top-2 left-6 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-bg))' }} />
        </div>

        {/* Floating avatar */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-bg-card)' }}>
              <Suspense fallback={<div className="w-full h-full animate-pulse" style={{ background: 'var(--color-border-light)' }} />}>
                <AnimatedDog3D
                  irk={kopek.irk}
                  size={128}
                  fotoData={kopek.fotoData}
                  showColorPicker={false}
                  customColors={editMode ? editRenkler : kopek.renkler}
                  aksesuarlar={editMode ? editAksesuarlar : kopek.aksesuarlar}
                />
              </Suspense>
            </div>
            {/* Heart badge */}
            <div className="absolute -top-1 -right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full shadow-md" style={{ background: '#ec4899' }}>
              <Heart size={9} className="text-white fill-white" />
              <span className="text-[10px] font-bold text-white">{kopek.toplamBegeniler ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for avatar */}
      <div className="h-20" />

      {/* ── NAME + BREED + TAGS ───────────────────────────────────────── */}
      <div className="flex flex-col items-center px-4 gap-1.5">
        <p className="text-[10px]" style={{ color: 'var(--color-border)' }}>Dokun veya döndür!</p>

        {editMode ? (
          <div className="w-full px-4 mt-2 space-y-3">
            {/* Fotoğraf + İsim */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <PhotoPicker fotoData={editFoto} onChange={(data) => setEditFoto(data)} />
              <input
                type="text"
                value={editAd}
                onChange={(e) => setEditAd(e.target.value)}
                className="text-center text-xl font-bold w-full px-3 py-2 rounded-xl outline-none smooth-transition"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(224,122,47,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Renk özelleştir */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>3D Model Rengi</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {isPremium ? 'Sınırsız renk değiştirme' : `Kalan hak: ${kalanRenkHakki}/2`}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Suspense fallback={null}>
                  <AnimatedDog3D
                    irk={kopek.irk}
                    size={160}
                    fotoData={kopek.fotoData}
                    showColorPicker={true}
                    customColors={editRenkler}
                    onColorChange={setEditRenkler}
                    aksesuarlar={editAksesuarlar}
                  />
                </Suspense>
              </div>
            </div>

            {/* Aksesuarlar */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <AccessorySelector seciliAksesuarlar={editAksesuarlar} onChange={setEditAksesuarlar} isPremium={isPremium} onPremiumUpsell={() => setShowPremiumModal(true)} />
            </div>

            {/* Çerçeve */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <FrameSelector seciliCerceve={editCerceve} onChange={setEditCerceve} isPremium={isPremium} onPremiumUpsell={() => setShowPremiumModal(true)} />
            </div>

            {/* Mesaj rengi */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <MessageColorSelector seciliRenk={editMesajRengi} onChange={setEditMesajRengi} isPremium={isPremium} onPremiumUpsell={() => setShowPremiumModal(true)} />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{kopek.ad}</h1>
            {kopek.irk && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{kopek.irk}</p>}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Trophy size={12} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-600">{kopek.puan ?? 0} puan</span>
              </div>
              {kopek.kisir && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Scissors size={11} className="text-indigo-500" />
                  <span className="text-xs font-medium text-indigo-600">Kısırlaştırılmış</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Kişilik etiketleri */}
        {!editMode && kopek.kisilikEtiketleri && kopek.kisilikEtiketleri.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {kopek.kisilikEtiketleri.map((etiket) => (
              <span key={etiket} className={`px-2.5 py-1 rounded-full text-xs font-medium ${kisilikEtiketiRenk(etiket as KisilikEtiketi)}`}>
                {kisilikEtiketiBaslik(etiket as KisilikEtiketi)}
              </span>
            ))}
          </div>
        )}

        {editMode && (
          <div className="px-4 w-full">
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Kişilik Özellikleri</p>
              <div className="flex flex-wrap gap-2">
                {kisilikEtiketiListesi.map((etiket) => {
                  const secili = editEtiketler.includes(etiket);
                  return (
                    <button key={etiket} type="button"
                      onClick={() => setEditEtiketler((prev) => secili ? prev.filter((e) => e !== etiket) : [...prev, etiket])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${secili ? kisilikEtiketiRenk(etiket) + " ring-2 ring-offset-1 ring-orange-400" : ""}`}
                      style={!secili ? { background: 'var(--color-border-light)', color: 'var(--color-text-muted)' } : undefined}
                    >{kisilikEtiketiBaslik(etiket)}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-3">
          {!editMode && (
            <>
              <button type="button" onClick={() => setShowAIModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl smooth-transition"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Bot size={14} /><span>AI</span>
              </button>
              <button type="button" onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl smooth-transition"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Share2 size={14} /><span>Paylaş</span>
              </button>
              <button type="button" onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl smooth-transition"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <QrCode size={14} /><span>QR</span>
              </button>
            </>
          )}
          <button type="button" onClick={editMode ? saveEdit : startEdit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl smooth-transition disabled:opacity-50 text-white"
            style={{ background: editMode ? '#22c55e' : 'linear-gradient(135deg, #ff8c42, #e07a2f)', boxShadow: '0 2px 8px rgba(224,122,47,0.3)' }}>
            {saving ? <span>Kaydediliyor...</span> : editMode ? <><Check size={14} />Bitti</> : <><Pencil size={14} />Düzenle</>}
          </button>
        </div>
      </div>

      {/* ── INFO CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-6">
        <InfoCard
          icon={kopek.cinsiyet === "Erkek" ? Mars : Venus}
          iconBg={kopek.cinsiyet === "Erkek" ? "bg-blue-100" : "bg-pink-100"}
          iconColor={kopek.cinsiyet === "Erkek" ? "text-blue-500" : "text-pink-500"}
          label="Cinsiyet"
          value={cinsiyetBaslik(kopek.cinsiyet)}
        />
        <InfoCard
          icon={Weight}
          iconBg="bg-purple-100"
          iconColor="text-purple-500"
          label="Ağırlık"
          value={editMode ? "" : kopek.agirlik != null ? `${kopek.agirlik} kg` : "-"}
        />
        <InfoCard
          icon={Calendar}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          label="Yaş"
          value={yasMetni}
        />
      </div>

      {/* Edit mode: weight & kisir */}
      {editMode && (
        <div className="px-4 mt-3">
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)' }}>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Ağırlık (kg)</label>
              <input type="number" value={editAgirlik} onChange={(e) => setEditAgirlik(e.target.value)}
                placeholder="Örnek: 12.5" min="0" step="0.1"
                className="w-full px-4 py-2.5 rounded-xl outline-none smooth-transition"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(224,122,47,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 w-9 h-9 rounded-xl flex items-center justify-center">
                  <Scissors size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Kısırlaştırma</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{editKisir ? "Kısırlaştırılmış" : "Kısırlaştırılmamış"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditKisir(!editKisir)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${editKisir ? "bg-green-100 text-green-700" : ""}`}
                style={!editKisir ? { background: 'var(--color-border-light)', color: 'var(--color-text-muted)' } : undefined}>
                {editKisir ? "Evet" : "Hayır"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS SECTION ────────────────────────────────────────────── */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--color-text)' }}>Aktivite Özeti</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBox icon={Timer}     iconBg="bg-orange-100" iconColor="text-orange-500" count={aktifZamanlayiciCount}    label="Aktif Zamanlayıcı" />
          <StatBox icon={Footprints} iconBg="bg-green-100"  iconColor="text-green-600"  count={aktivYuruyusCount ?? 0}   label="Yürüyüş Programı" />
          <StatBox icon={Syringe}   iconBg="bg-blue-100"   iconColor="text-blue-500"   count={asiCount ?? 0}            label="Aşı Kaydı" />
          <StatBox icon={Pill}      iconBg="bg-purple-100" iconColor="text-purple-500" count={aktivIlacCount ?? 0}      label="Aktif İlaç" />
          <StatBox icon={Leaf}      iconBg="bg-amber-100"  iconColor="text-amber-600"  count={bugunTuvaletCount ?? 0}   label="Tuvalet (Bugün)" />
          <StatBox icon={MapPin}    iconBg="bg-red-100"    iconColor="text-red-500"    count={haritaCount ?? 0}         label="Harita İşaretçi" />
          <StatBox icon={Heart}     iconBg="bg-pink-100"   iconColor="text-pink-500"   count={kopek?.toplamBegeniler ?? 0} label="Toplam Beğeni" />
        </div>
      </div>

      {/* Dogum gunu kutlamasi */}
      {showBirthdayBalloons && (
        <Balloons onComplete={() => setShowBirthdayBalloons(false)} />
      )}

      {/* Premium Modal - Renk değiştirme limiti */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
            style={{ background: 'var(--color-bg-card)' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Renk Değiştirme Hakkınız Doldu
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Ücretsiz kullanıcılar sadece 2 kere renk değiştirebilir.
                Sınırsız renk değiştirme ve özel aksesuarlar için Premium'a geçin!
              </p>
              <div
                className="rounded-xl p-4 text-left space-y-2 mb-4 border"
                style={{ background: 'rgba(224, 122, 47, 0.06)', borderColor: 'rgba(224, 122, 47, 0.2)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Premium Özellikleri:</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                  <li> Sınırsız renk değiştirme</li>
                  <li> Özel takı ve kıyafetler</li>
                  <li> Daha fazla özelleştirme seçeneği</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-2 rounded-lg smooth-transition"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  background: 'transparent',
                }}
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPremiumModal(false);
                  window.location.href = "/#/settings";
                }}
                className="flex-1 px-4 py-2 text-white font-semibold rounded-lg smooth-transition"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                Premium'a Geç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && kopek && (
        <QRCodeModal kopek={kopek} onClose={() => setShowQRModal(false)} />
      )}

      {/* Social Share Modal */}
      {showShareModal && kopek && (
        <SocialShareCard kopek={kopek} onClose={() => setShowShareModal(false)} />
      )}

      {/* AI Assistant Modal */}
      {showAIModal && kopek && (
        <AIAssistantModal
          dogName={kopek.ad}
          dogBreed={kopek.irk}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
};

export default DogProfilePage;
