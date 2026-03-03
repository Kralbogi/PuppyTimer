// =============================================================================
// PuppyTimer Web - Photo Gallery Page
// Bağımsız foto galerisi — kamera/galeriden doğrudan fotoğraf eklenebilir
// Takvim ve tuvalet fotoğraflarını da gösterir
// =============================================================================

import React, { useState, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Calendar, MapPin, Trash2, Plus, Camera } from "lucide-react";
import { db } from "../db/database";
import { turkceTarih } from "../services/dateUtils";
import { useLanguage } from "../contexts/LanguageContext";
import type { FotoKategori } from "../types/models";

interface PhotoGalleryPageProps {
  kopekId: number;
}

interface GalleryPhoto {
  id: number;
  fotoData: string;
  tarih: number;
  aciklama?: string;
  tip: "takvim" | "tuvalet" | "galeri";
  kategori?: FotoKategori;
  enlem?: number;
  boylam?: number;
}

const KATEGORI_ETIKETLERI: Record<FotoKategori, { label: string; emoji: string }> = {
  galeri: { label: "Galeri", emoji: "🖼️" },
  oyun: { label: "Oyun", emoji: "🎾" },
  dogumgunu: { label: "Doğum Günü", emoji: "🎂" },
  dis_yuruyus: { label: "Dış Yürüyüş", emoji: "🌳" },
  diger: { label: "Diğer", emoji: "📷" },
};

