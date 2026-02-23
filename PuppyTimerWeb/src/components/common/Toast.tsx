// =============================================================================
// PuppyTimer Web - Toast Component
// Snackbar notification for location sharing refresh prompts
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { X, Clock } from "lucide-react";

interface ToastProps {
  message: string;
  onYes: () => void;
  onNo: () => void;
  onClose: () => void;
}

export function Toast({ message, onYes, onNo, onClose }: ToastProps) {
  const [kalanSure, setKalanSure] = useState(10);
  const onNoRef = useRef(onNo);

  // onNo callback'ini ref'e kaydet (her render'da guncel olsun)
  useEffect(() => {
    onNoRef.current = onNo;
  }, [onNo]);

  useEffect(() => {
    console.log("🔔 Toast mount - timer başlıyor");

    // Her saniye azalt
    const interval = setInterval(() => {
      setKalanSure((prev) => {
        console.log(`⏱️ Timer: ${prev} -> ${prev - 1}`);
        if (prev <= 1) {
          // Süre doldu, otomatik Hayır
          console.log("⏰ Süre doldu! onNo çağrılıyor");
          clearInterval(interval);
          onNoRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("🧹 Toast unmount - timer temizleniyor");
      clearInterval(interval);
    };
  }, []); // Artık bağımlılık yok, sadece mount'ta başlasın

  // Progress bar yüzdesi
  const progress = (kalanSure / 10) * 100;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[2000] flex justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 px-4 py-3 max-w-md w-full animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Timer Progress Bar */}
        <div className="mt-2 mb-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-600">
              {kalanSure} saniye kaldı
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onNo}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            Hayır
          </button>
          <button
            onClick={onYes}
            className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Evet
          </button>
        </div>
      </div>
    </div>
  );
}
