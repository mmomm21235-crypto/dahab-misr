"use client";

import { useGoldContext } from "@/context/GoldContext";
import { formatPrice, cn, getPriceChangeColor } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const ITEMS = [
  { key: "24", label: "عيار 24", karatKey: "karat24" as const },
  { key: "21", label: "عيار 21", karatKey: "karat21" as const },
  { key: "18", label: "عيار 18", karatKey: "karat18" as const },
];

export function PriceTicker() {
  const { prices, isLoading } = useGoldContext();

  if (isLoading || !prices) return null;

  const allItems = [
    ...ITEMS.map(({ key, label, karatKey }) => ({
      id: key, label,
      price: prices[karatKey].buyPrice,
      change: prices[karatKey].change,
    })),
    { id: "pound", label: "الجنيه", price: prices.pound.buyPrice, change: prices.pound.change },
    { id: "usd", label: "USD", price: prices.dollar, change: 0 },
  ];

  const Row = ({ items }: { items: typeof allItems }) => (
    <div className="flex gap-8 items-center ml-8" dir="ltr">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="text-xs font-bold tabular-nums">{formatPrice(item.price)}</span>
          {item.change !== 0 && (
            <span className={cn("text-[10px] font-semibold flex items-center", getPriceChangeColor(item.change))}>
              {item.change > 0 ? <TrendingUp className="w-2.5 h-2.5 ml-0.5" /> : <TrendingDown className="w-2.5 h-2.5 ml-0.5" />}
              {Math.abs(item.change)}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden h-8 border-b border-border/30 bg-muted/30">
      <div className="flex items-center h-full">
        <div className="ticker-track flex whitespace-nowrap px-4">
          <Row items={allItems} />
          <Row items={allItems} />
        </div>
      </div>
    </div>
  );
}
