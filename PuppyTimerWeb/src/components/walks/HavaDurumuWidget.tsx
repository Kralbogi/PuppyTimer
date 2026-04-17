// =============================================================================
// PawLand - Hava Durumu Widget
// Yürüyüş uygunluğu ve hava durumu bilgisi
// =============================================================================

import React, { useState, useEffect } from "react";
import { Cloud, MapPin, RefreshCw, Wind, Droplets, Thermometer } from "lucide-react";
import {
  havaDurumuGetir,
  konumAl,
  VARSAYILAN_SEHIRLER,
  type HavaDurumu,
} from "../../services/weatherService";

export const HavaDurumuWidget: React.FC = () => {
  const [havaDurumu, setHavaDurumu] = useState<HavaDurumu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [secilenSehir, setSecilenSehir] = useState(VARSAYILAN_SEHIRLER[0]);
  const [konumKullan, setKonumKullan] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    setHata(null);

    try {
      // Önce kullanıcının konumunu almayı dene
      const konum = await konumAl();

      if (konum) {
        setKonumKullan(true);
        const durum = await havaDurumuGetir(konum.enlem, konum.boylam);
        if (durum) {
          setHavaDurumu(durum);
        } else {
          throw new Error("Hava durumu alınamadı");
        }
      } else {
        // Konum alınamazsa varsayılan şehri kullan
        setKonumKullan(false);
        const durum = await havaDurumuGetir(secilenSehir.enlem, secilenSehir.boylam);
        if (durum) {
          setHavaDurumu(durum);
        } else {
          throw new Error("Hava durumu alınamadı");
        }
      }
    } catch (err) {
      setHata("Hava durumu bilgisi alınamadı");
      console.error(err);
    } finally {
      setYukleniyor(false);
    }
  };

  const sehirDegistir = async (sehir: typeof VARSAYILAN_SEHIRLER[0]) => {
    setSecilenSehir(sehir);
    setYukleniyor(true);
    setHata(null);
    setKonumKullan(false);

    try {
      const durum = await havaDurumuGetir(sehir.enlem, sehir.boylam);
      if (durum) {
        setHavaDurumu(durum);
      } else {
        throw new Error("Hava durumu alınamadı");
      }
    } catch (err) {
      setHata("Hava durumu bilgisi alınamadı");
    } finally {
      setYukleniyor(false);
    }
  };

  if (yukleniyor && !havaDurumu) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Hava durumu yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (hata || !havaDurumu) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-700">{hata || "Hata oluştu"}</span>
          <button
            onClick={yukle}
            className="p-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 border ${
        havaDurumu.yuruyusUygun
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
          : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Hava Durumu</h3>
        </div>
        <button
          onClick={yukle}
          disabled={yukleniyor}
          className="p-1.5 bg-white/50 rounded-lg hover:bg-white transition-colors"
        >
          <RefreshCw
            size={14}
            className={`text-gray-600 ${yukleniyor ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Konum */}
      {!konumKullan && (
        <div className="mb-3">
          <select
            value={secilenSehir.ad}
            onChange={(e) => {
              const sehir = VARSAYILAN_SEHIRLER.find((s) => s.ad === e.target.value);
              if (sehir) sehirDegistir(sehir);
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900"
          >
            {VARSAYILAN_SEHIRLER.map((sehir) => (
              <option key={sehir.ad} value={sehir.ad}>
                 {sehir.ad}
              </option>
            ))}
          </select>
        </div>
      )}

      {konumKullan && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
          <MapPin size={12} />
          <span>Konumunuz kullanılıyor</span>
        </div>
      )}

      {/* Ana bilgi */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{havaDurumu.ikon}</div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {havaDurumu.sicaklik}°
            </div>
            <div className="text-sm text-gray-600">{havaDurumu.havaDurumu}</div>
          </div>
        </div>
      </div>

      {/* Detaylar */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/50 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Thermometer size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">Hissedilen</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {havaDurumu.hissedilenSicaklik}°
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Droplets size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">Nem</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {havaDurumu.nemOrani}%
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Wind size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">Rüzgar</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {havaDurumu.ruzgarHizi}km/h
          </div>
        </div>
      </div>

      {/* Yürüyüş uygunluk mesajı */}
      <div
        className={`rounded-lg p-3 ${
          havaDurumu.yuruyusUygun
            ? "bg-green-100 border border-green-200"
            : "bg-orange-100 border border-orange-200"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            havaDurumu.yuruyusUygun
              ? "text-green-800"
              : "text-orange-800"
          }`}
        >
          {havaDurumu.uygunlukMesaji}
        </p>
      </div>
    </div>
  );
};

export default HavaDurumuWidget;