export const PhotoGalleryPage: React.FC<PhotoGalleryPageProps> = ({ kopekId }) => {
  const { getLocale } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingPhotoData, setPendingPhotoData] = useState<string | null>(null);
  const [newAciklama, setNewAciklama] = useState("");
  const [newKategori, setNewKategori] = useState<FotoKategori>("galeri");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Galeriden bağımsız fotoğraflar
  const fotolar = useLiveQuery(
    () => db.fotolar.where("kopekId").equals(kopekId).reverse().sortBy("tarih"),
    [kopekId]
  );

  // Takvim fotoğrafları
  const takvimFotolari = useLiveQuery(
    () => db.takvimFotolari.where("kopekId").equals(kopekId).toArray(),
    [kopekId]
  );

  // Tuvalet fotoğrafları
  const tuvaletFotolari = useLiveQuery(
    () =>
      db.tuvaletKayitlari
        .where("kopekId")
        .equals(kopekId)
        .filter((t) => t.fotoData !== undefined && t.fotoData !== null)
        .toArray(),
    [kopekId]
  );

  // Tüm fotoğrafları birleştir ve tarihe göre sırala
  const allPhotos = useMemo<GalleryPhoto[]>(() => {
    const photos: GalleryPhoto[] = [];

    if (fotolar) {
      fotolar.forEach((foto) => {
        if (foto.id && foto.fotoData) {
          photos.push({
            id: foto.id,
            fotoData: foto.fotoData,
            tarih: foto.tarih,
            aciklama: foto.aciklama,
            tip: "galeri",
            kategori: foto.kategori,
          });
        }
      });
    }

    if (takvimFotolari) {
      takvimFotolari.forEach((foto: any) => {
        if (foto.id && foto.fotoData) {
          photos.push({
            id: foto.id,
            fotoData: foto.fotoData,
            tarih: foto.tarih,
            aciklama: foto.aciklama,
            tip: "takvim",
          });
        }
      });
    }

    if (tuvaletFotolari) {
      tuvaletFotolari.forEach((kayit) => {
        if (kayit.id && kayit.fotoData) {
          photos.push({
            id: kayit.id,
            fotoData: kayit.fotoData,
            tarih: kayit.tarih,
            aciklama: kayit.not,
            tip: "tuvalet",
            enlem: kayit.enlem,
            boylam: kayit.boylam,
          });
        }
      });
    }

    return photos.sort((a, b) => b.tarih - a.tarih);
  }, [fotolar, takvimFotolari, tuvaletFotolari]);

  // Aylara göre grupla
  const photosByMonth = useMemo(() => {
    const grouped = new Map<string, GalleryPhoto[]>();

    allPhotos.forEach((photo) => {
      const date = new Date(photo.tarih);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(photo);
    });

    return Array.from(grouped.entries()).map(([key, photos]) => ({
      key,
      monthName: new Intl.DateTimeFormat(getLocale(), {
        year: "numeric",
        month: "long",
      }).format(photos[0].tarih),
      photos,
    }));
  }, [allPhotos, getLocale]);

  // Dosya seçildiğinde base64'e çevir
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      if (data) {
        setPendingPhotoData(data);
        setShowAddModal(true);
      }
    };
    reader.readAsDataURL(file);

    // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
    e.target.value = "";
  };

  // Fotoğrafı kaydet
  const handleSave = async () => {
    if (!pendingPhotoData) return;
    setKaydediliyor(true);
    try {
      await db.fotolar.add({
        kopekId,
        fotoData: pendingPhotoData,
        tarih: Date.now(),
        kategori: newKategori,
        aciklama: newAciklama.trim() || undefined,
      });
      setShowAddModal(false);
      setPendingPhotoData(null);
      setNewAciklama("");
      setNewKategori("galeri");
    } catch (err) {
      console.error("Fotoğraf kaydedilemedi:", err);
    } finally {
      setKaydediliyor(false);
    }
  };

  // Seçili fotoğrafı sil
  const handleDelete = async () => {
    if (!selectedPhoto) return;
    const confirmed = window.confirm("Bu fotoğrafı silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      if (selectedPhoto.tip === "galeri") {
        await db.fotolar.delete(selectedPhoto.id);
      } else if (selectedPhoto.tip === "takvim") {
        await db.takvimFotolari.delete(selectedPhoto.id);
      } else if (selectedPhoto.tip === "tuvalet") {
        await db.tuvaletKayitlari.update(selectedPhoto.id, { fotoData: undefined });
      }
      setSelectedPhoto(null);
    } catch (error) {
      console.error("Fotoğraf silinemedi:", error);
    }
  };

  const gosterCount = allPhotos.length;

  return (
    <div className="px-4 py-4 pb-24 relative">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Foto Galeri</h1>
        <p className="text-sm text-gray-500">{gosterCount} fotoğraf</p>
      </div>

      {/* Boş durum */}
      {gosterCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz fotoğraf yok</h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Aşağıdaki + butonuna dokunarak fotoğraf ekleyebilirsiniz
          </p>
        </div>
      )}

      {/* Aylara göre fotoğraflar */}
      {photosByMonth.map(({ key, monthName, photos }) => (
        <div key={key} className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-orange-500" />
            {monthName}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={`${photo.tip}-${photo.id}`}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity relative"
              >
                <img
                  src={photo.fotoData}
                  alt={photo.aciklama || "Köpek fotoğrafı"}
                  className="w-full h-full object-cover"
                />
                {/* Tip badge */}
                {photo.tip === "galeri" && photo.kategori && photo.kategori !== "galeri" && (
                  <div className="absolute bottom-1 right-1 text-base leading-none">
                    {KATEGORI_ETIKETLERI[photo.kategori].emoji}
                  </div>
                )}
                {photo.tip === "tuvalet" && (
                  <div className="absolute bottom-1 right-1 text-base leading-none">🚽</div>
                )}
                {photo.tip === "takvim" && (
                  <div className="absolute bottom-1 right-1 text-base leading-none">📅</div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* FAB - Fotoğraf Ekle */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 items-end z-40">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Camera size={16} className="text-orange-500" />
          Kamera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 bg-orange-500 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all"
        >
          <Plus size={26} className="text-white" />
        </button>
      </div>

      {/* Fotoğraf Ekleme Modalı */}
      {showAddModal && pendingPhotoData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Fotoğraf Ekle</h3>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setPendingPhotoData(null); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Önizleme */}
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-gray-100">
              <img src={pendingPhotoData} alt="Önizleme" className="w-full h-full object-cover" />
            </div>

            {/* Kategori */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(KATEGORI_ETIKETLERI) as [FotoKategori, { label: string; emoji: string }][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewKategori(key)}
                      className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                        newKategori === key
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <span className="text-xl">{val.emoji}</span>
                      {val.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama <span className="text-gray-400">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={newAciklama}
                onChange={(e) => setNewAciklama(e.target.value)}
                placeholder="Bu fotoğraf hakkında bir not..."
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={kaydediliyor}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Galeriye Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* Fotoğraf Görüntüleyici Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
            <div className="text-white">
              <p className="text-sm font-medium">
                {turkceTarih(selectedPhoto.tarih, getLocale() as any)}
              </p>
              {selectedPhoto.aciklama && (
                <p className="text-xs text-gray-300 mt-0.5">{selectedPhoto.aciklama}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Trash2 size={20} className="text-white" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.fotoData}
              alt={selectedPhoto.aciklama || "Köpek fotoğrafı"}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          <div className="p-4 bg-black/50 backdrop-blur">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center gap-2">
                {selectedPhoto.tip === "galeri" && selectedPhoto.kategori && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium">
                    {KATEGORI_ETIKETLERI[selectedPhoto.kategori].emoji}{" "}
                    {KATEGORI_ETIKETLERI[selectedPhoto.kategori].label}
                  </span>
                )}
                {selectedPhoto.tip === "takvim" && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                    📅 Takvim
                  </span>
                )}
                {selectedPhoto.tip === "tuvalet" && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                    🚽 Tuvalet
                  </span>
                )}
              </div>
              {selectedPhoto.enlem && selectedPhoto.boylam && (
                <div className="flex items-center gap-1 text-xs">
                  <MapPin size={14} />
                  <span>Konum var</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryPage;
