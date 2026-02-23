import React from "react";
import L from "leaflet";
import { Footprints, Leaf, Droplets, Star, MapPin } from "lucide-react";
import { IsaretciTuru } from "../../types/enums";
import { renderToStaticMarkup } from "react-dom/server";

const isaretciRenkHex: Record<IsaretciTuru, string> = {
  [IsaretciTuru.Yuruyus]: "#22c55e",
  [IsaretciTuru.BuyukTuvalet]: "#92400e",
  [IsaretciTuru.KucukTuvalet]: "#eab308",
  [IsaretciTuru.Favori]: "#f97316",
  [IsaretciTuru.Diger]: "#6b7280",
};

function getIconComponent(type: IsaretciTuru, iconSize: number) {
  const props = { size: iconSize, color: "#ffffff", strokeWidth: 2.5 };
  switch (type) {
    case IsaretciTuru.Yuruyus:
      return <Footprints {...props} />;
    case IsaretciTuru.BuyukTuvalet:
      return <Leaf {...props} />;
    case IsaretciTuru.KucukTuvalet:
      return <Droplets {...props} />;
    case IsaretciTuru.Favori:
      return <Star {...props} />;
    case IsaretciTuru.Diger:
      return <MapPin {...props} />;
  }
}

interface MarkerPinProps {
  type: IsaretciTuru;
  size?: number;
}

const MarkerPin: React.FC<MarkerPinProps> = ({ type, size = 32 }) => {
  const bgColor = isaretciRenkHex[type];
  const iconSize = size * 0.5;
  const triangleSize = size * 0.3;

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-full flex items-center justify-center shadow-md"
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
        }}
      >
        {getIconComponent(type, iconSize)}
      </div>
      <svg
        width={triangleSize}
        height={triangleSize * 0.6}
        viewBox="0 0 10 6"
        style={{ marginTop: -2 }}
      >
        <polygon points="0,0 10,0 5,6" fill={bgColor} />
      </svg>
    </div>
  );
};

export function createMarkerIcon(type: IsaretciTuru): L.DivIcon {
  const size = 32;

  const iconSvg = renderToStaticMarkup(
    <MarkerPin type={type} size={size} />
  );

  return L.divIcon({
    html: iconSvg,
    className: "custom-marker-icon",
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 6)],
  });
}

export default MarkerPin;
