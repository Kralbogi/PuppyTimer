// =============================================================================
// PawLand - SepetModal
// Shopping cart modal with item list and checkout
// =============================================================================

import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useSepet } from "../../contexts/SepetContext";

interface SepetModalProps {
  acik: boolean;
  onKapat: () => void;
  onOdemeGec: () => void;
}

export default function SepetModal({ acik, onKapat, onOdemeGec }: SepetModalProps) {
  const sepet = useSepet();

  if (!acik) return null;

  const handleOdemeGec = () => {
    onKapat();
    onOdemeGec();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onKapat}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ bottom: "70px", maxHeight: "55vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Sepetim</h2>
            <span className="text-sm text-gray-500">({sepet.toplamAdet} ürün)</span>
          </div>
          <button
            onClick={onKapat}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="overflow-y-auto px-4 py-3" style={{ flex: "1 1 auto", minHeight: 0 }}>
          {sepet.items.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sepetiniz boş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sepet.items.map((item) => (
                <div
                  key={item.urunId}
                  className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Product image */}
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.resimUrl ? (
                      <img
                        src={item.resimUrl}
                        alt={item.ad}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl"></span>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.ad}
                    </h3>
                    <p className="text-orange-500 font-bold text-sm">
                      ₺{item.birimFiyat.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => sepet.adetGuncelle(item.urunId, item.adet - 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">
                      {item.adet}
                    </span>
                    <button
                      onClick={() => sepet.adetGuncelle(item.urunId, item.adet + 1)}
                      className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => sepet.cikar(item.urunId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Always visible */}
        <div className="border-t-2 border-gray-200 px-4 py-3 space-y-2 flex-shrink-0 bg-white">
          {sepet.items.length > 0 ? (
            <>
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold text-base">Toplam</span>
                <span className="text-2xl font-bold text-orange-500">
                  ₺{sepet.toplamFiyat.toFixed(2)}
                </span>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleOdemeGec}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base rounded-xl transition-colors shadow-lg"
              >
                 Ödemeye Geç
              </button>
            </>
          ) : (
            <p className="text-center text-gray-500 text-sm py-2">
              Sepetiniz boş
            </p>
          )}
        </div>
      </div>
    </>
  );
}
