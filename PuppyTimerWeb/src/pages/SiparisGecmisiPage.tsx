// =============================================================================
// PawLand - SiparisGecmisiPage
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
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 smooth-transition"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Package size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Sipariş Geçmişim</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {yukleniyor ? (
          <div className="text-center py-10">
            <div
              className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: 'var(--color-primary)' }}
            ></div>
            <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>Siparişler yükleniyor...</p>
          </div>
        ) : siparisler.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={64} className="mx-auto mb-4" style={{ color: 'var(--color-border)' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Henüz sipariş geçmişiniz yok
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              İlk siparişinizi vererek başlayın
            </p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl smooth-transition"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
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
