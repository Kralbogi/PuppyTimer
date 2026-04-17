// =============================================================================
// PawLand - Toast Component
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
    console.log("Toast mount - timer başlıyor");

    // Her saniye azalt
    const interval = setInterval(() => {
      setKalanSure((prev) => {
        console.log(`Timer: ${prev} -> ${prev - 1}`);
        if (prev <= 1) {
          // Süre doldu, otomatik Hayır
          console.log("Süre doldu! onNo çağrılıyor");
          clearInterval(interval);
          onNoRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("Toast unmount - timer temizleniyor");
      clearInterval(interval);
    };
  }, []); // Artık bağımlılık yok, sadece mount'ta başlasın

  // Progress bar yüzdesi
  const progress = (kalanSure / 10) * 100;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[2000] flex justify-center">
      <div className="bg-white/90 rounded-2xl soft-shadow-lg border px-4 py-3 max-w-md w-full smooth-transition" style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 smooth-transition rounded-lg p-1 hover:bg-white/50"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Timer Progress Bar */}
        <div className="mt-2 mb-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {kalanSure} saniye kaldı
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full smooth-transition"
              style={{ width: `${progress}%`, background: 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onNo}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm smooth-transition card-hover-lift"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-text)' }}
          >
            Hayır
          </button>
          <button
            onClick={onYes}
            className="flex-1 py-2 px-4 text-white rounded-lg font-medium text-sm smooth-transition card-hover-lift active:scale-95"
            style={{ background: 'var(--color-primary)' }}
          >
            Evet
          </button>
        </div>
      </div>
    </div>
  );
}
