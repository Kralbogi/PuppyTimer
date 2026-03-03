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
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
    >
      {/* Product image - Küçültülmüş */}
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
        {urun.resimUrl ? (
          <img
            src={urun.resimUrl}
            alt={urun.ad}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="text-gray-300 text-3xl">📦</div>
        )}

        {/* Rating badge - Üstte */}
        {urun.ortalamaPuan > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
            <Star size={12} className="text-amber-400 fill-current" />
            <span className="text-[11px] font-semibold text-gray-800">
              {urun.ortalamaPuan.toFixed(1)}
            </span>
          </div>
        )}

        {/* Stock indicator badge */}
        {urun.stok === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
            Tükendi
          </div>
        )}
      </div>

      {/* Product info - Daha kompakt */}
      <div className="p-2.5">
        <h3 className="font-medium text-gray-900 text-xs leading-tight mb-1 line-clamp-2 h-8">
          {urun.ad}
        </h3>

        {/* Review count */}
        {urun.toplamYorumSayisi > 0 && (
          <p className="text-[10px] text-gray-400 mb-1.5">
            {urun.toplamYorumSayisi} değerlendirme
          </p>
        )}

        {/* Price and cart button - Daha küçük */}
        <div className="flex items-center justify-between gap-1.5 mt-2">
          <span className="font-bold text-orange-500 text-base leading-none">
            {urun.fiyat.toFixed(2)}₺
          </span>
          <button
            onClick={handleSepeteEkle}
            disabled={urun.stok === 0}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-[11px] font-medium rounded-lg transition-colors min-w-[60px]"
          >
            <ShoppingCart size={12} />
            <span className="hidden sm:inline">Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
