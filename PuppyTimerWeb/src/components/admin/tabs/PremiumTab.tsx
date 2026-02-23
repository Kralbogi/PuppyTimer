// =============================================================================
// PuppyTimer Web - Admin Premium Tab
// Premium kullanıcı yönetimi
// =============================================================================

import { useState, useEffect } from "react";
import { Crown, User, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { tumPremiumKullanicilariGetir, premiumVer, premiumKaldir } from "../../../services/premiumService";
import type { KullaniciPremium } from "../../../types/models";

export default function PremiumTab() {
  const [premiumKullanicilar, setPremiumKullanicilar] = useState<KullaniciPremium[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniKullaniciId, setYeniKullaniciId] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);

  // Premium kullanıcıları yükle
  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    try {
      const kullanicilar = await tumPremiumKullanicilariGetir();
      setPremiumKullanicilar(kullanicilar);
    } catch (err) {
      console.error("Premium kullanıcılar yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  // Yeni premium kullanıcı ekle
  const premiumEkle = async () => {
    if (!yeniKullaniciId.trim()) {
      alert("Kullanıcı ID giriniz");
      return;
    }

    setEkleniyor(true);
    try {
      await premiumVer(yeniKullaniciId.trim(), "lifetime");
      setYeniKullaniciId("");
      await yukle();
      alert("Premium başarıyla verildi!");
    } catch (err) {
      alert("Hata: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEkleniyor(false);
    }
  };

  // Premium kaldır
  const premiumKaldirHandler = async (kullaniciId: string) => {
    if (!confirm("Bu kullanıcının premium'unu kaldırmak istediğinize emin misiniz?")) {
      return;
    }

    try {
      await premiumKaldir(kullaniciId);
      await yukle();
      alert("Premium kaldırıldı");
    } catch (err) {
      alert("Hata: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Premium Kullanıcılar</h2>
          <p className="text-sm text-gray-500">{premiumKullanicilar.length} aktif premium kullanıcı</p>
        </div>
      </div>

      {/* Yeni Premium Kullanıcı Ekle */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Yeni Premium Kullanıcı Ekle</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={yeniKullaniciId}
            onChange={(e) => setYeniKullaniciId(e.target.value)}
            placeholder="Kullanıcı ID (Firebase UID)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
            onKeyDown={(e) => e.key === "Enter" && premiumEkle()}
          />
          <button
            type="button"
            onClick={premiumEkle}
            disabled={ekleniyor || !yeniKullaniciId.trim()}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {ekleniyor ? "Ekleniyor..." : "Premium Ver"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Not: Lifetime premium olarak eklenecektir
        </p>
      </div>

      {/* Premium Kullanıcılar Listesi */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Başlangıç
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {premiumKullanicilar.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Henüz premium kullanıcı yok
                  </td>
                </tr>
              ) : (
                premiumKullanicilar.map((kullanici) => (
                  <tr key={kullanici.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-900">
                          {kullanici.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {kullanici.baslangicTarihi
                          ? new Date(kullanici.baslangicTarihi).toLocaleDateString("tr-TR")
                          : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          kullanici.odemeTuru === "lifetime"
                            ? "bg-purple-100 text-purple-700"
                            : kullanici.odemeTuru === "yearly"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {kullanici.odemeTuru === "lifetime"
                          ? "Lifetime"
                          : kullanici.odemeTuru === "yearly"
                          ? "Yıllık"
                          : "Aylık"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {kullanici.premium && kullanici.aktif ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Pasif</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => premiumKaldirHandler(kullanici.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Kaldır
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
