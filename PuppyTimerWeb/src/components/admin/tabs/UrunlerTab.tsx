// =============================================================================
// PuppyTimer Web - UrunlerTab (Admin)
// Admin product management
// =============================================================================

import { useEffect, useState } from "react";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Package, X } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { firestore, auth } from "../../../services/firebase";
import { urunEkle, urunGuncelle, urunSil } from "../../../services/urunService";
import type { Urun } from "../../../types/models";

export default function UrunlerTab() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenlenecekUrun, setDuzenlenecekUrun] = useState<Urun | null>(null);

  // Debug: Log current user UID and admin UID
  useEffect(() => {
    const currentUserUID = auth.currentUser?.uid;
    const adminUID = import.meta.env.VITE_ADMIN_UID;
    console.log("=== ADMIN UID DEBUG ===");
    console.log("Current User UID:", currentUserUID);
    console.log("Configured Admin UID:", adminUID);
    console.log("Match:", currentUserUID === adminUID);
    console.log("======================");
  }, []);

  useEffect(() => {
    // Listen to all products (including inactive) - using raw Firestore query
    const q = query(
      collection(firestore, "urunler"),
      orderBy("olusturmaTarihi", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const urunler = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Urun[];
        setUrunler(urunler);
        setYukleniyor(false);
      },
      (error) => {
        console.error("Admin ürün dinleme hatası:", error);
        setYukleniyor(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleYeniUrun = () => {
    setDuzenlenecekUrun(null);
    setModalAcik(true);
  };

  const handleDuzenle = (urun: Urun) => {
    setDuzenlenecekUrun(urun);
    setModalAcik(true);
  };

  const handleSil = async (id: string, ad: string) => {
    if (!window.confirm(`"${ad}" ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      await urunSil(id);
    } catch (error) {
      console.error("Ürün silme hatası:", error);
      alert("Ürün silinemedi");
    }
  };

  const handleAktifToggle = async (id: string, mevcutAktif: boolean) => {
    try {
      await urunGuncelle(id, { aktif: !mevcutAktif });
    } catch (error) {
      console.error("Aktif toggle hatası:", error);
      alert("Güncelleme başarısız");
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={28} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-600">
          Ürünler ({urunler.length})
        </h2>
        <button
          onClick={handleYeniUrun}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl transition-colors"
        >
          <Plus size={16} />
          Yeni Ürün
        </button>
      </div>

      {/* Product list */}
      {urunler.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Henüz ürün yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urunler.map((urun) => (
            <div
              key={urun.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4"
            >
              {/* Product image */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {urun.resimUrl ? (
                  <img
                    src={urun.resimUrl}
                    alt={urun.ad}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={24} className="text-gray-300" />
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">
                  {urun.ad}
                </h3>
                <p className="text-xs text-gray-500 truncate">{urun.kategori}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-orange-500">
                    ₺{urun.fiyat.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">Stok: {urun.stok}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      urun.aktif
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {urun.aktif ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAktifToggle(urun.id, urun.aktif)}
                  className={`p-2 rounded-lg transition-colors ${
                    urun.aktif
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={urun.aktif ? "Pasif yap" : "Aktif yap"}
                >
                  {urun.aktif ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleDuzenle(urun)}
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Düzenle"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleSil(urun.id, urun.ad)}
                  className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product modal */}
      {modalAcik && (
        <UrunModal
          urun={duzenlenecekUrun}
          onKapat={() => setModalAcik(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// UrunModal - Add/Edit product modal
// =============================================================================

interface UrunModalProps {
  urun: Urun | null; // null = new product, otherwise edit
  onKapat: () => void;
}

function UrunModal({ urun, onKapat }: UrunModalProps) {
  const [ad, setAd] = useState(urun?.ad || "");
  const [aciklama, setAciklama] = useState(urun?.aciklama || "");
  const [fiyat, setFiyat] = useState(urun?.fiyat.toString() || "");
  const [stok, setStok] = useState(urun?.stok.toString() || "0");
  const [kategori, setKategori] = useState(urun?.kategori || "Mama");
  const [resimUrl, setResimUrl] = useState(urun?.resimUrl || "");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const KATEGORILER = ["Mama", "Oyuncak", "Bakım", "Aksesuar", "Sağlık", "Taşıma"];

  const handleGorselYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setResimUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKaydet = async () => {
    if (!ad.trim()) {
      setHata("Ürün adı gerekli");
      return;
    }

    if (!fiyat || parseFloat(fiyat) <= 0) {
      setHata("Geçerli bir fiyat girin");
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      const data = {
        ad: ad.trim(),
        aciklama: aciklama.trim(),
        fiyat: parseFloat(fiyat),
        stok: parseInt(stok) || 0,
        kategori,
        resimUrl: resimUrl || undefined,
        aktif: true,
      };

      if (urun) {
        // Edit existing
        await urunGuncelle(urun.id, data);
      } else {
        // Add new
        await urunEkle(data);
      }

      onKapat();
    } catch (error: any) {
      console.error("Ürün kaydetme hatası:", error);
      const errorMessage = error?.message || error?.code || "İşlem başarısız oldu";
      setHata(`Hata: ${errorMessage}`);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onKapat}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
            <h2 className="text-lg font-bold text-gray-900">
              {urun ? "Ürün Düzenle" : "Yeni Ürün"}
            </h2>
            <button
              onClick={onKapat}
              disabled={yukleniyor}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            {/* Product name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Örn: Premium Köpek Maması"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Ürün detayları..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
              >
                {KATEGORILER.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price and stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  value={fiyat}
                  onChange={(e) => setFiyat(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stok
                </label>
                <input
                  type="number"
                  value={stok}
                  onChange={(e) => setStok(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görsel
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleGorselYukle}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
              />
              {resimUrl && (
                <div className="mt-2 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={resimUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Error message */}
            {hata && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{hata}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleKaydet}
              disabled={yukleniyor}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors"
            >
              {yukleniyor ? "Kaydediliyor..." : urun ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
