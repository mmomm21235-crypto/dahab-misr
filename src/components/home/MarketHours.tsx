"use client";

import { Clock, Circle } from "lucide-react";

function getMarketStatus(): { isOpen: boolean; label: string; nextOpen: string } {
  const now = new Date();
  const cairoHour = (now.getUTCHours() + 2) % 24;
  const day = now.getUTCDay();

  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = cairoHour >= 9 && cairoHour < 17;
  const isOpen = isWeekday && isMarketHours;

  if (isOpen) {
    return { isOpen: true, label: "السوق مفتوح", nextOpen: "" };
  }

  let nextOpenDay = "";
  if (day === 5) nextOpenDay = "الأحد";
  else if (day === 6) nextOpenDay = "الأحد";
  else if (cairoHour >= 17) nextOpenDay = "غداً";
  else nextOpenDay = "اليوم";

  return {
    isOpen: false,
    label: "السوق مغلق",
    nextOpen: `يفتح ${nextOpenDay} الساعة ٩ صباحاً`,
  };
}

export function MarketHours() {
  const status = getMarketStatus();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs" aria-live="polite">
      <Circle
        className={`w-2 h-2 ${status.isOpen ? "fill-green-500 text-green-500 animate-pulse" : "fill-red-400 text-red-400"}`}
      />
      <span className="font-bold">{status.label}</span>
      {!status.isOpen && status.nextOpen && (
        <span className="text-muted-foreground">— {status.nextOpen}</span>
      )}
    </div>
  );
}
