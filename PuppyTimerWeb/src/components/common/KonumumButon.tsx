import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { Navigation, Loader2 } from "lucide-react";
import L from "leaflet";

interface KonumumButonProps {
  onKonumBulundu?: (konum: [number, number]) => void;
}

const KonumumButon: React.FC<KonumumButonProps> = ({ onKonumBulundu }) => {
  const map = useMap();
  const [yukleniyor, setYukleniyor] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Leaflet'in click propagation'ını engelle
  useEffect(() => {
    if (buttonRef.current) {
      L.DomEvent.disableClickPropagation(buttonRef.current);
      L.DomEvent.disableScrollPropagation(buttonRef.current);
    }
  }, []);

  const konumaGit = async () => {
    if (yukleniyor) return;

    setYukleniyor(true);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });

      const konum: [number, number] = [pos.coords.latitude, pos.coords.longitude];

      // Haritayı konuma götür
      map.flyTo(konum, 16, { duration: 1.5 });

      // Parent'a konumu bildir
      if (onKonumBulundu) {
        onKonumBulundu(konum);
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            alert("Konum izni verilmedi. Ayarlardan izin verin.");
            break;
          case err.POSITION_UNAVAILABLE:
            alert("Konum belirlenemedi. İnternet bağlantınızı kontrol edin.");
            break;
          case err.TIMEOUT:
            alert("Konum alınırken zaman aşımı. Tekrar deneyin.");
            break;
        }
      } else {
        alert("Konum alınırken bir hata oluştu.");
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={konumaGit}
      disabled={yukleniyor}
      className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-full shadow-lg transition-colors"
      title="Konumuma git"
    >
      {yukleniyor ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
      Konumum
    </button>
  );
};

export default KonumumButon;
