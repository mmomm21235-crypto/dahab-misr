"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Bell,
  Store,
  Wallet,
  Newspaper,
  TrendingUp,
  Plus,
  Send,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalAlerts: number;
  totalShops: number;
  totalPortfolio: number;
  totalNews: number;
  latestPrice: {
    karat21Buy: number;
    karat24Buy: number;
    karat18Buy: number;
    createdAt: string;
  } | null;
  recentAlerts: {
    id: string;
    karat: string;
    targetPrice: number;
    condition: string;
    triggeredAt: string;
    user: { name: string | null; email: string | null };
  }[];
}

const STAT_CARDS = [
  { key: "totalUsers" as const, label: "المستخدمين", Icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "totalAlerts" as const, label: "التنبيهات", Icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "totalShops" as const, label: "المحلات", Icon: Store, color: "text-gold-600", bg: "bg-gold-500/10" },
  { key: "totalPortfolio" as const, label: "المحافظ", Icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "totalNews" as const, label: "الأخبار", Icon: Newspaper, color: "text-purple-500", bg: "bg-purple-500/10" },
] as const;

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة عامة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(({ key, label, Icon, color, bg }) => (
          <div
            key={key}
            className="p-4 rounded-2xl bg-card border border-border/50 space-y-3"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-2xl font-black">{stats?.[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Gold Prices */}
      {stats?.latestPrice && (
        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            <h2 className="font-bold">آخر أسعار الذهب</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/10">
              <p className="text-xs text-muted-foreground">عيار 24</p>
              <p className="text-lg font-black gold-text">
                {formatPrice(stats.latestPrice.karat24Buy)} ج.م
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/10">
              <p className="text-xs text-muted-foreground">عيار 21</p>
              <p className="text-lg font-black gold-text">
                {formatPrice(stats.latestPrice.karat21Buy)} ج.م
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/10">
              <p className="text-xs text-muted-foreground">عيار 18</p>
              <p className="text-lg font-black gold-text">
                {formatPrice(stats.latestPrice.karat18Buy)} ج.م
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold-500" />
          <h2 className="font-bold">آخر النشاطات</h2>
        </div>
        {stats?.recentAlerts && stats.recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {stats.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      تنبيه {alert.karat} —{" "}
                      {alert.condition === "above" ? "فوق" : "تحت"}{" "}
                      {formatPrice(alert.targetPrice)} ج.م
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.user.name || alert.user.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.triggeredAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            لا توجد تنبيهات مُغلقة بعد
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
        <h2 className="font-bold">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/shops"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            إضافة محل
          </Link>
          <Link
            href="/admin/shops"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <Send className="w-4 h-4" />
            إدارة المحلات
          </Link>
        </div>
      </div>
    </div>
  );
}
