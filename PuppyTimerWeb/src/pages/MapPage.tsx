// =============================================================================
// PuppyTimer Web - MapPage (Harita Sayfasi)
// Leaflet harita, isaretci ekleme/filtreleme + Topluluk haritasi + Kopek paylasimi
// =============================================================================

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  MapPin,
  Trash2,
  X,
  Footprints,
  Leaf,
  Droplets,
  Star,
  Filter,
  AlertTriangle,
  Users,
  Loader2,
  PawPrint,
  Stethoscope,
  ShoppingBag,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLiveQuery } from "dexie-react-hooks";
import { createMarkerIcon } from "../components/common/MarkerPin";
import { createDogMarkerIcon } from "../components/common/KopekHaritaPin";
import PulsingCircle from "../components/common/PulsingCircle";
import SegmentedControl from "../components/common/SegmentedControl";
import AddZoneModal from "../components/community/AddZoneModal";
import ZoneListPanel from "../components/community/ZoneListPanel";
import KopekProfilKarti from "../components/community/KopekProfilKarti";
import { BolgeYorumPanel } from "../components/community/BolgeYorumPanel";
import { KopekYorumPanel } from "../components/community/KopekYorumPanel";
import { MesajPanel } from "../components/community/MesajPanel";
import ToplulukChatWidget from "../components/community/ToplulukChatWidget";
import GorevWidget from "../components/map/GorevWidget";
import { kayipKopekleriDinle, kayipKopekBildir, kayipKopekKapat } from "../services/kayipKopekService";
import type { KayipKopek } from "../types/models";
import { Toast } from "../components/common/Toast";
import { OnlineArkadasBildirim } from "../components/common/OnlineArkadasBildirim";
import KonumumButon from "../components/common/KonumumButon";
import YolTarifiHatti, { type RotaBilgisi } from "../components/common/YolTarifiHatti";
import { useHaritaViewModel, varsayilanKonum } from "../hooks/useHaritaViewModel";
import { useToplulukViewModel } from "../hooks/useToplulukViewModel";
import { useKopekPaylasimYenileme } from "../hooks/useKopekPaylasimYenileme";
import { useArkadasViewModel } from "../hooks/useArkadasViewModel";
import { useKonumTakip } from "../hooks/useKonumTakip";
import { onlineDurumuGuncelle } from "../services/arkadasService";
import { konusmaOlusturVeyaGetir } from "../services/mesajService";
import { yakinYerleriGetir, mesafeFormat, type YakinYer } from "../services/nearbyPlacesService";
import { mesafeFormati } from "../services/locationUtils";
import { db } from "../db/database";
import { turkceTarihSaat } from "../services/dateUtils";
import {
  IsaretciTuru,
  isaretciTuruBaslik,
  isaretciTuruListesi,
  BolgeTuru,
  bolgeTuruBaslik,
  bolgeTuruListesi,
} from "../types/enums";
import type { BolgeTuru as BolgeTuruType } from "../types/enums";
import type { ToplulukKopek } from "../types/models";

// =============================================================================
// Helpers
// =============================================================================

function sureFomati(dakika: number): string {
  if (dakika < 60) return `${dakika} dk`;
  const saat = Math.floor(dakika / 60);
  const kalan = dakika % 60;
  return kalan > 0 ? `${saat} sa ${kalan} dk` : `${saat} sa`;
}

// =============================================================================
// Props
// =============================================================================

interface MapPageProps {
  kopekId: number;
}

// =============================================================================
// Marker type icon map
// =============================================================================

function getMarkerTypeIcon(tur: IsaretciTuru) {
  switch (tur) {
    case IsaretciTuru.Yuruyus:
      return <Footprints size={16} />;
    case IsaretciTuru.BuyukTuvalet:
      return <Leaf size={16} />;
    case IsaretciTuru.KucukTuvalet:
      return <Droplets size={16} />;
    case IsaretciTuru.Favori:
      return <Star size={16} />;
    case IsaretciTuru.Diger:
      return <MapPin size={16} />;
  }
}

// =============================================================================
// Marker type color class map
// =============================================================================

function turRenkClass(tur: IsaretciTuru): string {
  switch (tur) {
    case IsaretciTuru.Yuruyus:
      return "bg-green-500";
    case IsaretciTuru.BuyukTuvalet:
      return "bg-amber-700";
    case IsaretciTuru.KucukTuvalet:
      return "bg-yellow-500";
    case IsaretciTuru.Favori:
      return "bg-orange-500";
    case IsaretciTuru.Diger:
      return "bg-gray-500";
  }
}

function turRenkBorder(tur: IsaretciTuru): string {
  switch (tur) {
    case IsaretciTuru.Yuruyus:
      return "border-green-500";
    case IsaretciTuru.BuyukTuvalet:
      return "border-amber-700";
    case IsaretciTuru.KucukTuvalet:
      return "border-yellow-500";
    case IsaretciTuru.Favori:
      return "border-orange-500";
    case IsaretciTuru.Diger:
      return "border-gray-500";
  }
}

function turRenkBg(tur: IsaretciTuru): string {
  switch (tur) {
    case IsaretciTuru.Yuruyus:
      return "bg-green-50";
    case IsaretciTuru.BuyukTuvalet:
      return "bg-amber-50";
    case IsaretciTuru.KucukTuvalet:
      return "bg-yellow-50";
    case IsaretciTuru.Favori:
      return "bg-orange-50";
    case IsaretciTuru.Diger:
      return "bg-gray-50";
  }
}

function turRenkText(tur: IsaretciTuru): string {
  switch (tur) {
    case IsaretciTuru.Yuruyus:
      return "text-green-700";
    case IsaretciTuru.BuyukTuvalet:
      return "text-amber-800";
    case IsaretciTuru.KucukTuvalet:
      return "text-yellow-700";
    case IsaretciTuru.Favori:
      return "text-orange-700";
    case IsaretciTuru.Diger:
      return "text-gray-700";
  }
}

