// =============================================================================
// PuppyTimer Web - Admin Paneli
// Yalnızca yönetici UID'si ile erişilebilir
// =============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Map,
  AlertTriangle,
  Ban,
  Bell,
  CreditCard,
  Package,
  Settings,
  Crown,
} from "lucide-react";
import AdminGuard from "../components/admin/AdminGuard";
import DashboardTab from "../components/admin/tabs/DashboardTab";
import KullanicilarTab from "../components/admin/tabs/KullanicilarTab";
import HaritaKayitlariTab from "../components/admin/tabs/HaritaKayitlariTab";
import SikayetlerTab from "../components/admin/tabs/SikayetlerTab";
import CezalarTab from "../components/admin/tabs/CezalarTab";
import PushBildirimTab from "../components/admin/tabs/PushBildirimTab";
import OdemelerTab from "../components/admin/tabs/OdemelerTab";
import UrunlerTab from "../components/admin/tabs/UrunlerTab";
import AyarlarTab from "../components/admin/tabs/AyarlarTab";
import PremiumTab from "../components/admin/tabs/PremiumTab";

type AdminTab =
  | "dashboard"
  | "kullanicilar"
  | "harita"
  | "sikayetler"
  | "cezalar"
  | "push"
  | "urunler"
  | "odemeler"
  | "premium"
  | "ayarlar";

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Genel",
    icon: <LayoutDashboard size={15} />,
  },
  {
    id: "kullanicilar",
    label: "Kullanıcılar",
    icon: <Users size={15} />,
  },
  {
    id: "harita",
    label: "Harita",
    icon: <Map size={15} />,
  },
  {
    id: "sikayetler",
    label: "Şikayetler",
    icon: <AlertTriangle size={15} />,
  },
  {
    id: "cezalar",
    label: "Cezalar",
    icon: <Ban size={15} />,
  },
  {
    id: "push",
    label: "Push",
    icon: <Bell size={15} />,
  },
  {
    id: "urunler",
    label: "Ürünler",
    icon: <Package size={15} />,
  },
  {
    id: "odemeler",
    label: "Ödemeler",
    icon: <CreditCard size={15} />,
  },
  {
    id: "premium",
    label: "Premium",
    icon: <Crown size={15} />,
  },
  {
    id: "ayarlar",
    label: "Ayarlar",
    icon: <Settings size={15} />,
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [aktifTab, setAktifTab] = useState<AdminTab>("dashboard");

  return (
    <AdminGuard>
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Admin Paneli</h1>
            <p className="text-xs text-gray-400 mt-0.5">PuppyTimer Yönetim Merkezi</p>
          </div>
        </div>

        {/* Sticky Tab Bar */}
        <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10">
          <div
            className="flex gap-1.5 px-3 py-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAktifTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                  aktifTab === tab.id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab İçeriği */}
        <div className="flex-1 overflow-y-auto">
          {aktifTab === "dashboard" && <DashboardTab />}
          {aktifTab === "kullanicilar" && <KullanicilarTab />}
          {aktifTab === "harita" && <HaritaKayitlariTab />}
          {aktifTab === "sikayetler" && <SikayetlerTab />}
          {aktifTab === "cezalar" && <CezalarTab />}
          {aktifTab === "push" && <PushBildirimTab />}
          {aktifTab === "urunler" && <UrunlerTab />}
          {aktifTab === "odemeler" && <OdemelerTab />}
          {aktifTab === "premium" && <PremiumTab />}
          {aktifTab === "ayarlar" && <AyarlarTab />}
        </div>
      </div>
    </AdminGuard>
  );
}
