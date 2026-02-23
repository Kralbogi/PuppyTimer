// =============================================================================
// PuppyTimer Web - DegerlendirmeModal
// Product review modal for order history
// =============================================================================

import { X } from "lucide-react";
import YorumFormu from "./YorumFormu";

interface DegerlendirmeModalProps {
  acik: boolean;
  urun: { urunId: string; ad: string } | null;
  onKapat: () => void;
}

export default function DegerlendirmeModal({ acik, urun, onKapat }: DegerlendirmeModalProps) {
  if (!acik || !urun) return null;

  const handleBasarili = () => {
    // Close modal after successful review
    onKapat();
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
            <h2 className="text-lg font-bold text-gray-900">Ürünü Değerlendir</h2>
            <button
              onClick={onKapat}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {/* Product name */}
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Değerlendirdiğiniz ürün</p>
              <h3 className="font-bold text-gray-900">{urun.ad}</h3>
            </div>

            {/* Review form */}
            <YorumFormu urunId={urun.urunId} onSuccess={handleBasarili} />
          </div>
        </div>
      </div>
    </>
  );
}