// =============================================================================
// MapClickHandler - handles click events on the map
// =============================================================================

const MapClickHandler: React.FC<{
  onClick: (lat: number, lng: number) => void;
}> = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// =============================================================================
// MapNavigator - handles programmatic map navigation
// =============================================================================

const MapNavigator: React.FC<{
  target: { enlem: number; boylam: number; zoom: number } | null;
}> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.enlem, target.boylam], target.zoom, { duration: 1.5 });
    }
  }, [target, map]);

  return null;
};

// Harita container boyutu doğru hesaplanana kadar bekleyip yeniden boyutlandır
// (overflow-y-auto içinde flexbox ile h-full kullanıldığında Leaflet 0 yükseklik alabilir)
const MapInvalidateSize: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    // İlk render'dan sonra boyutu güncelle
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

// =============================================================================
// Add Marker Modal State
// =============================================================================

interface AddMarkerForm {
  baslik: string;
  tur: IsaretciTuru;
  not: string;
  enlem: number;
  boylam: number;
}

const initialAddForm: AddMarkerForm = {
  baslik: "",
  tur: IsaretciTuru.Yuruyus,
  not: "",
  enlem: 0,
  boylam: 0,
};

// =============================================================================
// Mode options
// =============================================================================

const modSecenekleri = [
  { value: "benim", label: "Benim Haritam" },
  { value: "topluluk", label: "Topluluk" },
];

// =============================================================================
// Community zone filter icon helper
// =============================================================================

function getBolgeIcon(tur: BolgeTuruType) {
  switch (tur) {
    case BolgeTuru.Tehlikeli:
      return <AlertTriangle size={14} />;
    case BolgeTuru.Sosyal:
      return <Users size={14} />;
  }
}

// =============================================================================
// Main MapPage Component
// =============================================================================

