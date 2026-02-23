// =============================================================================
// PuppyTimer Web - YorumFormu
// Product review form component
// =============================================================================

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { yorumEkle } from "../../services/urunService";

interface YorumFormuProps {
  urunId: string;
  onSuccess?: () => void;
}

export default function YorumFormu({ urunId, onSuccess }: YorumFormuProps) {
  const [puan, setPuan] = useState(0);
  const [hoverPuan, setHoverPuan] = useState(0);
  const [yorum, setYorum] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleGonder = async () => {
    if (puan === 0) {
      setHata("Lütfen puan verin");
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      await yorumEkle(urunId, puan, yorum.trim() || undefined);

      // Reset form
      setPuan(0);
      setYorum("");

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Yorum ekleme hatasi:", error);
      setHata("Yorum eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <h3 className="font-bold text-gray-900 text-sm">Değerlendirme Yap</h3>

      {/* Star rating */}
      <div>
        <label className="text-xs text-gray-600 mb-2 block">Puanınız</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((yildiz) => (
            <button
              key={yildiz}
              type="button"
              onClick={() => setPuan(yildiz)}
              onMouseEnter={() => setHoverPuan(yildiz)}
              onMouseLeave={() => setHoverPuan(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={
                  yildiz <= (hoverPuan || puan)
                    ? "text-amber-400 fill-current"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review text */}
      <div>
        <label className="text-xs text-gray-600 mb-2 block">
          Yorumunuz (Opsiyonel)
        </label>
        <textarea
          value={yorum}
          onChange={(e) => setYorum(e.target.value)}
          placeholder="Ürün hakkında düşüncelerinizi paylaşın..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {yorum.length}/500
        </p>
      </div>

      {/* Error message */}
      {hata && (
        <p className="text-sm text-red-500">{hata}</p>
      )}

      {/* Submit button */}
      <button
        onClick={handleGonder}
        disabled={yukleniyor || puan === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors text-sm"
      >
        <Send size={16} />
        {yukleniyor ? "Gönderiliyor..." : "Yorumu Gönder"}
      </button>
    </div>
  );
}
