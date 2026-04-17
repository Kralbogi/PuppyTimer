// =============================================================================
// PawLand - MenuPage (Ana Menu Sayfasi)
// Tum ozelliklere erismek icin menu sayfasi
// =============================================================================

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Timer, Leaf, Heart, Calendar, ShoppingBag, ChevronRight,
  TrendingUp, GraduationCap, Trophy, Wallet, Bell,
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
  items: MenuOption[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Sağlık & Bakım",

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
        label: "Randevu Takvimi",
        description: "Bakım, veteriner ve kuaför randevuları",
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
        label: "Tuvalet",
        description: "Tuvalet alışkanlıklarını izleyin",
        icon: Leaf,
        path: (id) => `/dog/${id}/toilet`,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        label: "Eğitim Takibi",
        description: "Komut öğrenme ve eğitim takibi",
        icon: GraduationCap,
        path: (id) => `/dog/${id}/training`,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
    ],
  },
  {
    title: "Takvim & İstatistik",

    items: [
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

    items: [
      {
        label: "Mağaza",
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
    <div className="px-4 py-6 pb-24" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(224, 122, 47, 0.03) 100%)' }}>
      <div className="space-y-6">
        {menuGroups.map((group) => (
          <section key={group.title}>
            {/* Group Header */}
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {group.title}
            </h2>

            {/* Group Items */}
            <div className="space-y-2">
              {group.items.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => navigate(option.path(dogId))}
                    className="w-full bg-white/75 rounded-2xl p-4 border smooth-transition card-hover-lift flex items-center gap-4 group soft-shadow"
                    style={{ borderColor: 'var(--color-border-light)' }}
                  >
                    <div className={`${option.bgColor} p-3 rounded-xl soft-shadow smooth-transition`}>
                      <IconComponent size={22} className={option.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text)' }}>
                        {option.label}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{option.description}</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="smooth-transition"
                      style={{ color: 'var(--color-text-muted)' }}
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
