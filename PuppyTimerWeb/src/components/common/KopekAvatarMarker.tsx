// =============================================================================
// PawLand - KopekAvatarMarker
// Haritada kullanicinin konumunda kopegin profil fotografi ile bouncing avatar
// =============================================================================

import { useEffect, useMemo } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

interface KopekAvatarMarkerProps {
  konum: [number, number];
  thumbnailData?: string;
  kopekAd: string;
  cinsiyet?: string;
  tpsMode: boolean;
}

function createAvatarIcon(thumbnailData?: string, cinsiyet?: string): L.DivIcon {
  const size = 56;
  const imgSize = 48;
  const bgColor = cinsiyet === "Erkek" ? "#60a5fa" : "#f472b6";

  const imgHtml = thumbnailData
    ? `<img src="data:image/jpeg;base64,${thumbnailData}" style="width:${imgSize}px;height:${imgSize}px;border-radius:50%;object-fit:cover;" />`
    : `<div style="width:${imgSize}px;height:${imgSize}px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;"></div>`;

  const html = `
    <div class="kopek-avatar-bounce" style="position:relative;width:${size}px;height:${size + 12}px;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        border:4px solid #e07a2f;
        background:#fffcf7;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 16px rgba(224,122,47,0.4), 0 4px 12px rgba(61,46,31,0.15);
        overflow:hidden;
      ">
        ${imgHtml}
      </div>
      <div style="
        width:20px;height:6px;border-radius:50%;
        background:rgba(0,0,0,0.15);
        margin-top:4px;
        animation:kopek-avatar-shadow 1.5s ease-in-out infinite;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
  });
}

const KopekAvatarMarker: React.FC<KopekAvatarMarkerProps> = ({
  konum,
  thumbnailData,
  kopekAd: _kopekAd,
  cinsiyet,
  tpsMode,
}) => {
  const map = useMap();

  const icon = useMemo(
    () => createAvatarIcon(thumbnailData, cinsiyet),
    [thumbnailData, cinsiyet]
  );

  // TPS modda harita kopegin konumunu takip eder
  useEffect(() => {
    if (tpsMode) {
      map.flyTo(konum, Math.max(map.getZoom(), 17), { duration: 0.8 });
    }
  }, [konum, tpsMode, map]);

  return <Marker position={konum} icon={icon} zIndexOffset={5000} />;
};

export default KopekAvatarMarker;
