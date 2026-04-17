// =============================================================================
// PawLand - BottomTabBar (Pati Menü)
// Pokemon GO tarzı açılır pati menü navigasyonu
// Ana pati butonuna basılınca 4 parmak animasyonla açılır
// Parmağa basılınca o grubun alt menü öğeleri kart olarak görünür
// =============================================================================

import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Heart, CalendarClock, Bell,
  Timer, Leaf, GraduationCap,
  Calendar, TrendingUp, Trophy,
  ShoppingBag, Wallet,
  ChevronLeft, Users, Settings,
} from "lucide-react";

interface SubItem {
  label: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  path: (dogId: string) => string;
  color: string;
  bgColor: string;
}

interface MenuGroup {
  title: string;
  shortLabel: string;
  toeImage: string;
  /** Yatay offset (px) — pozitif = sağ, negatif = sol */
  offsetX: number;
  /** Dikey offset (px) — pati butonundan yukarı mesafe */
  offsetY: number;
  /** Animasyon gecikmesi (ms) */
  delay: number;
  items: SubItem[];
}

// Patinin 4 parmağı — gerçek pati şeklinde dizilir:
//       2     3        (iç parmaklar — yukarıda, yakın)
//    1           4     (dış parmaklar — aşağıda, açık)
//       [MENÜ]         (ana pati butonu)
const menuGroups: MenuGroup[] = [
  {
    title: "Sağlık & Bakım",
    shortLabel: "Sağlık",
    toeImage: "/icons/menu/SaglikBakimMenu1.png",
    offsetX: -95,
    offsetY: 52,
    delay: 80,
    items: [
      { label: "Sağlık", description: "Aşı, ilaç ve sağlık kayıtları", icon: Heart, path: (id) => `/dog/${id}/health`, color: "text-red-600", bgColor: "bg-red-50" },
      { label: "Randevu Takvimi", description: "Bakım, veteriner ve kuaför randevuları", icon: CalendarClock, path: (id) => `/dog/${id}/appointments`, color: "text-rose-600", bgColor: "bg-rose-50" },
      { label: "Hatırlatıcılar", description: "Beslenme, ilaç ve bakım hatırlatıcıları", icon: Bell, path: (id) => `/dog/${id}/reminders`, color: "text-sky-600", bgColor: "bg-sky-50" },
    ],
  },
  {
    title: "Aktivite & Takip",
    shortLabel: "Aktivite",
    toeImage: "/icons/menu/AktiviteTakipMenu2.png",
    offsetX: -45,
    offsetY: 110,
    delay: 0,
    items: [
      { label: "Zamanlayıcı", description: "Yemek, su ve ilaç zamanlarını takip edin", icon: Timer, path: (id) => `/dog/${id}/timers`, color: "text-blue-600", bgColor: "bg-blue-50" },
      { label: "Tuvalet", description: "Tuvalet alışkanlıklarını izleyin", icon: Leaf, path: (id) => `/dog/${id}/toilet`, color: "text-amber-600", bgColor: "bg-amber-50" },
      { label: "Eğitim Takibi", description: "Komut öğrenme ve eğitim takibi", icon: GraduationCap, path: (id) => `/dog/${id}/training`, color: "text-violet-600", bgColor: "bg-violet-50" },
    ],
  },
  {
    title: "Takvim & İstatistik",
    shortLabel: "Takvim",
    toeImage: "/icons/menu/TakvimIstatistikMenu3.png",
    offsetX: 45,
    offsetY: 110,
    delay: 0,
    items: [
      { label: "Takvim", description: "Aylık fotoğraf takvimi oluşturun", icon: Calendar, path: (id) => `/dog/${id}/calendar`, color: "text-purple-600", bgColor: "bg-purple-50" },
      { label: "İstatistikler", description: "Sağlık ve aktivite istatistikleri", icon: TrendingUp, path: (id) => `/dog/${id}/stats`, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      { label: "Başarılar", description: "Kazanılan rozetler ve başarılar", icon: Trophy, path: (id) => `/dog/${id}/achievements`, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    ],
  },
  {
    title: "Alışveriş & Finans",
    shortLabel: "Alışveriş",
    toeImage: "/icons/menu/AlisverisFinansMenu4.png",
    offsetX: 95,
    offsetY: 52,
    delay: 80,
    items: [
      { label: "Mağaza", description: "Köpek ürünleri alışverişi", icon: ShoppingBag, path: (id) => `/dog/${id}/shop`, color: "text-orange-600", bgColor: "bg-orange-50" },
      { label: "Gider Takibi", description: "Köpek harcamalarını kaydedin", icon: Wallet, path: (id) => `/dog/${id}/expenses`, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    ],
  },
];

const BottomTabBar: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dogId = id || "";

  const toggle = useCallback(() => {
    setIsOpen((p) => {
      if (p) setActiveGroup(null);
      return !p;
    });
  }, []);

  const closeAll = useCallback(() => {
    setIsOpen(false);
    setActiveGroup(null);
  }, []);

  const handleToe = useCallback((groupIndex: number) => {
    setActiveGroup(groupIndex);
  }, []);

  const handleSubItem = useCallback(
    (path: string) => {
      navigate(path);
      closeAll();
    },
    [navigate, closeAll],
  );

  const handleBack = useCallback(() => {
    setActiveGroup(null);
  }, []);

  const showToes = isOpen && activeGroup === null;

  return (
    <>
      {/* Arkaplan overlay — menü açıkken sıcak karartma */}
      <div
        className={`fixed inset-0 z-[3000] transition-all duration-300 ${
          isOpen ? "backdrop-blur-sm" : "pointer-events-none"
        }`}
        style={{ backgroundColor: isOpen ? 'rgba(61, 46, 31, 0.40)' : 'transparent' }}
        onClick={closeAll}
      />

      {/* Üst butonlar — menü açıkken Arkadaşlarım + Ayarlar */}
      <div
        className="fixed z-[3002] top-[env(safe-area-inset-top)] left-0 right-0 flex justify-center gap-4 pt-24"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(-20px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          onClick={() => { navigate("/arkadaslarim"); closeAll(); }}
          className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full active:scale-95 transition-transform"
          style={{
            background: 'rgba(90, 52, 18, 0.88)',
            border: '1px solid rgba(160, 100, 45, 0.65)',
            boxShadow: '0 4px 20px rgba(40, 20, 5, 0.55)',
          }}
        >
          <Users size={18} style={{ color: '#f5deb3' }} />
          <span className="text-sm font-semibold" style={{ color: '#fff8f0' }}>Arkadaşlarım</span>
        </button>
        <button
          type="button"
          onClick={() => { navigate("/settings"); closeAll(); }}
          className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full active:scale-95 transition-transform"
          style={{
            background: 'rgba(90, 52, 18, 0.88)',
            border: '1px solid rgba(160, 100, 45, 0.65)',
            boxShadow: '0 4px 20px rgba(40, 20, 5, 0.55)',
          }}
        >
          <Settings size={18} style={{ color: '#f5deb3' }} />
          <span className="text-sm font-semibold" style={{ color: '#fff8f0' }}>Ayarlar</span>
        </button>
      </div>

      {/* Seviye 1: Parmak butonları */}
      {menuGroups.map((group, i) => (
        <button
          key={group.title}
          type="button"
          onClick={() => handleToe(i)}
          className="fixed z-[3002] flex flex-col items-center gap-1"
          style={{
            left: "50%",
            bottom: `calc(20px + env(safe-area-inset-bottom))`,
            transform: showToes
              ? `translate(calc(-50% + ${group.offsetX}px), -${group.offsetY}px) scale(1)`
              : "translate(-50%, 0) scale(0)",
            opacity: showToes ? 1 : 0,
            transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${
              showToes ? group.delay : 0
            }ms, opacity 0.25s ease ${showToes ? group.delay : 0}ms`,
            pointerEvents: showToes ? "auto" : "none",
          }}
        >
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={group.toeImage}
              alt={group.title}
              className="w-full h-full object-fill active:scale-90 transition-transform drop-shadow-xl"
              draggable={false}
            />
          </div>
          <span
            className="text-[10px] font-bold text-white whitespace-nowrap"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {group.shortLabel}
          </span>
        </button>
      ))}

      {/* Seviye 2: Alt menü kartı */}
      {isOpen && activeGroup !== null && (
        <div
          className="fixed z-[3004] left-4 right-4 rounded-2xl shadow-2xl overflow-hidden soft-shadow-lg"
          style={{
            bottom: `calc(100px + env(safe-area-inset-bottom))`,
            animation: "pawMenuSlideUp 0.3s ease-out",
            background: 'rgba(255, 252, 247, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(224, 122, 47, 0.15)',
            boxShadow: '0 20px 40px rgba(61, 46, 31, 0.15)',
          }}
        >
          {/* Kart başlığı + geri butonu */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b smooth-divider" style={{ borderColor: 'rgba(210, 180, 140, 0.35)' }}>
            <button
              type="button"
              onClick={handleBack}
              className="p-1 -ml-1 active:scale-90 transition-all rounded-lg hover:bg-white/50"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-bold text-sm text-gradient" style={{ color: 'var(--color-text)' }}>
              {menuGroups[activeGroup].title}
            </h3>
          </div>

          {/* Alt menü öğeleri */}
          <div className="p-2">
            {menuGroups[activeGroup].items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSubItem(item.path(dogId))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors card-hover-lift"
                  style={{ }}
                >
                  <div className={`${item.bgColor} p-2.5 rounded-xl soft-shadow`}>
                    <Icon size={20} className={item.color} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ana pati butonu — her zaman ekranın altında görünür */}
      <button
        type="button"
        onClick={toggle}
        className="fixed z-[3003] left-1/2 active:scale-90"
        style={{
          bottom: `calc(12px + env(safe-area-inset-bottom))`,
          transform: `translateX(-50%) ${isOpen ? "scale(1.1) rotate(-8deg)" : "scale(1) rotate(0deg)"}`,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <img
          src="/icons/menu/menuLogo.png"
          alt="Menü"
          className="w-20 h-16 object-contain drop-shadow-xl"
          draggable={false}
        />
      </button>
    </>
  );
});

BottomTabBar.displayName = "BottomTabBar";

export default BottomTabBar;
