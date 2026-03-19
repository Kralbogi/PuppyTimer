import { useState, useEffect, useRef } from "react";
import { Polyline, CircleMarker } from "react-leaflet";
import { haversineUzaklik } from "../../services/locationUtils";

export interface RotaBilgisi {
  mesafe: number;
  yuruyusDakika: number | null;
  aracDakika: number | null;
  yukleniyor: boolean;
}

interface YolTarifiHattiProps {
  baslangic: [number, number];
  hedef: [number, number];
  kopekAd: string;
  onRotaBilgisi?: (bilgi: RotaBilgisi) => void;
}

interface RotaSonuc {
  noktalar: [number, number][];
  yuruyusDakika: number;
  aracDakika: number | null;
}

// Mesafeden araç süresi tahmini (40 km/h şehir içi)
function aracSuresiTahmin(mesafeM: number): number {
  return Math.ceil((mesafeM / 1000 / 40) * 60);
}

// OSRM üzerinden yürüyüş rotası + araç süresi (paralel istek)
async function osrmRotaGetir(
  baslangic: [number, number],
  hedef: [number, number],
  mesafeM: number
): Promise<RotaSonuc | null> {
  const koord = `${baslangic[1]},${baslangic[0]};${hedef[1]},${hedef[0]}`;
  const yuruyusUrl = `https://router.project-osrm.org/route/v1/foot/${koord}?overview=full&geometries=geojson`;
  const aracUrl    = `https://router.project-osrm.org/route/v1/driving/${koord}?overview=false`;

  const [yuruyusRes, aracRes] = await Promise.all([
    fetch(yuruyusUrl, { signal: AbortSignal.timeout(8000) }),
    fetch(aracUrl,    { signal: AbortSignal.timeout(5000) }).catch(() => null),
  ]);

  if (!yuruyusRes.ok) return null;
  const yuruyusData = await yuruyusRes.json();
  if (yuruyusData.code !== "Ok" || !yuruyusData.routes?.[0]) return null;

  const noktalar: [number, number][] = yuruyusData.routes[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );

  // Yürüyüş: OSRM duration güvenilmez (bazen araç hızında döner).
  // Bunun yerine OSRM'nin hesapladığı rota mesafesini 5 km/h ile böl.
  const yuruyusMesafe: number = yuruyusData.routes[0].distance ?? mesafeM * 1.35;
  const yuruyusDakika = Math.ceil((yuruyusMesafe / 1000 / 5) * 60);

  // Araç: OSRM driving süresi, implied hız 5–130 km/h aralığında değilse fallback
  let aracDakika: number | null = null;
  if (aracRes?.ok) {
    const aracData = await aracRes.json();
    if (aracData.code === "Ok" && aracData.routes?.[0]) {
      const osrmSure: number  = aracData.routes[0].duration;           // saniye
      const osrmMesafe: number = aracData.routes[0].distance ?? mesafeM * 1.35;
      const impliedHiz = (osrmMesafe / 1000) / (osrmSure / 3600);    // km/h
      if (impliedHiz >= 5 && impliedHiz <= 130) {
        aracDakika = Math.ceil(osrmSure / 60);
      }
    }
  }
  if (aracDakika === null) {
    aracDakika = aracSuresiTahmin(mesafeM);
  }

  return { noktalar, yuruyusDakika, aracDakika };
}

const YolTarifiHatti: React.FC<YolTarifiHattiProps> = ({
  baslangic,
  hedef,
  onRotaBilgisi,
}) => {
  const [rotaNoktalar, setRotaNoktalar] = useState<[number, number][] | null>(null);
  const [rotaYukleniyor, setRotaYukleniyor] = useState(true);
  const oncekiAnahtar = useRef<string>("");

  const mesafe = haversineUzaklik(baslangic[0], baslangic[1], hedef[0], hedef[1]);

  useEffect(() => {
    const anahtar = `${baslangic[0].toFixed(4)},${baslangic[1].toFixed(4)},${hedef[0].toFixed(5)},${hedef[1].toFixed(5)}`;
    if (anahtar === oncekiAnahtar.current) return;
    oncekiAnahtar.current = anahtar;

    setRotaYukleniyor(true);
    onRotaBilgisi?.({ mesafe, yuruyusDakika: null, aracDakika: null, yukleniyor: true });

    osrmRotaGetir(baslangic, hedef, mesafe)
      .then((sonuc) => {
        if (sonuc) {
          setRotaNoktalar(sonuc.noktalar);
          onRotaBilgisi?.({
            mesafe,
            yuruyusDakika: sonuc.yuruyusDakika,
            aracDakika: sonuc.aracDakika,
            yukleniyor: false,
          });
        } else {
          setRotaNoktalar([baslangic, hedef]);
          // OSRM tamamen başarısız → iki tahmin de mesafe bazlı
          const yuruyusTahmin = Math.ceil((mesafe / 1000 / 5) * 60);
          onRotaBilgisi?.({
            mesafe,
            yuruyusDakika: yuruyusTahmin,
            aracDakika: aracSuresiTahmin(mesafe),
            yukleniyor: false,
          });
        }
      })
      .catch(() => {
        setRotaNoktalar([baslangic, hedef]);
        const yuruyusTahmin = Math.ceil((mesafe / 1000 / 5) * 60);
        onRotaBilgisi?.({
          mesafe,
          yuruyusDakika: yuruyusTahmin,
          aracDakika: aracSuresiTahmin(mesafe),
          yukleniyor: false,
        });
      })
      .finally(() => setRotaYukleniyor(false));
  }, [baslangic, hedef, mesafe, onRotaBilgisi]);

  return (
    <>
      {/* Rota çizgisi */}
      <Polyline
        positions={rotaNoktalar ?? [baslangic, hedef]}
        pathOptions={{
          color: "#3b82f6",
          weight: rotaYukleniyor ? 2 : 5,
          opacity: rotaYukleniyor ? 0.4 : 0.85,
          dashArray: rotaYukleniyor ? "8, 8" : undefined,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Mavi gölge çizgisi (derinlik) */}
      {!rotaYukleniyor && rotaNoktalar && (
        <Polyline
          positions={rotaNoktalar}
          pathOptions={{
            color: "#1d4ed8",
            weight: 7,
            opacity: 0.3,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {/* Hedef vurgulama (turuncu halka) */}
      <CircleMarker
        center={hedef}
        radius={14}
        pathOptions={{
          color: "#f97316",
          weight: 3,
          opacity: 0.7,
          fillColor: "#f97316",
          fillOpacity: 0.15,
        }}
      />
    </>
  );
};

export default YolTarifiHatti;
