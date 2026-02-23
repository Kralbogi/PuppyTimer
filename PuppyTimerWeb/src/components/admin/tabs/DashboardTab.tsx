import React, { useEffect, useState } from "react";
import {
  Users,
  Map,
  AlertTriangle,
  MessageCircle,
  Activity,
  PawPrint,
  Loader2,
} from "lucide-react";
import {
  dashboardIstatistikleriGetir,
  type AdminDashboardStats,
} from "../../../services/adminService";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgColor }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString("tr-TR")}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

export default function DashboardTab() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    dashboardIstatistikleriGetir()
      .then(setStats)
      .catch((err) => setHata(err.message))
      .finally(() => setYukleniyor(false));
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (hata || !stats) {
    return (
      <div className="px-4 py-8 text-center text-red-500 text-sm">
        İstatistikler yüklenemedi: {hata}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
      <h2 className="text-base font-bold text-gray-600 mb-1">Genel Bakış</h2>
      <StatCard
        label="Toplam Kullanıcı"
        value={stats.toplamKullanici}
        icon={<Users size={20} className="text-blue-600" />}
        bgColor="bg-blue-100"
      />
      <StatCard
        label="Aktif Harita Köpeği"
        value={stats.aktifKopekler}
        icon={<PawPrint size={20} className="text-orange-600" />}
        bgColor="bg-orange-100"
      />
      <StatCard
        label="Aktif Bölge"
        value={stats.aktifBolgeler}
        icon={<Map size={20} className="text-green-600" />}
        bgColor="bg-green-100"
      />
      <StatCard
        label="Toplam Şikayet"
        value={stats.toplamSikayet}
        icon={<AlertTriangle size={20} className="text-red-600" />}
        bgColor="bg-red-100"
      />
      <StatCard
        label="Şu An Çevrimiçi"
        value={stats.onlineKullanici}
        icon={<Activity size={20} className="text-purple-600" />}
        bgColor="bg-purple-100"
      />
      <StatCard
        label="Mesaj Konuşması"
        value={stats.toplamMesajKonusma}
        icon={<MessageCircle size={20} className="text-teal-600" />}
        bgColor="bg-teal-100"
      />
    </div>
  );
}
