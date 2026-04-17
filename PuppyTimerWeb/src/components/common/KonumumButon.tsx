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
      className="absolute top-3 left-3 z-[1000] w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors"
      style={{ background: 'var(--color-bg-card)', color: 'var(--color-accent-warm)', border: '1px solid var(--color-border)' }}
      title="Konumuma git"
    >
      {yukleniyor ? <Loader2 size={17} className="animate-spin" /> : <Navigation size={17} />}
    </button>
  );
};

export default KonumumButon;
