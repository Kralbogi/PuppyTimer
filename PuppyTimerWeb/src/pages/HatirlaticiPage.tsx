// =============================================================================
// PawLand - Hatırlatıcı Sistemi
// localStorage tabanlı in-app hatırlatıcılar
// =============================================================================

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, X, Trash2, Bell, BellOff, Edit2 } from "lucide-react";
import type { Hatirlatici, HatirlaticiTuru } from "../types/models";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../services/firebase";
import { kullaniciIdGetir } from "../services/kullaniciKimlik";
import { fcmTokenKaydet } from "../services/fcmService";

const TUR_BILGI: Record<HatirlaticiTuru, { label: string; emoji: string; color: string; bg: string }> = {
  beslenme: { label: "Beslenme", emoji: "", color: "text-orange-600", bg: "bg-orange-50" },
  yuruyus: { label: "Yürüyüş", emoji: "", color: "text-green-600", bg: "bg-green-50" },
  ilac: { label: "İlaç", emoji: "", color: "text-pink-600", bg: "bg-pink-50" },
  asi: { label: "Aşı", emoji: "", color: "text-red-600", bg: "bg-red-50" },
  bakim: { label: "Bakım", emoji: "", color: "text-cyan-600", bg: "bg-cyan-50" },
  veteriner: { label: "Veteriner", emoji: "", color: "text-blue-600", bg: "bg-blue-50" },
  diger: { label: "Diğer", emoji: "", color: "text-gray-600", bg: "bg-gray-50" },
};

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function storageKey(kopekId: number) {
  return `pawland_hatirlaticilar_${kopekId}`;
}

function loadHatirlaticilar(kopekId: number): Hatirlatici[] {
  try {
    const raw = localStorage.getItem(storageKey(kopekId));
    if (!raw) return [];
    return JSON.parse(raw) as Hatirlatici[];
  } catch {
    return [];
  }
}

function saveHatirlaticilar(kopekId: number, liste: Hatirlatici[]) {
  localStorage.setItem(storageKey(kopekId), JSON.stringify(liste));
}

