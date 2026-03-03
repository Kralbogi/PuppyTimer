// =============================================================================
// PuppyTimer Web - MenuPage (Ana Menu Sayfasi)
// Tum ozelliklere erismek icin menu sayfasi
// =============================================================================

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Timer, Footprints, Leaf, Heart, Calendar, ShoppingBag, ChevronRight,
  Image, TrendingUp, Scissors, GraduationCap, Trophy, Wallet, Bell,
  CalendarClock,
} from "lucide-react";

interface MenuOption {
  label: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  path: (dogId: string) => string;
  color: string;
  bgColor: string;
}

interface MenuGroup {
  title: string;
  emoji: string;
  items: MenuOption[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Sağlık & Bakım",
    emoji: "❤️",
    items: [
      {
        label: "Sağlık",
        description: "Aşı, ilaç ve sağlık kayıtları",
        icon: Heart,
        path: (id) => `/dog/${id}/health`,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        label: "Bakım Takvimi",
        description: "Banyo, tırnak, traş ve diş bakımı",
        icon: Scissors,
        path: (id) => `/dog/${id}/grooming`,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      },
      {
        label: "Randevu Takvimi",
        description: "Veteriner ve kuaför randevuları",
        icon: CalendarClock,
        path: (id) => `/dog/${id}/appointments`,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
      {
        label: "Hatırlatıcılar",
        description: "Beslenme, ilaç ve bakım hatırlatıcıları",
        icon: Bell,
        path: (id) => `/dog/${id}/reminders`,
        color: "text-sky-600",
        bgColor: "bg-sky-50",
      },
    ],
  },
  {
    title: "Aktivite & Takip",
    emoji: "🐾",
    items: [
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
        label: "Eğitim Tracker",
        description: "Komut öğrenme ve eğitim takibi",
        icon: GraduationCap,
        path: (id) => `/dog/${id}/training`,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
    ],
  },
  {
    title: "Galeri & İstatistik",
    emoji: "📊",
    items: [
      {
        label: "Foto Galeri",
        description: "Tüm fotoğrafları görüntüleyin",
        icon: Image,
        path: (id) => `/dog/${id}/gallery`,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        label: "Takvim",
        description: "Aylık fotoğraf takvimi oluşturun",
        icon: Calendar,
        path: (id) => `/dog/${id}/calendar`,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        label: "İstatistikler",
        description: "Sağlık ve aktivite istatistikleri",
        icon: TrendingUp,
        path: (id) => `/dog/${id}/stats`,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        label: "Başarılar",
        description: "Kazanılan rozetler ve başarılar",
        icon: Trophy,
        path: (id) => `/dog/${id}/achievements`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
    ],
  },
  {
    title: "Alışveriş & Finans",
    emoji: "🛒",
    items: [
      {
        label: "Shop",
        description: "Köpek ürünleri alışverişi",
        icon: ShoppingBag,
        path: (id) => `/dog/${id}/shop`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        label: "Gider Takibi",
        description: "Köpek harcamalarını kaydedin",
        icon: Wallet,
        path: (id) => `/dog/${id}/expenses`,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
    ],
  },
];

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dogId = id || "";

  return (
    <div className="px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Menü</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Köpeğiniz için tüm özellikler
      </p>

      <div className="space-y-6">
        {menuGroups.map((group) => (
          <section key={group.title}>
            {/* Group Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{group.emoji}</span>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {group.title}
              </h2>
            </div>

            {/* Group Items */}
            <div className="space-y-2">
              {group.items.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => navigate(option.path(dogId))}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <div className={`${option.bgColor} dark:bg-opacity-20 p-3 rounded-xl`}>
                      <IconComponent size={22} className={option.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                        {option.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 transition-colors"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
