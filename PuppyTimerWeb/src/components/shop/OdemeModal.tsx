// =============================================================================
// PuppyTimer Web - OdemeModal
// Checkout modal (payment UI placeholder)
// =============================================================================

import { useState } from "react";
import { X, CreditCard, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useSepet } from "../../contexts/SepetContext";
import { siparisOlustur } from "../../services/urunService";
import { db } from "../../db/database";
import type { GiderKategori } from "../../types/models";

interface OdemeModalProps {
  acik: boolean;
  onKapat: () => void;
  kopekId?: number;
}

// Ürün adından gider kategorisi tahmin et
function kategoriTahmin(urunAdi: string): GiderKategori {
  const ad = urunAdi.toLowerCase();
  if (ad.includes("mama") || ad.includes("yem") || ad.includes("atıştır")) return "mama";
  if (ad.includes("oyun") || ad.includes("top") || ad.includes("kemik")) return "oyuncak";
  if (ad.includes("şampuan") || ad.includes("fırça") || ad.includes("tarak") || ad.includes("bakım")) return "bakim";
  if (ad.includes("tasma") || ad.includes("gerdanlık") || ad.includes("kıyafet") || ad.includes("yatak")) return "aksesuar";
  if (ad.includes("ilaç") || ad.includes("vitamin") || ad.includes("takviye")) return "ilac";
  if (ad.includes("sigorta")) return "sigorta";
  return "diger";
}

export default function OdemeModal({ acik, onKapat, kopekId }: OdemeModalProps) {
  const sepet = useSepet();
  const [teslimatAdresi, setTeslimatAdresi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  if (!acik) return null;

  const handleSiparisOlustur = async () => {
    if (sepet.items.length === 0) {
      setHata("Sepetiniz boş");
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      await siparisOlustur(sepet.items, teslimatAdresi);

      // Satın alınan ürünleri otomatik olarak gider takibine ekle
      if (kopekId) {
        const simdi = Date.now();
        for (const item of sepet.items) {
          await db.giderler.add({
            kopekId,
            tarih: simdi,
            kategori: kategoriTahmin(item.ad),
            tutar: item.adet * item.birimFiyat,
            baslik: `${item.ad}${item.adet > 1 ? ` x${item.adet}` : ""}`,
            not: "Mağaza siparişi",
            faturali: true,
          });
        }
      }

      setBasarili(true);
      sepet.temizle();

      // Close after 2 seconds
      setTimeout(() => {
        onKapat();
        setBasarili(false);
        setTeslimatAdresi("");
      }, 2000);
    } catch (error) {
      console.error("Siparis olusturma hatasi:", error);
      setHata("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleKapat = () => {
    if (!yukleniyor && !basarili) {
      onKapat();
      setHata(null);
      setTeslimatAdresi("");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleKapat}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Success state */}
          {basarili ? (
            <div className="p-8 text-center">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Sipariş Oluşturuldu!
              </h2>
              <p className="text-gray-600 text-sm">
                Siparişiniz başarıyla kaydedildi. Yakında işleme alınacaktır.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Ödeme</h2>
                <button
                  onClick={handleKapat}
                  disabled={yukleniyor}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4 space-y-4">
                {/* Warning message */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Ödeme entegrasyonu yakında aktif olacak. Şimdilik sadece sipariş kaydı oluşturulacaktır.
                  </p>
                </div>

                {/* Order summary */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">
                    Sipariş Özeti
                  </h3>
                  <div className="space-y-2">
                    {sepet.items.map((item) => (
                      <div
                        key={item.urunId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {item.ad} x{item.adet}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₺{(item.adet * item.birimFiyat).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 flex items-center justify-between font-bold">
                      <span className="text-gray-900">Toplam</span>
                      <span className="text-orange-500 text-lg">
                        ₺{sepet.toplamFiyat.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery address */}
                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                    <MapPin size={16} className="text-orange-500" />
                    Teslimat Adresi (Opsiyonel)
                  </label>
                  <textarea
                    value={teslimatAdresi}
                    onChange={(e) => setTeslimatAdresi(e.target.value)}
                    placeholder="Adresinizi girin..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
                  />
                </div>

                {/* Payment method placeholder */}
                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                    <CreditCard size={16} className="text-orange-500" />
                    Ödeme Yöntemi
                  </label>
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-center">
                    <p className="text-sm text-gray-500">
                      Ödeme yöntemi seçimi yakında eklenecektir
                    </p>
                  </div>
                </div>

                {/* Error message */}
                {hata && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{hata}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSiparisOlustur}
                  disabled={yukleniyor || sepet.items.length === 0}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors"
                >
                  {yukleniyor ? "İşleniyor..." : "Siparişi Tamamla"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
