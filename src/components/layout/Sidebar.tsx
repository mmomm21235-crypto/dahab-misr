"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calculator,
  TrendingUp,
  Newspaper,
  Bell,
  Settings,
  Store,
  Megaphone,
  Wallet,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useGoldContext } from "@/context/GoldContext";
import { formatPrice } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/calculator", label: "حاسبة الذهب", Icon: Calculator },
  { href: "/charts", label: "الرسوم البيانية", Icon: TrendingUp },
  { href: "/news", label: "الأخبار", Icon: Newspaper },
  { href: "/alerts", label: "التنبيهات", Icon: Bell },
  { href: "/portfolio", label: "محفظتي", Icon: Wallet },
  { href: "/shops", label: "دليل المحلات", Icon: Store },
  { href: "/download", label: "تحميل التطبيق", Icon: Download },
  { href: "/settings", label: "الإعدادات", Icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { prices } = useGoldContext();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="block p-6 border-b border-border/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
            <span className="text-white font-black text-lg">ذ</span>
          </div>
          <div>
            <h1 className="font-black text-lg leading-none gold-text">
              ذهب مصر
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              أسعار الذهب لحظياً
            </p>
          </div>
        </div>
      </Link>

      {/* Quick Price Widget */}
      {prices && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
          <p className="text-xs text-muted-foreground mb-1">عيار 21 الآن</p>
          <p className="text-lg font-black gold-text">
            {formatPrice(prices.karat21.buyPrice)} ج.م
          </p>
          <p className="text-xs text-muted-foreground">للجرام الواحد</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-gold-500/10 text-gold-600 dark:text-gold-400 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  isActive && "text-gold-500"
                )}
              />
              <span className="text-sm">{label}</span>
              {isActive && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-gold-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <Link
          href="/advertise"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Megaphone className="w-4 h-4" />
          إعلن هنا
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">الإصدار 2.0.0</p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
