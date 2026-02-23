// =============================================================================
// PuppyTimer Web - SiparisGecmisiPage
// Order history page with product reviews
// =============================================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { siparislerimiDinle, kullaniciYorumVarMi } from "../services/urunService";
import type { Siparis } from "../types/models";
import SiparisKarti from "../components/shop/SiparisKarti";
import DegerlendirmeModal from "../components/shop/DegerlendirmeModal";

export default function SiparisGecmisiPage() {
  const navigate = useNavigate();
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [yorumYapilanUrunler, setYorumYapilanUrunler] = useState<Set<string>>(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [degerlendirmeModal, setDegerlendirmeModal] = useState<{
    acik: boolean;
    urun: { urunId: string; ad: string } | null;
  }>({
    acik: false,
    urun: null,
  });

  // Real-time order listener
  useEffect(() => {
    const unsubscribe = siparislerimiDinle((orders) => {
      setSiparisler(orders);
      setYukleniyor(false);
    });

    return () => unsubscribe();
  }, []);

  // Batch check for reviewed products
  useEffect(() => {
    const kontrolEt = async () => {
      if (siparisler.length === 0) return;

      // Collect unique product IDs from all orders
      const tumUrunler = siparisler.flatMap((s) => s.urunler);
      const benzersizUrunler = [...new Set(tumUrunler.map((u) => u.urunId))];

      // Check reviews in parallel
      const sonuclar = await Promise.all(
        benzersizUrunler.map(async (urunId) => ({
          urunId,
          yorumVar: await kullaniciYorumVarMi(urunId),
        }))
      );

      const yorumYapilan = new Set(
        sonuclar.filter((r) => r.yorumVar).map((r) => r.urunId)
      );
      setYorumYapilanUrunler(yorumYapilan);
    };

    kontrolEt();
  }, [siparisler]);

  const handleDegerlendir = (urun: { urunId: string; ad: string }) => {
    setDegerlendirmeModal({ acik: true, urun });
  };

  const handleModalKapat = () => {
    setDegerlendirmeModal({ acik: false, urun: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Package size={20} className="text-orange-500" />
            <h1 className="text-lg font-bold text-gray-900">Sipariş Geçmişim</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {yukleniyor ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-sm text-gray-500 mt-3">Siparişler yükleniyor...</p>
          </div>
        ) : siparisler.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Henüz sipariş geçmişiniz yok
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              İlk siparişinizi vererek başlayın
            </p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
            >
              <ShoppingBag size={18} />
              Alışverişe Başla
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {siparisler.map((siparis) => (
              <SiparisKarti
                key={siparis.id}
                siparis={siparis}
                onDegerlendir={handleDegerlendir}
                yorumYapilanUrunler={yorumYapilanUrunler}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      <DegerlendirmeModal
        acik={degerlendirmeModal.acik}
        urun={degerlendirmeModal.urun}
        onKapat={handleModalKapat}
      />
    </div>
  );
}
