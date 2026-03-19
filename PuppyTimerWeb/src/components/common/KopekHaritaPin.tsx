// =============================================================================
// PawLand - KopekHaritaPin
// Leaflet icin ozel kopek avatar marker icon'u
// =============================================================================

import L from "leaflet";
import { CerceveTipi } from "../../types/enums";

export function createDogMarkerIcon(
  thumbnailData?: string,
  cinsiyet?: string,
  cerceveTipi?: CerceveTipi
): L.DivIcon {
  const isPremium = cerceveTipi && cerceveTipi !== CerceveTipi.Normal;

  // Premium markers: 48px, Normal: 40px
  const size = isPremium ? 48 : 40;
  const imgSize = isPremium ? 40 : 32;
  const totalHeight = size + 8; // +8 for arrow

  const bgColor = cinsiyet === "Erkek" ? "#60a5fa" : "#f472b6";

  const imgHtml = thumbnailData
    ? `<img src="data:image/jpeg;base64,${thumbnailData}" style="width:${imgSize}px;height:${imgSize}px;border-radius:50%;object-fit:cover;" />`
    : `<div style="width:${imgSize}px;height:${imgSize}px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;font-size:${imgSize / 2}px;"></div>`;

  // Frame styling based on cerceveTipi
  let borderColor = "#f97316"; // Default orange
  let borderWidth = "3px";
  let boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  let extraEffects = "";
  let animationClass = "";

  if (isPremium && cerceveTipi) {
    borderWidth = "4px";

    switch (cerceveTipi) {
      case CerceveTipi.KralTaci:
        borderColor = "#fbbf24"; // Gold
        boxShadow = "0 0 12px rgba(251, 191, 36, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-gold-pulse";
        extraEffects = `
          <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:20px;"></div>
        `;
        break;
      case CerceveTipi.KraliceTaci:
        borderColor = "#ec4899"; // Pink
        boxShadow = "0 0 12px rgba(236, 72, 153, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-pink-shimmer";
        extraEffects = `
          <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:20px;"></div>
        `;
        break;
      case CerceveTipi.KirmiziKurdele:
        borderColor = "#dc2626"; // Red
        boxShadow = "0 0 12px rgba(220, 38, 38, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-red-glow";
        extraEffects = `
          <div style="position:absolute;top:-6px;right:-6px;font-size:16px;"></div>
        `;
        break;
      case CerceveTipi.Yildiz:
        borderColor = "#3b82f6"; // Blue
        boxShadow = "0 0 12px rgba(59, 130, 246, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-star-twinkle";
        extraEffects = `
          <div style="position:absolute;top:-6px;left:-6px;font-size:16px;"></div>
        `;
        break;
      case CerceveTipi.Elmas:
        borderColor = "#8b5cf6"; // Purple
        boxShadow = "0 0 12px rgba(139, 92, 246, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-diamond-shimmer";
        extraEffects = `
          <div style="position:absolute;top:-6px;right:-6px;font-size:16px;"></div>
        `;
        break;
      case CerceveTipi.Ates:
        borderColor = "#f97316"; // Orange
        boxShadow = "0 0 12px rgba(249, 115, 22, 0.6), 0 2px 8px rgba(0,0,0,0.3)";
        animationClass = "animate-fire-flame";
        extraEffects = `
          <div style="position:absolute;top:-6px;left:-6px;font-size:16px;"></div>
        `;
        break;
    }
  }

  const html = `
    <div style="position:relative;width:${size}px;height:${totalHeight}px;">
      <div class="${animationClass}" style="
        width:${size}px;height:${size}px;border-radius:50%;
        border:${borderWidth} solid ${borderColor};
        background:#fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:${boxShadow};
        overflow:hidden;
      ">
        ${imgHtml}
      </div>
      <div style="
        position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${borderColor};
      "></div>
      ${extraEffects}
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, totalHeight],
    iconAnchor: [size / 2, totalHeight],
    popupAnchor: [0, -totalHeight],
  });
}
