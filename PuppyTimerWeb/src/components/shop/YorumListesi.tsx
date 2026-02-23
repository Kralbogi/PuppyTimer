// =============================================================================
// PuppyTimer Web - YorumListesi
// Product reviews list component
// =============================================================================

import { Star, MessageSquare } from "lucide-react";
import type { UrunYorum } from "../../types/models";

interface YorumListesiProps {
  yorumlar: UrunYorum[];
  yukleniyor: boolean;
}

function YildizGoster({ puan }: { puan: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((yildiz) => (
        <Star
          key={yildiz}
          size={14}
          className={
            yildiz <= puan
              ? "text-amber-400 fill-current"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function YorumListesi({ yorumlar, yukleniyor }: YorumListesiProps) {
  if (yukleniyor) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Yorumlar yükleniyor...
      </div>
    );
  }

  if (yorumlar.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Henüz yorum yok</p>
        <p className="text-xs mt-1">İlk yorumu siz yapın!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {yorumlar.map((yorum) => (
        <div
          key={yorum.id}
          className="bg-white rounded-xl border border-gray-100 p-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {yorum.kullaniciAd}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(yorum.olusturmaTarihi).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <YildizGoster puan={yorum.puan} />
          </div>

          {/* Review text */}
          {yorum.yorum && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {yorum.yorum}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
