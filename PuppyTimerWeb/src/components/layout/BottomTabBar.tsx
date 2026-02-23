import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Dog, Map, Menu } from "lucide-react";

interface Tab {
  label: string;
  icon: React.FC<{ size?: number; color?: string }>;
  path: (dogId: string) => string;
}

const tabs: Tab[] = [
  {
    label: "Harita",
    icon: Map,
    path: (id) => `/dog/${id}/map`,
  },
  {
    label: "Menü",
    icon: Menu,
    path: (id) => `/dog/${id}/menu`,
  },
  {
    label: "Profil",
    icon: Dog,
    path: (id) => `/dog/${id}`,
  },
];

const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const dogId = id || "";

  const isActive = (tab: Tab): boolean => {
    const tabPath = tab.path(dogId);
    // Exact match for profile, startsWith for others
    if (tabPath === `/dog/${dogId}`) {
      return location.pathname === tabPath;
    }
    return location.pathname.startsWith(tabPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const IconComponent = tab.icon;
          const color = active ? "#f97316" : "#9ca3af";

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => navigate(tab.path(dogId))}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
            >
              <IconComponent size={22} color={color} />
              <span
                className="text-[10px] font-medium"
                style={{ color }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
