// =============================================================================
// PawLand - Statistics Dashboard
// Health and activity statistics with visualizations
// =============================================================================

import React, { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  TrendingUp,
  Footprints,
  Droplets,
  UtensilsCrossed,
  Activity,
  Calendar,
  Award,
} from "lucide-react";
import { db } from "../db/database";

interface StatsPageProps {
  kopekId: number;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  trend?: string;
}

export const StatsPage: React.FC<StatsPageProps> = ({ kopekId }) => {
  // Fetch all data
  const yuruyusler = useLiveQuery(
    () => db.yuruyusKayitlari.where("kopekId").equals(kopekId).toArray(),
    [kopekId]
  );

  const beslenme = useLiveQuery(
    () => db.beslenmeKayitlari.where("kopekId").equals(kopekId).toArray(),
    [kopekId]
  );

  const su = useLiveQuery(
    () => db.suKayitlari.where("kopekId").equals(kopekId).toArray(),
    [kopekId]
  );

  const tuvalet = useLiveQuery(
    () => db.tuvaletKayitlari.where("kopekId").equals(kopekId).toArray(),
    [kopekId]
  );

  const kopek = useLiveQuery(() => db.kopekler.get(kopekId), [kopekId]);

  // Calculate statistics
  const stats = useMemo<StatCard[]>(() => {
    const bugun = new Date();
    const buAy = new Date(bugun.getFullYear(), bugun.getMonth(), 1).getTime();
    const buHafta = new Date(
      bugun.getTime() - 7 * 24 * 60 * 60 * 1000
    ).getTime();

    // Walk stats
    const toplamYuruyus = yuruyusler?.length || 0;
    const buHaftaYuruyus =
      yuruyusler?.filter((y) => y.baslamaTarihi >= buHafta).length || 0;

    // Feeding stats
    const toplamBeslenme = beslenme?.length || 0;
    const buAyBeslenme =
      beslenme?.filter((b) => b.tarih >= buAy).length || 0;

    // Water stats
    const toplamSu = su?.length || 0;
    const buAySu = su?.filter((s) => s.tarih >= buAy).length || 0;

    // Toilet stats
    const toplamTuvalet = tuvalet?.length || 0;
    const buAyTuvalet = tuvalet?.filter((t) => t.tarih >= buAy).length || 0;

    return [
      {
        label: "Toplam Yürüyüş",
        value: toplamYuruyus,
        icon: Footprints,
        color: "text-green-600",
        bgColor: "bg-green-50",
        trend: `${buHaftaYuruyus} bu hafta`,
      },
      {
        label: "Beslenme (Ay)",
        value: buAyBeslenme,
        icon: UtensilsCrossed,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        trend: `${toplamBeslenme} toplam`,
      },
      {
        label: "Su (Ay)",
        value: buAySu,
        icon: Droplets,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        trend: `${toplamSu} toplam`,
      },
      {
        label: "Tuvalet (Ay)",
        value: buAyTuvalet,
        icon: Activity,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        trend: `${toplamTuvalet} toplam`,
      },
      {
        label: "Topluluk Puanı",
        value: kopek?.puan || 0,
        icon: Award,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        trend: kopek?.toplamBegeniler
          ? `${kopek.toplamBegeniler} beğeni`
          : undefined,
      },
      {
        label: "Kayıt Sayısı",
        value: toplamYuruyus + toplamBeslenme + toplamSu + toplamTuvalet,
        icon: Calendar,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        trend: "Tüm zamanlar",
      },
    ];
  }, [yuruyusler, beslenme, su, tuvalet, kopek]);

  // Recent activity timeline (last 7 days)
  const recentActivity = useMemo(() => {
    const bugun = new Date().getTime();
    const son7Gun = bugun - 7 * 24 * 60 * 60 * 1000;

    const activities: Array<{
      tarih: number;
      tip: string;
      ikon: string;
      renk: string;
    }> = [];

    yuruyusler
      ?.filter((y) => y.baslamaTarihi >= son7Gun)
      .forEach((y) => {
        activities.push({
          tarih: y.baslamaTarihi,
          tip: "Yürüyüş",
          ikon: "",
          renk: "text-green-600",
        });
      });

    beslenme
      ?.filter((b) => b.tarih >= son7Gun)
      .forEach((b) => {
        activities.push({
          tarih: b.tarih,
          tip: "Beslenme",
          ikon: "",
          renk: "text-orange-600",
        });
      });

    su?.filter((s) => s.tarih >= son7Gun).forEach((s) => {
      activities.push({
        tarih: s.tarih,
        tip: "Su",
        ikon: "",
        renk: "text-blue-600",
      });
    });

    return activities.sort((a, b) => b.tarih - a.tarih).slice(0, 10);
  }, [yuruyusler, beslenme, su]);

  return (
    <div className="px-4 py-4 pb-20" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(224, 122, 47, 0.03) 100%)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gradient" style={{ color: 'var(--color-text)' }}>
          <TrendingUp size={28} style={{ color: 'var(--color-primary)' }} />
          İstatistikler
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sağlık ve aktivite özeti
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-4 soft-shadow border smooth-transition card-hover-lift"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
            >
              <div className={`${stat.bgColor} w-10 h-10 rounded-xl flex items-center justify-center mb-3 soft-shadow`}>
                <Icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-bold mb-0.5 text-gradient">
                {stat.value}
              </p>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {stat.label}
              </p>
              {stat.trend && (
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{stat.trend}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-2xl p-4 soft-shadow border"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Son Aktiviteler</h2>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Henüz aktivite yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 pb-3 last:pb-0"
                style={{ borderBottom: index < recentActivity.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}
              >
                <div className="text-2xl">{activity.ikon}</div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${activity.renk}`}>
                    {activity.tip}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Intl.DateTimeFormat("tr-TR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(activity.tarih)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
