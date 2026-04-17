// =============================================================================
// PawLand - ShopPage
// Köpek ürünleri alışveriş sayfası (Firestore entegrasyonu)
// =============================================================================

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, Loader2, ShoppingBag } from "lucide-react";
import { urunleriDinle } from "../services/urunService";
import type { Urun } from "../types/models";
import UrunKarti from "../components/shop/UrunKarti";
import SepetButton from "../components/shop/SepetButton";
import SepetModal from "../components/shop/SepetModal";
import OdemeModal from "../components/shop/OdemeModal";

type Kategori = "Tümü" | "Mama" | "Oyuncak" | "Bakım" | "Aksesuar" | "Sağlık" | "Taşıma";

const KATEGORILER: Kategori[] = ["Tümü", "Mama", "Oyuncak", "Bakım", "Aksesuar", "Sağlık", "Taşıma"];

export const ShopPage = () => {
  const { id } = useParams<{ id: string }>();
  const kopekId = id ? parseInt(id, 10) : undefined;
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");
  const [secilenKategori, setSecilenKategori] = useState<Kategori>("Tümü");
  const [sepetModalAcik, setSepetModalAcik] = useState(false);
  const [odemeModalAcik, setOdemeModalAcik] = useState(false);

  // Listen to products from Firestore
  useEffect(() => {
    console.log("=== SHOP PAGE - Ürün dinleyici başlatılıyor ===");
    const unsubscribe = urunleriDinle((urunler) => {
      console.log("=== SHOP PAGE - Ürünler güncellendi ===");
      console.log("Toplam aktif ürün sayısı:", urunler.length);
      console.log("Ürünler:", urunler);
      setUrunler(urunler);
      setYukleniyor(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter products
  const filtrelenmisUrunler = urunler.filter((urun) => {
    const aramaEslesiyor =
      urun.ad.toLowerCase().includes(arama.toLowerCase()) ||
      urun.aciklama.toLowerCase().includes(arama.toLowerCase());
    const kategoriEslesiyor =
      secilenKategori === "Tümü" || urun.kategori === secilenKategori;
    return aramaEslesiyor && kategoriEslesiyor;
  });

  return (
    <div className="px-4 py-6 pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Mağaza</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Köpeğiniz için en iyi ürünler
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {KATEGORILER.map((kategori) => (
            <button
              key={kategori}
              onClick={() => setSecilenKategori(kategori)}
              className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap smooth-transition"
              style={
                secilenKategori === kategori
                  ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                  : { background: 'var(--color-bg-card)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
              }
            >
              {kategori}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : filtrelenmisUrunler.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag
            size={48}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}
          />
          <p style={{ color: 'var(--color-text-muted)' }}>
            {arama || secilenKategori !== "Tümü"
              ? "Ürün bulunamadı"
              : "Henüz ürün eklenmemiş"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtrelenmisUrunler.map((urun) => (
            <UrunKarti key={urun.id} urun={urun} />
          ))}
        </div>
      )}

      {/* Floating cart button */}
      <SepetButton onClick={() => setSepetModalAcik(true)} />

      {/* Cart modal */}
      <SepetModal
        acik={sepetModalAcik}
        onKapat={() => setSepetModalAcik(false)}
        onOdemeGec={() => setOdemeModalAcik(true)}
      />

      {/* Checkout modal */}
      <OdemeModal
        acik={odemeModalAcik}
        onKapat={() => setOdemeModalAcik(false)}
        kopekId={kopekId}
      />
    </div>
  );
};
