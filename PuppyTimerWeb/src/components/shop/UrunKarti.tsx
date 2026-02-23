// =============================================================================
// PuppyTimer Web - UrunKarti
// Product preview card for shop page
// =============================================================================

import { Star, ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import type { Urun } from "../../types/models";
import { useSepet } from "../../contexts/SepetContext";

interface UrunKartiProps {
  urun: Urun;
}

export default function UrunKarti({ urun }: UrunKartiProps) {
  const navigate = useNavigate();
  const { id: kopekId } = useParams();
  const sepet = useSepet();

  const handleSepeteEkle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    sepet.ekle({
      urunId: urun.id,
      ad: urun.ad,
      birimFiyat: urun.fiyat,
      resimUrl: urun.resimUrl,
    });
  };

  const handleKartTiklama = () => {
    navigate(`/dog/${kopekId}/shop/urun/${urun.id}`);
  };

  return (
    <div
      onClick={handleKartTiklama}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Product image */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {urun.resimUrl ? (
          <img
            src={urun.resimUrl}
            alt={urun.ad}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-300 text-4xl">📦</div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm truncate mb-1">
          {urun.ad}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={14} className="text-amber-400 fill-current" />
          <span className="text-xs font-medium text-gray-700">
            {urun.ortalamaPuan > 0 ? urun.ortalamaPuan.toFixed(1) : "Yeni"}
          </span>
          {urun.toplamYorumSayisi > 0 && (
            <span className="text-xs text-gray-400">
              ({urun.toplamYorumSayisi})
            </span>
          )}
        </div>

        {/* Price and cart button */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-orange-500 text-lg">
            ₺{urun.fiyat.toFixed(2)}
          </span>
          <button
            onClick={handleSepeteEkle}
            disabled={urun.stok === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <ShoppingCart size={14} />
            Ekle
          </button>
        </div>

        {/* Stock indicator */}
        {urun.stok === 0 && (
          <p className="text-xs text-red-500 mt-1">Stokta yok</p>
        )}
      </div>
    </div>
  );
}