export const MapPage: React.FC<MapPageProps> = ({ kopekId }) => {
  const vm = useHaritaViewModel(kopekId);
  const topluluk = useToplulukViewModel();
  const arkadasVM = useArkadasViewModel();

  const [mapMode, setMapMode] = useState<"benim" | "topluluk">("benim");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddMarkerForm>(initialAddForm);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneCoords, setZoneCoords] = useState({ enlem: 0, boylam: 0 });
  const [secilenKopek, setSecilenKopek] = useState<ToplulukKopek | null>(null);
  const [secilenBolge, setSecilenBolge] = useState<typeof topluluk.bolgeler[0] | null>(null);
  const [kopekYorumGorunur, setKopekYorumGorunur] = useState(false);
  const [paylasiliyor, setPaylasiliyor] = useState(false);
  const [onlineBildirim, setOnlineBildirim] = useState<{
    id: string;
    ad: string;
    kopekAd: string;
  } | null>(null);
  // useRef kullan — useState olsaydı her güncellemede sonsuz döngü oluşurdu
  const oncekiOnlineDurumlarRef = useRef<Map<string, boolean>>(new Map());
  const [hedefKonum, setHedefKonum] = useState<{ enlem: number; boylam: number; zoom: number } | null>(null);
  const [kullaniciKonumu, setKullaniciKonumu] = useState<[number, number] | null>(null);
  const [konumGosteriliyor, setKonumGosteriliyor] = useState(false);
  const [aktifYolTarifi, setAktifYolTarifi] = useState<{ hedef: [number, number]; kopekAd: string } | null>(null);
  const [rotaBilgisi, setRotaBilgisi] = useState<RotaBilgisi | null>(null);
  const [secilenKonusma, setSecilenKonusma] = useState<{ konusmaId: string; karsiTarafAd: string } | null>(null);

  // Kayıp köpek bildirimleri
  const [kayipKopekler, setKayipKopekler] = useState<KayipKopek[]>([]);
  const [secilenKayipKopek, setSecilenKayipKopek] = useState<KayipKopek | null>(null);
  const [showKayipModal, setShowKayipModal] = useState(false);
  const [kayipForm, setKayipForm] = useState({ kopekAd: "", irk: "", aciklama: "", iletisim: "" });
  const [kayipGonderiyor, setKayipGonderiyor] = useState(false);

  // Yakındaki yerler (veteriner, petshop)
  const [yakinYerler, setYakinYerler] = useState<YakinYer[]>([]);
  const [yakinYerlerGorunur, setYakinYerlerGorunur] = useState(false);
  const [yakinYerlerYukleniyor, setYakinYerlerYukleniyor] = useState(false);

  // Filtre paneli görünürlüğü
  const [filtrePaneliAcik, setFiltrePaneliAcik] = useState(false);
  const [konumAdreseYukleniyor, setKonumAdreseYukleniyor] = useState(false);

  // Kullanıcı konumunu takip et (yol tarifi aktifken)
  const { konum: kullaniciKonumuTakip, yukleniyor: konumYukleniyor, hata: konumHata } = useKonumTakip(aktifYolTarifi !== null);

  // GPS hatası olursa navigasyonu otomatik durdur
  useEffect(() => {
    if (konumHata && aktifYolTarifi) {
      const timer = setTimeout(() => setAktifYolTarifi(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [konumHata, aktifYolTarifi]);

  // Navigasyon durduğunda rota bilgisini sıfırla
  useEffect(() => {
    if (!aktifYolTarifi) setRotaBilgisi(null);
  }, [aktifYolTarifi]);

  // Mevcut kopek bilgisi (paylasim icin)
  const kopek = useLiveQuery(() => db.kopekler.get(kopekId), [kopekId]);

  // ---------------------------------------------------------------------------
  // Online durum guncelleme - topluluk moduna girildiginde online yap
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (mapMode === "topluluk") {
      // Topluluk moduna geçildiğinde veteriner/petshop'ları gizle
      setYakinYerlerGorunur(false);
      setFiltrePaneliAcik(false);

      onlineDurumuGuncelle(true).catch(() => {
        // Sessizce basarisiz ol
      });

      // Her 2 dakikada bir online durumunu guncelle
      const interval = setInterval(() => {
        onlineDurumuGuncelle(true).catch(() => {});
      }, 2 * 60 * 1000);

      return () => {
        clearInterval(interval);
        // Topluluk modundan cikildiginda offline yap
        onlineDurumuGuncelle(false).catch(() => {});
      };
    } else {
      // Benim haritam modundayken offline
      onlineDurumuGuncelle(false).catch(() => {});
    }
  }, [mapMode]);

  // ---------------------------------------------------------------------------
  // Arkadas online durum takibi ve bildirim
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (mapMode !== "topluluk") return;

    // Online durum degisikliklerini izle
    for (const [kullaniciId, online] of arkadasVM.onlineDurumlar) {
      const oncekiDurum = oncekiOnlineDurumlarRef.current.get(kullaniciId);

      // Offline -> Online gecis varsa bildirim goster
      if (oncekiDurum === false && online === true) {
        const arkadas = arkadasVM.arkadaslar.find(
          (a) =>
            (a.gonderenId === kullaniciId || a.aliciId === kullaniciId) &&
            a.durum === "kabul"
        );

        if (arkadas) {
          const arkadasAd =
            arkadas.gonderenId === kullaniciId
              ? arkadas.gonderenAd
              : arkadas.aliciAd;

          setOnlineBildirim({
            id: kullaniciId,
            ad: arkadasAd,
            kopekAd: arkadas.kopekAd,
          });
        }
      }
    }

    // Ref'i güncelle — useState değil, bu sayede sonsuz döngü olmaz
    oncekiOnlineDurumlarRef.current = new Map(arkadasVM.onlineDurumlar);
  }, [arkadasVM.onlineDurumlar, arkadasVM.arkadaslar, mapMode]);

  // ---------------------------------------------------------------------------
  // Kayıp köpek bildirimleri - topluluk modunda dinle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (mapMode !== "topluluk") return;
    const unsubscribe = kayipKopekleriDinle(setKayipKopekler);
    return unsubscribe;
  }, [mapMode]);

  // ---------------------------------------------------------------------------
  // Eski paylasimlarimi otomatik temizle (5dk'dan eski)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (mapMode !== "topluluk") return;

    const temizle = async () => {
      const besDakikaOnce = Date.now() - 5 * 60 * 1000;

      for (const kopek of topluluk.benimPaylasimlarim) {
        // 5 dakikadan eski paylasimlari geri cek
        if (kopek.guncellemeTarihi < besDakikaOnce) {
          try {
            await topluluk.kopekGeriCek(kopek.id);
          } catch (err) {
            console.error("Eski paylaşım temizlenemedi:", err);
          }
        }
      }
    };

    // Haritaya girildiginde bir kez calistir
    temizle();
  }, [mapMode, topluluk]);

  // ---------------------------------------------------------------------------
  // Compute map center from markers, default to Istanbul
  // ---------------------------------------------------------------------------

  const mapCenter = useMemo<[number, number]>(() => {
    if (vm.isaretciler.length > 0) {
      return [vm.isaretciler[0].enlem, vm.isaretciler[0].boylam];
    }
    return [varsayilanKonum.lat, varsayilanKonum.lng];
  }, [vm.isaretciler]);

  // ---------------------------------------------------------------------------
  // Map click handler (mode-aware)
  // ---------------------------------------------------------------------------

  const handleMapClick = (lat: number, lng: number) => {
    if (secilenKopek) {
      setSecilenKopek(null);
      setAktifYolTarifi(null); // Rotayı temizle
      return;
    }
    if (secilenBolge) {
      setSecilenBolge(null);
      return;
    }

    if (mapMode === "topluluk") {
      setZoneCoords({ enlem: lat, boylam: lng });
      setShowZoneModal(true);
    } else {
      setAddForm({
        ...initialAddForm,
        baslik: isaretciTuruBaslik(initialAddForm.tur), // Tür adını otomatik doldur
        enlem: lat,
        boylam: lng,
      });
      setShowAddModal(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Save marker (personal mode)
  // ---------------------------------------------------------------------------

  const saveMarker = async () => {
    if (!addForm.baslik.trim()) return;
    try {
      await vm.isaretciEkle(
        addForm.baslik.trim(),
        addForm.enlem,
        addForm.boylam,
        addForm.tur,
        addForm.not.trim() || undefined
      );
      setShowAddModal(false);
    } catch (err) {
      console.error("İşaretçi kaydedilemedi:", err);
      alert("İşaretçi kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  // ---------------------------------------------------------------------------
  // Save zone (community mode)
  // ---------------------------------------------------------------------------

  const saveZone = async (data: {
    baslik: string;
    aciklama: string;
    tur: BolgeTuruType;
    yaricap: number;
  }) => {
    await topluluk.yeniBolgeEkle({
      ...data,
      enlem: zoneCoords.enlem,
      boylam: zoneCoords.boylam,
    });
    setShowZoneModal(false);
  };

  // ---------------------------------------------------------------------------
  // Kopek paylas / durdur
  // ---------------------------------------------------------------------------

  // Bu kopek zaten paylasimda mi?
  const benimPaylasilanKopek = useMemo(
    () => topluluk.benimPaylasimlarim.find((k) => k.kopekAd === kopek?.ad),
    [topluluk.benimPaylasimlarim, kopek]
  );

  // ---------------------------------------------------------------------------
  // Mevcut konuma işaretçi ekle (benim haritam modu)
  // ---------------------------------------------------------------------------

  const konumAdreseEkle = useCallback(async () => {
    if (konumAdreseYukleniyor) return;
    setKonumAdreseYukleniyor(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      setAddForm({
        ...initialAddForm,
        enlem: pos.coords.latitude,
        boylam: pos.coords.longitude,
      });
      setShowAddModal(true);
    } catch {
      alert("Konum alınamadı. Ayarlar > Gizlilik > Konum Servisleri'nden izin verin.");
    } finally {
      setKonumAdreseYukleniyor(false);
    }
  }, [konumAdreseYukleniyor]);

  const kopeginiPaylas = useCallback(async () => {
    if (!kopek || paylasiliyor) return;
    setPaylasiliyor(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      await topluluk.kopekPaylas(kopek, pos.coords.latitude, pos.coords.longitude);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        alert("Konum alınamadı. Lütfen Sistem Ayarları > Gizlilik ve Güvenlik > Konum Servisleri'nden PuppyTimer'a izin verin.");
      } else {
        alert("Paylaşım sırasında bir hata oluştu.");
      }
    } finally {
      setPaylasiliyor(false);
    }
  }, [kopek, paylasiliyor, topluluk]);

  const paylasimDurdur = useCallback(async () => {
    if (!benimPaylasilanKopek || paylasiliyor) return;
    setPaylasiliyor(true);
    try {
      await topluluk.kopekGeriCek(benimPaylasilanKopek.id);
    } catch {
      alert("Paylaşım durdurulamadı.");
    } finally {
      setPaylasiliyor(false);
    }
  }, [benimPaylasilanKopek, paylasiliyor, topluluk]);

  // ---------------------------------------------------------------------------
  // Location Sharing Refresh Hook
  // ---------------------------------------------------------------------------

  const {
    toastGoster,
    devamEt,
    durdur,
    toastKapat,
  } = useKopekPaylasimYenileme(
    benimPaylasilanKopek?.id || null,
    paylasimDurdur
  );

  // ---------------------------------------------------------------------------
  // Create cached marker icons
  // ---------------------------------------------------------------------------

  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    for (const tur of isaretciTuruListesi) {
      icons[tur] = createMarkerIcon(tur);
    }
    return icons;
  }, []);

  // Kopek marker icon'lari (thumbnailData ve cerceveTipi bazli)
  const kopekMarkerIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    for (const k of topluluk.toplulukKopekleri) {
      icons.set(k.id, createDogMarkerIcon(k.thumbnailData, k.cinsiyet, k.cerceveTipi));
    }
    return icons;
  }, [topluluk.toplulukKopekleri]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isCommunity = mapMode === "topluluk";

  // Zoom hesaplama - bolge yarıçapına göre
  const calculateZoomFromRadius = (yaricap: number): number => {
    // 50m → zoom 17, 100m → 16, 200m → 15, 500m+ → 14
    return Math.max(14, Math.min(17, 18 - Math.log2(yaricap / 50)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode Selector */}
      <div className="flex justify-center py-2 bg-white border-b border-gray-100">
        <SegmentedControl
          options={modSecenekleri}
          selected={mapMode}
          onChange={(v) => {
            setMapMode(v as "benim" | "topluluk");
            setSecilenKopek(null);
          }}
        />
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapInvalidateSize />
          <MapClickHandler onClick={handleMapClick} />
          <MapNavigator target={hedefKonum} />

          {/* Personal mode: markers */}
          {!isCommunity &&
            vm.filtrelenmisIsaretciler.map((isaretci) => (
              <Marker
                key={isaretci.id}
                position={[isaretci.enlem, isaretci.boylam]}
                icon={markerIcons[isaretci.tur]}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{isaretci.baslik}</p>
                    <p className="text-xs text-gray-500">
                      {isaretciTuruBaslik(isaretci.tur)}
                    </p>
                    {isaretci.not && (
                      <p className="text-xs text-gray-400 mt-1">
                        {isaretci.not}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {turkceTarihSaat(isaretci.tarih)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Community mode: pulsing circles */}
          {isCommunity &&
            topluluk.bolgeler.map((bolge) => (
              <PulsingCircle
                key={bolge.id}
                center={[bolge.enlem, bolge.boylam]}
                radius={bolge.yaricap}
                tur={bolge.tur}
                canli={bolge.canli}
                baslik={bolge.baslik}
                aciklama={bolge.aciklama}
                olusturanAd={bolge.olusturanAd}
                tarih={bolge.olusturmaTarihi}
                begeniler={bolge.begeniler}
                benimMi={bolge.olusturanId === topluluk.kullaniciId}
                onBegen={() => topluluk.bolgeBegenle(bolge.id)}
                onSil={() => topluluk.bolgeKaldir(bolge.id)}
              />
            ))}

          {/* Community mode: kopek pinleri */}
          {isCommunity &&
            topluluk.kopeklerGorunur &&
            topluluk.toplulukKopekleri.map((k) => {
              const isPremium = k.cerceveTipi && k.cerceveTipi !== "Normal";
              return (
                <Marker
                  key={`dog-${k.id}`}
                  position={[k.enlem, k.boylam]}
                  icon={kopekMarkerIcons.get(k.id) ?? createDogMarkerIcon(k.thumbnailData, k.cinsiyet, k.cerceveTipi)}
                  zIndexOffset={isPremium ? 1000 : 0}
                  eventHandlers={{
                    click: () => {
                      setSecilenKopek(k);
                      setAktifYolTarifi(null); // Önceki rotayı temizle
                    },
                  }}
                />
              );
            })}

          {/* Community mode: kayıp köpek kırmızı marker'ları */}
          {isCommunity &&
            kayipKopekler.map((kayip) => {
              const kayipIcon = L.divIcon({
                html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;animation:pulse 1.5s infinite;">
                  <div style="width:44px;height:44px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;">🚨</div>
                </div>`,
                className: "",
                iconSize: [44, 44],
                iconAnchor: [22, 44],
              });
              return (
                <Marker
                  key={`kayip-${kayip.id}`}
                  position={[kayip.enlem, kayip.boylam]}
                  icon={kayipIcon}
                  zIndexOffset={2000}
                  eventHandlers={{ click: () => setSecilenKayipKopek(kayip) }}
                />
              );
            })}

          {/* Yakın Yerler (Veteriner & PetShop) */}
          {!isCommunity &&
            yakinYerlerGorunur &&
            yakinYerler.map((yer) => {
              const icon = L.divIcon({
                html: `
                  <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${
                      yer.tip === "veteriner" ? "#ef4444" : "#3b82f6"
                    }; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;">
                      ${
                        yer.tip === "veteriner"
                          ? '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>'
                          : '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
                      }
                    </div>
                  </div>
                `,
                className: "",
                iconSize: [40, 40],
                iconAnchor: [20, 40],
              });

              return (
                <Marker
                  key={yer.id}
                  position={[yer.enlem, yer.boylam]}
                  icon={icon}
                  eventHandlers={{
                    click: (e) => {
                      // Seçili öğeleri temizle
                      setSecilenKopek(null);
                      setSecilenBolge(null);
                      // Popup'ı aç
                      e.target.openPopup();
                    },
                  }}
                >
                  <Popup
                    closeButton={true}
                    autoClose={false}
                    closeOnClick={false}
                  >
                    <div className="text-center min-w-[200px]">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                          yer.tip === "veteriner" ? "bg-red-100" : "bg-blue-100"
                        } mb-2`}
                      >
                        {yer.tip === "veteriner" ? (
                          <Stethoscope className="text-red-600" size={24} />
                        ) : (
                          <ShoppingBag className="text-blue-600" size={24} />
                        )}
                      </div>
                      <p className="font-semibold text-sm">{yer.ad}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {yer.tip === "veteriner" ? "Veteriner Kliniği" : "Pet Shop"}
                      </p>
                      {yer.mesafe && (
                        <p className="text-xs text-blue-600 font-medium">
                          📍 {mesafeFormat(yer.mesafe)} uzaklıkta
                        </p>
                      )}
                      {yer.adres && (
                        <p className="text-xs text-gray-400 mt-1">{yer.adres}</p>
                      )}
                      {yer.telefon && (
                        <p className="text-xs text-gray-600 mt-1">
                          📞 {yer.telefon}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSecilenKopek(null);
                            setSecilenBolge(null);
                            setAktifYolTarifi({ hedef: [yer.enlem, yer.boylam], kopekAd: yer.ad });
                            // Mobilde popup'ı kapat
                            setTimeout(() => {
                              const closeButton = document.querySelector('.leaflet-popup-close-button') as HTMLElement;
                              if (closeButton) closeButton.click();
                            }, 100);
                          }}
                          className="w-full px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
                        >
                          🧭 Yol Tarifi Başlat
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSecilenKopek(null);
                            setSecilenBolge(null);
                            setTimeout(() => {
                              setHedefKonum({ enlem: yer.enlem, boylam: yer.boylam, zoom: 17 });
                              // Mobilde popup'ı kapat
                              const closeButton = document.querySelector('.leaflet-popup-close-button') as HTMLElement;
                              if (closeButton) closeButton.click();
                            }, 50);
                          }}
                          className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
                        >
                          📍 Konuma Git
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Kullanici konumu marker (pulsing blue circle) */}
          {konumGosteriliyor && kullaniciKonumu && (
            <>
              {/* Outer pulsing ring */}
              <Circle
                center={kullaniciKonumu}
                radius={12}
                pathOptions={{
                  fillColor: "#3b82f6",
                  fillOpacity: 0.2,
                  color: "#3b82f6",
                  weight: 2,
                  opacity: 0.6,
                }}
              />
              {/* Inner solid dot */}
              <Circle
                center={kullaniciKonumu}
                radius={4}
                pathOptions={{
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                  color: "#1d4ed8",
                  weight: 1,
                  opacity: 1,
                }}
              />
            </>
          )}

          {/* Yol tarifi hattı (aktifse) */}
          {aktifYolTarifi && kullaniciKonumuTakip && (
            <>
              <YolTarifiHatti
                baslangic={kullaniciKonumuTakip}
                hedef={aktifYolTarifi.hedef}
                kopekAd={aktifYolTarifi.kopekAd}
                onRotaBilgisi={setRotaBilgisi}
              />
              {/* Kullanıcı konumu marker (mavi pulsing - rota için) */}
              <Circle
                center={kullaniciKonumuTakip}
                radius={12}
                pathOptions={{
                  fillColor: "#3b82f6",
                  fillOpacity: 0.3,
                  color: "#3b82f6",
                  weight: 2,
                  opacity: 0.8,
                }}
              />
              <Circle
                center={kullaniciKonumuTakip}
                radius={4}
                pathOptions={{
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                  color: "#1d4ed8",
                  weight: 1,
                  opacity: 1,
                }}
              />
            </>
          )}

          {/* Konumum butonu - her iki modda da görünür */}
          <KonumumButon
            onKonumBulundu={(konum) => {
              setKullaniciKonumu(konum);
              setKonumGosteriliyor(true);

              // 5 saniye sonra markeri kaldır
              setTimeout(() => {
                setKonumGosteriliyor(false);
              }, 5000);
            }}
          />

        </MapContainer>

        {/* Yol Tarifi Aktif: Yükleniyor / Hata / Durdur Butonu (MapContainer DIŞINDA) */}
        {aktifYolTarifi && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-center gap-2 pointer-events-none">
            {konumYukleniyor && !kullaniciKonumuTakip && (
              <div className="bg-white rounded-xl px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-sm text-gray-700">Konumunuz alınıyor...</span>
              </div>
            )}
            {konumHata && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
                <span className="text-sm text-red-600">{konumHata}. Konum iznini kontrol edin.</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setAktifYolTarifi(null)}
              className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors pointer-events-auto"
            >
              <X size={16} className="text-red-500" />
              Navigasyonu Durdur
            </button>
          </div>
        )}

        {/* Filtre butonu + açılır panel */}
        <div className="absolute top-3 left-3 z-[1000]">
          {/* Filtre aç/kapat butonu */}
          <button
            type="button"
            onClick={() => setFiltrePaneliAcik(!filtrePaneliAcik)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-md text-sm font-medium transition-colors ${
              filtrePaneliAcik
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            <Filter size={15} />
            Filtrele
          </button>

          {/* Açılır filtre paneli */}
          {filtrePaneliAcik && (
            <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 flex flex-col gap-2 min-w-[180px]">
              {!isCommunity && (
                <>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">İşaretçiler</p>
                  {isaretciTuruListesi.map((tur) => {
                    const isActive =
                      vm.secilenFiltreler.size === 0 ||
                      vm.secilenFiltreler.has(tur);
                    return (
                      <button
                        key={tur}
                        type="button"
                        onClick={() => vm.filtreToggle(tur)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? `${turRenkClass(tur)} text-white`
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {getMarkerTypeIcon(tur)}
                        {isaretciTuruBaslik(tur)}
                      </button>
                    );
                  })}

                  <div className="border-t border-gray-100 my-1" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Yakın Yerler</p>

                  {/* Veteriner / PetShop filtresi */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!yakinYerlerGorunur && yakinYerler.length === 0) {
                        setYakinYerlerYukleniyor(true);
                        try {
                          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                              enableHighAccuracy: true,
                              timeout: 15000,
                            });
                          });
                          const konum: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                          setKullaniciKonumu(konum);
                          const yerler = await yakinYerleriGetir(konum[0], konum[1], 3000);
                          setYakinYerler(yerler);
                        } catch (err) {
                          if (err instanceof GeolocationPositionError) {
                            alert("Konum izni verilmedi. Ayarlardan izin verin.");
                          } else {
                            alert("Konum alınırken bir hata oluştu.");
                          }
                        } finally {
                          setYakinYerlerYukleniyor(false);
                        }
                      }
                      setYakinYerlerGorunur(!yakinYerlerGorunur);
                    }}
                    disabled={yakinYerlerYukleniyor}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      yakinYerlerGorunur
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {yakinYerlerYukleniyor ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Stethoscope size={14} />
                    )}
                    Veteriner / PetShop
                  </button>
                </>
              )}

              {isCommunity && (
                <>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Bölgeler</p>
                  {bolgeTuruListesi.map((tur) => {
                    const isActive =
                      topluluk.secilenFiltreler.size === 0 ||
                      topluluk.secilenFiltreler.has(tur);
                    const isTehlikeli = tur === BolgeTuru.Tehlikeli;
                    return (
                      <button
                        key={tur}
                        type="button"
                        onClick={() => topluluk.filtreToggle(tur)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? isTehlikeli
                              ? "bg-red-500 text-white"
                              : "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {getBolgeIcon(tur)}
                        {bolgeTuruBaslik(tur)}
                      </button>
                    );
                  })}

                  <div className="border-t border-gray-100 my-1" />

                  {/* Kopekler filtresi */}
                  <button
                    type="button"
                    onClick={() => topluluk.kopekFiltreToggle()}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      topluluk.kopeklerGorunur
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <PawPrint size={14} />
                    Köpekler
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Community loading overlay */}
        {isCommunity && (topluluk.yukleniyor || topluluk.kopekYukleniyor) && (
          <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
            <div className="bg-white/90 rounded-xl px-4 py-3 flex items-center gap-2 shadow-md">
              <Loader2 size={16} className="animate-spin text-orange-500" />
              <span className="text-sm text-gray-600">Yukleniyor...</span>
            </div>
          </div>
        )}

        {/* Navigasyon Süre Kartı */}
        {aktifYolTarifi && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-max">
            <div className="bg-blue-500 px-3 py-2">
              <p className="text-white text-xs font-semibold truncate max-w-[160px]">
                📍 {aktifYolTarifi.kopekAd}
              </p>
              {rotaBilgisi && !rotaBilgisi.yukleniyor && (
                <p className="text-blue-100 text-[10px] mt-0.5">
                  {mesafeFormati(rotaBilgisi.mesafe)}
                </p>
              )}
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🚶</span>
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Yürüyerek</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {!rotaBilgisi || rotaBilgisi.yukleniyor
                      ? "..."
                      : rotaBilgisi.yuruyusDakika !== null
                      ? sureFomati(rotaBilgisi.yuruyusDakika)
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚗</span>
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Araçla</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {!rotaBilgisi || rotaBilgisi.yukleniyor
                      ? "..."
                      : rotaBilgisi.aracDakika !== null
                      ? sureFomati(rotaBilgisi.aracDakika)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAB: Konumuma İşaretçi Ekle (benim haritam modunda) */}
        {!isCommunity && (
          <button
            type="button"
            onClick={konumAdreseEkle}
            disabled={konumAdreseYukleniyor}
            className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-full shadow-lg transition-colors"
          >
            {konumAdreseYukleniyor ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MapPin size={18} />
            )}
            {konumAdreseYukleniyor ? "Konum alınıyor..." : "Konumuma Ekle"}
          </button>
        )}

        {/* FAB: Kopegimi Paylas / Paylasimi Durdur (topluluk modunda) */}
        {isCommunity && !secilenKopek && (
          benimPaylasilanKopek ? (
            <button
              type="button"
              onClick={paylasimDurdur}
              disabled={paylasiliyor}
              className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-full shadow-lg transition-colors"
            >
              {paylasiliyor ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <X size={18} />
              )}
              {paylasiliyor ? "Durduruluyor..." : "Paylasimi Durdur"}
            </button>
          ) : (
            <button
              type="button"
              onClick={kopeginiPaylas}
              disabled={paylasiliyor || !kopek}
              className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-full shadow-lg transition-colors"
            >
              {paylasiliyor ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <PawPrint size={18} />
              )}
              {paylasiliyor ? "Paylasiliyor..." : "Kopegimi Paylas"}
            </button>
          )
        )}

        {/* FAB: Kayıp Bildir - topluluk modunda */}
        {isCommunity && !secilenKopek && (
          <button
            type="button"
            onClick={() => setShowKayipModal(true)}
            className="absolute bottom-20 right-4 z-[1000] flex items-center gap-2 px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg transition-colors text-sm"
          >
            🚨 Kayıp Bildir
          </button>
        )}

        {/* Topluluk Chat Widget */}
        {isCommunity && <ToplulukChatWidget />}

        {/* Görev Widget - Hem kişisel hem topluluk haritasında */}
        {kopek?.id && <GorevWidget kopekId={kopek.id} />}
      </div>

      {/* Bottom panel */}
      <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-20">
        {!isCommunity ? (
          // Personal marker list
          vm.filtrelenmisIsaretciler.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              Henuz isaretci yok. Haritaya tiklayarak ekleyin.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {vm.filtrelenmisIsaretciler.map((isaretci) => (
                <div
                  key={isaretci.id}
                  className={`flex-shrink-0 w-48 ${turRenkBg(
                    isaretci.tur
                  )} rounded-xl p-3 border ${turRenkBorder(isaretci.tur)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={turRenkText(isaretci.tur)}>
                          {getMarkerTypeIcon(isaretci.tur)}
                        </span>
                        <p
                          className={`text-sm font-semibold truncate ${turRenkText(
                            isaretci.tur
                          )}`}
                        >
                          {isaretci.baslik}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isaretciTuruBaslik(isaretci.tur)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {turkceTarihSaat(isaretci.tarih)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        isaretci.id && vm.isaretciSil(isaretci.id)
                      }
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : secilenKonusma ? (
          // Ozel mesajlasma paneli
          <MesajPanel
            konusmaId={secilenKonusma.konusmaId}
            karsiTarafAd={secilenKonusma.karsiTarafAd}
            onKapat={() => setSecilenKonusma(null)}
          />
        ) : secilenBolge ? (
          // Secilen bolge yorum paneli
          <BolgeYorumPanel
            bolge={secilenBolge}
            onKapat={() => setSecilenBolge(null)}
            onYolTarifi={() => setAktifYolTarifi({ hedef: [secilenBolge.enlem, secilenBolge.boylam], kopekAd: secilenBolge.baslik })}
          />
        ) : secilenKopek && kopekYorumGorunur ? (
          // Secilen kopek yorum paneli
          <KopekYorumPanel
            kopek={secilenKopek}
            onKapat={() => {
              setKopekYorumGorunur(false);
              setSecilenKopek(null);
            }}
          />
        ) : secilenKopek ? (
          // Secilen kopek profil karti
          <KopekProfilKarti
            kopek={secilenKopek}
            benimMi={secilenKopek.olusturanId === topluluk.kullaniciId}
            onKapat={() => {
              setSecilenKopek(null);
              setKopekYorumGorunur(false);
              setAktifYolTarifi(null); // Rotayı temizle
            }}
            onSil={() => {
              topluluk.kopekGeriCek(secilenKopek.id);
              setSecilenKopek(null);
              setKopekYorumGorunur(false);
              setAktifYolTarifi(null); // Rotayı temizle
            }}
            onBegen={
              secilenKopek.olusturanId !== topluluk.kullaniciId
                ? () => topluluk.kopekBegenle(secilenKopek.id)
                : undefined
            }
            onYorumAc={
              secilenKopek.olusturanId !== topluluk.kullaniciId
                ? () => setKopekYorumGorunur(true)
                : undefined
            }
            begenildiMi={topluluk.kopekBegenilenIdler.has(secilenKopek.id)}
            onYolTarifi={
              secilenKopek.olusturanId !== topluluk.kullaniciId
                ? (hedef, kopekAd) => setAktifYolTarifi({ hedef, kopekAd })
                : undefined
            }
            onMesajGonder={async (karsiTarafId, karsiTarafAd) => {
              try {
                const konusmaId = await konusmaOlusturVeyaGetir(karsiTarafId);
                setSecilenKonusma({ konusmaId, karsiTarafAd });
              } catch (err) {
                console.error("Konusma baslatma hatasi:", err);
              }
            }}
          />
        ) : (
          // Community zone list
          <>
            {topluluk.hata && (
              <div className="text-center py-2 text-red-500 text-xs mb-2">
                {topluluk.hata}
              </div>
            )}
            <ZoneListPanel
              bolgeler={topluluk.bolgeler}
              kullaniciId={topluluk.kullaniciId}
              onBegen={(id) => topluluk.bolgeBegenle(id)}
              onSil={(id) => topluluk.bolgeKaldir(id)}
              onZoneClick={(bolge) => setSecilenBolge(bolge)}
              onNavigate={(enlem, boylam, yaricap) => {
                const zoom = calculateZoomFromRadius(yaricap);
                setHedefKonum({ enlem, boylam, zoom });
              }}
              onYolTarifi={(enlem, boylam, baslik) =>
                setAktifYolTarifi({ hedef: [enlem, boylam], kopekAd: baslik })
              }
            />
          </>
        )}
      </div>

      {/* ================================================================== */}
      {/* Add Marker Modal (personal mode) */}
      {/* ================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Isaretci Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Baslik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Baslik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.baslik}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, baslik: e.target.value }))
                  }
                  placeholder="Isaretci adi..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
                />
              </div>

              {/* Tur picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tur
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {isaretciTuruListesi.map((tur) => (
                    <button
                      key={tur}
                      type="button"
                      onClick={() =>
                        setAddForm((prev) => ({
                          ...prev,
                          tur,
                          // Başlık hâlâ bir tür adıysa (kullanıcı değiştirmediyse) otomatik güncelle
                          baslik: isaretciTuruListesi.some(t => isaretciTuruBaslik(t) === prev.baslik)
                            ? isaretciTuruBaslik(tur)
                            : prev.baslik,
                        }))
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        addForm.tur === tur
                          ? `${turRenkBg(tur)} ${turRenkBorder(tur)} ${turRenkText(tur)}`
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {getMarkerTypeIcon(tur)}
                      {isaretciTuruBaslik(tur)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Not */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={addForm.not}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none text-sm"
                />
              </div>

              {/* Coordinates display */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Enlem:</span>{" "}
                  {addForm.enlem.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-medium">Boylam:</span>{" "}
                  {addForm.boylam.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                type="button"
                onClick={saveMarker}
                disabled={!addForm.baslik.trim()}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Location Sharing Refresh Toast */}
      {/* ================================================================== */}
      {toastGoster && (
        <Toast
          message="Paylaşmaya devam edilsin mi?"
          onYes={devamEt}
          onNo={durdur}
          onClose={toastKapat}
        />
      )}

      {/* ================================================================== */}
      {/* Add Zone Modal (community mode) */}
      {/* ================================================================== */}
      {showZoneModal && (
        <AddZoneModal
          enlem={zoneCoords.enlem}
          boylam={zoneCoords.boylam}
          onSave={saveZone}
          onClose={() => setShowZoneModal(false)}
        />
      )}

      {/* ================================================================== */}
      {/* Kayıp Köpek Bilgi Paneli */}
      {/* ================================================================== */}
      {secilenKayipKopek && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setSecilenKayipKopek(null)}>
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">🚨</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-700">Kayıp Köpek İlanı</h3>
                <p className="text-xs text-gray-500">
                  {new Date(secilenKayipKopek.olusturmaTarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button type="button" onClick={() => setSecilenKayipKopek(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {secilenKayipKopek.thumbnailData && (
              <img src={secilenKayipKopek.thumbnailData} alt={secilenKayipKopek.kopekAd} className="w-full h-40 object-cover rounded-2xl mb-4" />
            )}

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">İsim</span>
                <span className="text-sm font-semibold text-gray-900">{secilenKayipKopek.kopekAd}</span>
              </div>
              {secilenKayipKopek.irk && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Irk</span>
                  <span className="text-sm font-semibold text-gray-900">{secilenKayipKopek.irk}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Sahip</span>
                <span className="text-sm font-semibold text-gray-900">{secilenKayipKopek.sahipAd}</span>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700">{secilenKayipKopek.aciklama}</p>
            </div>

            <a
              href={`tel:${secilenKayipKopek.iletisim}`}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-red-600"
            >
              📞 {secilenKayipKopek.iletisim}
            </a>

            {secilenKayipKopek.sahipId === topluluk.kullaniciId && (
              <button
                type="button"
                onClick={async () => {
                  await kayipKopekKapat(secilenKayipKopek.id);
                  setSecilenKayipKopek(null);
                }}
                className="w-full mt-2 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ✅ Bulundu / İlanı Kapat
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Kayıp Köpek Bildir Modalı */}
      {/* ================================================================== */}
      {showKayipModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-red-700">🚨 Kayıp Köpek Bildir</h3>
              <button type="button" onClick={() => setShowKayipModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-red-700">İlanınız topluluk haritasında 7 gün boyunca görünür olacak. Köpeğiniz bulunduğunda lütfen ilanı kapatın.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Köpeğin Adı *</label>
                <input
                  type="text"
                  value={kayipForm.kopekAd}
                  onChange={(e) => setKayipForm(f => ({ ...f, kopekAd: e.target.value }))}
                  placeholder="Köpeğinizin adı"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Irk <span className="text-gray-400">(isteğe bağlı)</span></label>
                <input
                  type="text"
                  value={kayipForm.irk}
                  onChange={(e) => setKayipForm(f => ({ ...f, irk: e.target.value }))}
                  placeholder="ör. Golden Retriever, Labrador..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama *</label>
                <textarea
                  value={kayipForm.aciklama}
                  onChange={(e) => setKayipForm(f => ({ ...f, aciklama: e.target.value }))}
                  placeholder="Renk, boyut, son görüldüğü yer, ayırt edici özellikler..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İletişim *</label>
                <input
                  type="text"
                  value={kayipForm.iletisim}
                  onChange={(e) => setKayipForm(f => ({ ...f, iletisim: e.target.value }))}
                  placeholder="Telefon numaranız"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={kayipGonderiyor || !kayipForm.kopekAd.trim() || !kayipForm.aciklama.trim() || !kayipForm.iletisim.trim()}
              onClick={async () => {
                setKayipGonderiyor(true);
                try {
                  const konum = await new Promise<GeolocationPosition>((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                  );
                  await kayipKopekBildir({
                    kopekAd: kayipForm.kopekAd,
                    irk: kayipForm.irk || undefined,
                    aciklama: kayipForm.aciklama,
                    iletisim: kayipForm.iletisim,
                    enlem: konum.coords.latitude,
                    boylam: konum.coords.longitude,
                  });
                  setShowKayipModal(false);
                  setKayipForm({ kopekAd: "", irk: "", aciklama: "", iletisim: "" });
                } catch {
                  alert("Konum alınamadı. Lütfen konum iznini açın.");
                } finally {
                  setKayipGonderiyor(false);
                }
              }}
              className="w-full mt-5 bg-red-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {kayipGonderiyor ? "Gönderiliyor..." : "🚨 Kayıp İlanı Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Online Arkadas Bildirim */}
      {/* ================================================================== */}
      <OnlineArkadasBildirim
        bildirim={onlineBildirim}
        onKapat={() => setOnlineBildirim(null)}
      />
    </div>
  );
};

export default MapPage;
