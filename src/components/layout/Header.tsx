"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Bell, User } from "lucide-react";
import { useGoldContext } from "@/context/GoldContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PriceTicker } from "./PriceTicker";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "أسعار الذهب",
  "/calculator": "حاسبة الذهب",
  "/charts": "الرسوم البيانية",
  "/news": "الأخبار",
  "/alerts": "التنبيهات",
  "/alerts/history": "سجل التنبيهات",
  "/portfolio": "محفظتي",
  "/shops": "دليل المحلات",
  "/advertise": "إعلن هنا",
  "/settings": "الإعدادات",
  "/about": "عن التطبيق",
  "/terms": "الشروط والأحكام",
  "/privacy": "سياسة الخصوصية",
  "/auth/signin": "الحساب",
};

export function Header() {
  const pathname = usePathname();
  const { isRefreshing, refresh } = useGoldContext();
  const title = PAGE_TITLES[pathname] ?? "ذهب مصر";

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <PriceTicker />
      <div className="flex items-center justify-between px-4 lg:px-8 h-16 max-w-4xl mx-auto">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/20">
            <span className="text-white font-bold text-sm">ذ</span>
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">{title}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
              ذهب مصر
            </p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {pathname === "/" && (
            <button
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="تحديث الأسعار"
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                "bg-muted hover:bg-accent transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <RefreshCw
                className={cn("w-4 h-4", isRefreshing && "animate-spin")}
              />
            </button>
          )}
          <Link
            href="/alerts"
            aria-label="التنبيهات"
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              "bg-muted hover:bg-accent transition-colors",
              "text-muted-foreground hover:text-foreground relative"
            )}
          >
            <Bell className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/signin"
            aria-label="الحساب"
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <User className="w-4 h-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
