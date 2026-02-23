// =============================================================================
// PuppyTimer Web - SepetButton
// Floating shopping cart button with badge
// =============================================================================

import { ShoppingCart } from "lucide-react";
import { useSepet } from "../../contexts/SepetContext";

interface SepetButtonProps {
  onClick: () => void;
}

export default function SepetButton({ onClick }: SepetButtonProps) {
  const { toplamAdet } = useSepet();

  if (toplamAdet === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-32 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
    >
      <ShoppingCart size={24} />
      {toplamAdet > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {toplamAdet > 99 ? "99+" : toplamAdet}
        </span>
      )}
    </button>
  );
}
