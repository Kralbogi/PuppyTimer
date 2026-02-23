// =============================================================================
// PuppyTimer Web - TakvimPage (Foto Takvim Sayfasi)
// 12 aylik foto takvim, basima hazir onizleme
// =============================================================================

import React, { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import PhotoPicker from "../components/common/PhotoPicker";
import CalendarPreview from "../components/calendar/CalendarPreview";
import { useTakvimViewModel } from "../hooks/useTakvimViewModel";

// =============================================================================
// Props
// =============================================================================

interface TakvimPageProps {
  kopekId: number;
}

// =============================================================================
// Main Component
// =============================================================================

export const TakvimPage: React.FC<TakvimPageProps> = ({ kopekId }) => {
  const vm = useTakvimViewModel(kopekId);

  const [seciliAy, setSeciliAy] = useState<number | null>(null);
  const [fotoPickerData, setFotoPickerData] = useState<string | null>(null);
  const [aciklama, setAciklama] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ---------------------------------------------------------------------------
  // Ay secim + foto ekleme
  // ---------------------------------------------------------------------------

  const openAyModal = (ay: number) => {
    const mevcut = vm.aylikFotoMap.get(ay);
    setSeciliAy(ay);
    setFotoPickerData(mevcut?.fotoData ?? null);
    setAciklama(mevcut?.aciklama ?? "");
  };

  const saveAyFoto = async () => {
    if (seciliAy === null || !fotoPickerData) return;
    await vm.fotoEkle(seciliAy, fotoPickerData, aciklama.trim() || undefined);
    setSeciliAy(null);
    setFotoPickerData(null);
    setAciklama("");
  };

  const deleteAyFoto = async () => {
    if (seciliAy === null) return;
    const mevcut = vm.aylikFotoMap.get(seciliAy);
    if (mevcut?.id) {
      await vm.fotoSil(mevcut.id);
    }
    setSeciliAy(null);
    setFotoPickerData(null);
    setAciklama("");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="px-4 py-4">
      {/* Yil secici */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => vm.yilDegistir(vm.seciliYil - 1)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{vm.seciliYil}</h2>
        <button
          type="button"
          onClick={() => vm.yilDegistir(vm.seciliYil + 1)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Ilerleme */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {vm.doluAySayisi} / 12 ay tamamlandi
        </p>
        {vm.takvimTamamMi && (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
          >
            <Eye size={16} />
            Takvim Olustur
          </button>
        )}
      </div>

      {/* Ilerleme cubugu */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all"
          style={{ width: `${(vm.doluAySayisi / 12) * 100}%` }}
        />
      </div>

      {/* 3x4 ay grid */}
      <div className="grid grid-cols-3 gap-3">
        {vm.ayAdlari.map((ayAdi, ay) => {
          const foto = vm.aylikFotoMap.get(ay);
          return (
            <button
              key={ay}
              type="button"
              onClick={() => openAyModal(ay)}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                foto
                  ? "border-orange-300 shadow-md"
                  : "border-dashed border-gray-300 hover:border-orange-400"
              }`}
            >
              {foto ? (
                <>
                  <img
                    src={`data:image/jpeg;base64,${foto.fotoData}`}
                    alt={ayAdi}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-semibold">{ayAdi}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 bg-gray-50">
                  <Camera size={24} className="text-gray-300" />
                  <span className="text-xs text-gray-400 font-medium">
                    {ayAdi}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ay foto modal */}
      {seciliAy !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {vm.ayAdlari[seciliAy]} {vm.seciliYil}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSeciliAy(null);
                  setFotoPickerData(null);
                  setAciklama("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <PhotoPicker
                fotoData={fotoPickerData}
                onChange={(data) => setFotoPickerData(data)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Aciklama
                </label>
                <input
                  type="text"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Bu ay icin bir not..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              {vm.aylikFotoMap.has(seciliAy) && (
                <button
                  type="button"
                  onClick={deleteAyFoto}
                  className="p-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSeciliAy(null);
                  setFotoPickerData(null);
                  setAciklama("");
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveAyFoto}
                disabled={!fotoPickerData}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Takvim onizleme */}
      {showPreview && (
        <CalendarPreview
          yil={vm.seciliYil}
          fotolar={vm.aylikFotoMap}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TakvimPage;
