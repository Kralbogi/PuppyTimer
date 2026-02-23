// =============================================================================
// PuppyTimer Web - Online Arkadas Bildirim
// Arkadas online oldugunda gosteri
// =============================================================================

import { useEffect, useState } from "react";
import { UserCheck, X } from "lucide-react";

interface Bildirim {
  id: string;
  ad: string;
  kopekAd: string;
}

interface OnlineArkadasBildirimProps {
  bildirim: Bildirim | null;
  onKapat: () => void;
}

export function OnlineArkadasBildirim({ bildirim, onKapat }: OnlineArkadasBildirimProps) {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    if (bildirim) {
      setGorunur(true);

      // 5 saniye sonra otomatik kapat
      const timer = setTimeout(() => {
        setGorunur(false);
        setTimeout(onKapat, 300); // Animasyon bitmesini bekle
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setGorunur(false);
    }
  }, [bildirim, onKapat]);

  if (!bildirim) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[3000] transition-all duration-300 ${
        gorunur ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-green-200 px-4 py-3 max-w-sm flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{bildirim.ad} online oldu!</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {bildirim.kopekAd} ile paylaşımda
          </p>
        </div>
        <button
          onClick={() => {
            setGorunur(false);
            setTimeout(onKapat, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