function generateId() {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Hatırlatıcıları Firestore'a senkronize et (Cloud Function bu koleksiyonu okur)
async function firestoreSync(liste: Hatirlatici[]) {
  try {
    const userId = kullaniciIdGetir();
    await setDoc(
      doc(firestore, "hatirlaticilar", userId),
      { liste, guncellenmeTarihi: Date.now() },
      { merge: false }
    );
  } catch {
    // Sessizce geç — localStorage her zaman çalışır
  }
}

export const HatirlaticiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : 0;

  const [hatirlaticilar, setHatirlaticilar] = useState<Hatirlatici[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [duzenleId, setDuzenleId] = useState<string | null>(null);

  // Form state
  const [baslik, setBaslik] = useState("");
  const [tur, setTur] = useState<HatirlaticiTuru>("beslenme");
  const [saat, setSaat] = useState("08:00");
  const [seciliGunler, setSeciliGunler] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    setHatirlaticilar(loadHatirlaticilar(kopekId));
  }, [kopekId]);

  // FCM token al (bildirim izni iste)
  useEffect(() => {
    fcmTokenKaydet().catch(() => {});
  }, []);

  const formTemizle = () => {
    setBaslik("");
    setTur("beslenme");
    setSaat("08:00");
    setSeciliGunler([0, 1, 2, 3, 4, 5, 6]);
    setDuzenleId(null);
  };

  const handleDuzenle = (h: Hatirlatici) => {
    setBaslik(h.baslik);
    setTur(h.tur);
    setSaat(h.saat);
    setSeciliGunler([...h.gunler]);
    setDuzenleId(h.id);
    setShowModal(true);
  };

  const handleKaydet = () => {
    if (!baslik.trim() || seciliGunler.length === 0) return;

    const guncelleme = loadHatirlaticilar(kopekId);

    if (duzenleId) {
      // Güncelle
      const index = guncelleme.findIndex((h) => h.id === duzenleId);
      if (index !== -1) {
        guncelleme[index] = {
          ...guncelleme[index],
          baslik: baslik.trim(),
          tur,
          saat,
          gunler: seciliGunler,
        };
      }
    } else {
      // Yeni ekle
      guncelleme.push({
        id: generateId(),
        kopekId,
        baslik: baslik.trim(),
        tur,
        saat,
        gunler: seciliGunler,
        aktif: true,
        olusturmaTarihi: Date.now(),
      });
    }

    saveHatirlaticilar(kopekId, guncelleme);
    setHatirlaticilar(guncelleme);
    firestoreSync(guncelleme);
    setShowModal(false);
    formTemizle();
  };

  const handleSil = (hId: string) => {
    const ok = window.confirm("Bu hatırlatıcıyı silmek istiyor musunuz?");
    if (!ok) return;

    const yeni = hatirlaticilar.filter((h) => h.id !== hId);
    saveHatirlaticilar(kopekId, yeni);
    setHatirlaticilar(yeni);
    firestoreSync(yeni);
  };

  const handleToggle = (hId: string) => {
    const yeni = hatirlaticilar.map((h) =>
      h.id === hId ? { ...h, aktif: !h.aktif } : h
    );
    saveHatirlaticilar(kopekId, yeni);
    setHatirlaticilar(yeni);
    firestoreSync(yeni);
  };

  const toggleGun = (g: number) => {
    setSeciliGunler((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g].sort()
    );
  };

  const gunleriYaz = (gunler: number[]) => {
    if (gunler.length === 7) return "Her gün";
    if (gunler.length === 0) return "Gün seçilmedi";
    const haftaici = [0, 1, 2, 3, 4];
    const hafta_sonu = [5, 6];
    const tamHaftaici = haftaici.every((g) => gunler.includes(g));
    const tamHaftasonu = hafta_sonu.every((g) => gunler.includes(g));
    if (tamHaftaici && gunler.length === 5) return "Hafta içi";
    if (tamHaftasonu && gunler.length === 2) return "Hafta sonu";
    return gunler.map((g) => GUNLER[g]).join(", ");
  };

  const aktifSayisi = hatirlaticilar.filter((h) => h.aktif).length;

  return (
    <div className="pb-24 px-4 pt-6" style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Hatırlatıcılar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {aktifSayisi} aktif · {hatirlaticilar.length} toplam
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
        >
          <Plus size={22} className="text-white" />
        </button>
      </div>

      {/* Bilgi Kartı */}
      <div className="border rounded-2xl p-4 mb-6" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <div className="flex items-start gap-3">
          <Bell size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Hatırlatıcılar bu cihaza push bildirim olarak gönderilir — uygulama kapalı olsa bile.
          </p>
        </div>
      </div>

      {/* Hatırlatıcı Listesi */}
      {hatirlaticilar.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Henüz hatırlatıcı yok</h3>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            + butonuna dokunarak ilk hatırlatıcınızı oluşturun
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hatirlaticilar
            .sort((a, b) => a.saat.localeCompare(b.saat))
            .map((h) => {
              const bilgi = TUR_BILGI[h.tur];
              return (
                <div
                  key={h.id}
                  className={`rounded-2xl border p-4 smooth-transition ${
                    h.aktif ? "" : "opacity-50"
                  }`}
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
                >
                  <div className="flex items-start gap-3">
                    {/* İkon */}
                    <div className={`${bilgi.bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                      {bilgi.emoji}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{h.baslik}</h4>
                        <span className="text-lg font-bold ml-2 flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                          {h.saat}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${bilgi.color}`}>{bilgi.label}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>·</span>
                        <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{gunleriYaz(h.gunler)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alt butonlar */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <button
                      type="button"
                      onClick={() => handleDuzenle(h)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Edit2 size={13} />
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSil(h.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(h.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        h.aktif
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {h.aktif ? <Bell size={13} /> : <BellOff size={13} />}
                      {h.aktif ? "Aktif" : "Pasif"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Ekleme / Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div
            className="rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--color-bg-card)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {duzenleId ? "Hatırlatıcıyı Düzenle" : "Yeni Hatırlatıcı"}
              </h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); formTemizle(); }}
                className="p-2 rounded-full"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Başlık */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Başlık *</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="ör. Sabah beslenme zamanı"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-orange-400"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            {/* Tür */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Tür</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(TUR_BILGI) as [HatirlaticiTuru, typeof TUR_BILGI[HatirlaticiTuru]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTur(key)}
                      className={`py-2 px-1 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                        tur === key
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : ""
                      }`}
                      style={tur !== key ? { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' } : {}}
                    >
                      <span className="text-xl">{val.emoji}</span>
                      <span className="truncate w-full text-center">{val.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Saat */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Saat</label>
              <input
                type="time"
                value={saat}
                onChange={(e) => setSaat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-orange-400"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            {/* Günler */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Günler</label>
              <div className="flex gap-2 flex-wrap">
                {GUNLER.map((gun, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleGun(i)}
                    className="w-10 h-10 rounded-full text-xs font-semibold transition-colors"
                    style={
                      seciliGunler.includes(i)
                        ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                        : { background: 'var(--color-bg)', color: 'var(--color-text-muted)' }
                    }
                  >
                    {gun}
                  </button>
                ))}
              </div>
              {seciliGunler.length === 0 && (
                <p className="text-xs text-red-500 mt-1">En az bir gün seçin</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleKaydet}
              disabled={!baslik.trim() || seciliGunler.length === 0}
              className="w-full text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-50 transition-colors"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              {duzenleId ? "Güncelle" : "Hatırlatıcı Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HatirlaticiPage;
