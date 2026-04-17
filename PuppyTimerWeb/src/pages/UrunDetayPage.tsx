// =============================================================================
// PawLand - UrunDetayPage
// Product detail page with reviews
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ShoppingCart, Loader2, Package, AlertCircle } from "lucide-react";
import { urunGetir, yorumlariDinle, kullaniciYorumVarMi, kullaniciUrunuSatinAldiMi } from "../services/urunService";
import { useSepet } from "../contexts/SepetContext";
import type { Urun, UrunYorum } from "../types/models";
import YorumListesi from "../components/shop/YorumListesi";
import YorumFormu from "../components/shop/YorumFormu";

export default function UrunDetayPage() {
  const { urunId } = useParams<{ urunId: string }>();
  const navigate = useNavigate();
  const sepet = useSepet();

  const [urun, setUrun] = useState<Urun | null>(null);
  const [yorumlar, setYorumlar] = useState<UrunYorum[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yorumlarYukleniyor, setYorumlarYukleniyor] = useState(true);
  const [yorumYapildiMi, setYorumYapildiMi] = useState(false);
  const [satinAlindiMi, setSatinAlindiMi] = useState(false);
  const [satinAlmaKontroluYukleniyor, setSatinAlmaKontroluYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  // Load product
  useEffect(() => {
    if (!urunId) return;

    urunGetir(urunId)
      .then((data) => {
        setUrun(data);
        setYukleniyor(false);
      })
      .catch((error) => {
        console.error("Urun getirme hatasi:", error);
        setHata("Ürün yüklenemedi");
        setYukleniyor(false);
      });
  }, [urunId]);

  // Listen to reviews
  useEffect(() => {
    if (!urunId) return;

    const unsubscribe = yorumlariDinle(urunId, (yorumlar) => {
      setYorumlar(yorumlar);
      setYorumlarYukleniyor(false);
    });

    return () => unsubscribe();
  }, [urunId]);

  // Check if user already reviewed
  useEffect(() => {
    if (!urunId) return;

    kullaniciYorumVarMi(urunId).then(setYorumYapildiMi);
  }, [urunId]);

  // Check if user purchased the product
  useEffect(() => {
    if (!urunId) return;

    kullaniciUrunuSatinAldiMi(urunId)
      .then(setSatinAlindiMi)
      .finally(() => setSatinAlmaKontroluYukleniyor(false));
  }, [urunId]);

  const handleSepeteEkle = () => {
    if (!urun) return;

    sepet.ekle({
      urunId: urun.id,
      ad: urun.ad,
      birimFiyat: urun.fiyat,
      resimUrl: urun.resimUrl,
    });
  };

  const handleYorumBasarili = () => {
    setYorumYapildiMi(true);
  };

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (hata || !urun) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ background: 'var(--color-bg)' }}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>{hata || "Ürün bulunamadı"}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white font-medium rounded-xl smooth-transition"
          style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg smooth-transition"
          style={{ color: 'var(--color-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>Ürün Detayı</h1>
      </div>

      {/* Product image */}
      <div className="aspect-square flex items-center justify-center" style={{ background: 'var(--color-border)' }}>
        {urun.resimUrl ? (
          <img
            src={urun.resimUrl}
            alt={urun.ad}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={80} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        )}
      </div>

      {/* Product info */}
      <div className="px-4 py-4">
        {/* Title and rating */}
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{urun.ad}</h2>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((yildiz) => (
              <Star
                key={yildiz}
                size={16}
                className={
                  yildiz <= Math.round(urun.ortalamaPuan)
                    ? "text-amber-400 fill-current"
                    : undefined
                }
                style={yildiz > Math.round(urun.ortalamaPuan) ? { color: 'var(--color-border)' } : undefined}
              />
            ))}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {urun.ortalamaPuan > 0 ? urun.ortalamaPuan.toFixed(1) : "Yeni"}
          </span>
          {urun.toplamYorumSayisi > 0 && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              ({urun.toplamYorumSayisi} değerlendirme)
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
            ₺{urun.fiyat.toFixed(2)}
          </span>
        </div>

        {/* Stock status */}
        <div className="mb-4">
          {urun.stok > 0 ? (
            <p className="text-sm text-green-600 font-medium">
              Stokta mevcut ({urun.stok} adet)
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">Stokta yok</p>
          )}
        </div>

        {/* Category */}
        <div className="mb-4">
          <span
            className="inline-block px-3 py-1 text-sm font-medium rounded-full"
            style={{ background: 'var(--color-border-light)', color: 'var(--color-text)' }}
          >
            {urun.kategori}
          </span>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Açıklama</h3>
          <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{urun.aciklama}</p>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleSepeteEkle}
          disabled={urun.stok === 0}
          className="w-full flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl smooth-transition mb-6 disabled:opacity-50"
          style={{
            background: urun.stok === 0 ? 'var(--color-border)' : 'linear-gradient(135deg, #ff8c42, #e07a2f)',
          }}
        >
          <ShoppingCart size={20} />
          Sepete Ekle
        </button>

        {/* Review form - only for users who purchased */}
        {!satinAlmaKontroluYukleniyor && (
          <>
            {satinAlindiMi ? (
              <>
                {!yorumYapildiMi ? (
                  <div className="mb-6">
                    <YorumFormu urunId={urun.id} onSuccess={handleYorumBasarili} />
                  </div>
                ) : (
                  <div
                    className="rounded-xl px-4 py-3 mb-6 border"
                    style={{
                      background: '#f0fdf4',
                      borderColor: '#bbf7d0',
                    }}
                  >
                    <p className="text-sm text-green-700">
                      Bu ürün için daha önce değerlendirme yaptınız.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div
                className="rounded-xl px-4 py-3 mb-6 border"
                style={{
                  background: 'var(--color-border-light)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Bu ürünü değerlendirebilmek için önce satın almanız gerekmektedir.
                </p>
              </div>
            )}
          </>
        )}

        {/* Reviews */}
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Değerlendirmeler ({yorumlar.length})
          </h3>
          <YorumListesi yorumlar={yorumlar} yukleniyor={yorumlarYukleniyor} />
        </div>
      </div>
    </div>
  );
}
