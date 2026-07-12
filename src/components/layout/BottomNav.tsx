"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calculator, TrendingUp, Newspaper, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/calculator", label: "الحاسبة", Icon: Calculator },
  { href: "/charts", label: "الرسوم", Icon: TrendingUp },
  { href: "/news", label: "الأخبار", Icon: Newspaper },
  { href: "/alerts", label: "التنبيهات", Icon: Bell },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav lg:hidden" aria-label="التنقل الرئيسي">
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all duration-200",
                "min-w-[56px] min-h-[44px]",
                isActive
                  ? "text-gold-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-10 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                  isActive && "bg-gold-500/10"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "font-bold" : ""
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
