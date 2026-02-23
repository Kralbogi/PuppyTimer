// =============================================================================
// PuppyTimer Web - MenuPage (Ana Menu Sayfasi)
// Tum ozelliklere erismek icin menu sayfasi
// =============================================================================

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Timer, Footprints, Leaf, Heart, Calendar, ShoppingBag, ChevronRight } from "lucide-react";

interface MenuOption {
  label: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  path: (dogId: string) => string;
  color: string;
  bgColor: string;
}

const menuOptions: MenuOption[] = [
  {
    label: "Shop",
    description: "Köpek ürünleri alışverişi",
    icon: ShoppingBag,
    path: (id) => `/dog/${id}/shop`,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    label: "Zamanlayıcı",
    description: "Yemek, su ve ilaç zamanlarını takip edin",
    icon: Timer,
    path: (id) => `/dog/${id}/timers`,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "Yürüyüş",
    description: "Günlük yürüyüşleri kaydedin",
    icon: Footprints,
    path: (id) => `/dog/${id}/walks`,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    label: "Tuvalet",
    description: "Tuvalet alışkanlıklarını izleyin",
    icon: Leaf,
    path: (id) => `/dog/${id}/toilet`,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    label: "Sağlık",
    description: "Aşı, ilaç ve sağlık kayıtları",
    icon: Heart,
    path: (id) => `/dog/${id}/health`,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    label: "Takvim",
    description: "Aylık fotoğraf takvimi oluşturun",
    icon: Calendar,
    path: (id) => `/dog/${id}/calendar`,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dogId = id || "";

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Menü</h1>
      <p className="text-sm text-gray-500 mb-6">
        Köpeğiniz için tüm özellikler
      </p>

      <div className="space-y-3">
        {menuOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => navigate(option.path(dogId))}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className={`${option.bgColor} p-3 rounded-xl`}>
                <IconComponent size={24} className={option.color} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-0.5">
                  {option.label}
                </h3>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-300 group-hover:text-orange-500 transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MenuPage;
