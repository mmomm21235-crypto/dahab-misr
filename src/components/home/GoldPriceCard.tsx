"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { GoldPrice } from "@/types";
import {
  formatPrice,
  formatPercent,
  getKaratLabel,
  getPriceChangeBg,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GoldPriceCardProps {
  price: GoldPrice;
  isHighlighted?: boolean;
  animationDelay?: number;
}

const KARAT_COLORS: Record<string, string> = {
  "24": "from-yellow-400/20 to-amber-500/10 border-yellow-400/30",
  "21": "from-gold-400/20 to-gold-500/10 border-gold-400/30",
  "18": "from-amber-600/20 to-amber-700/10 border-amber-600/30",
  pound: "from-orange-400/20 to-orange-500/10 border-orange-400/30",
};

const KARAT_ICONS: Record<string, string> = {
  "24": "٢٤",
  "21": "٢١",
  "18": "١٨",
  pound: "ج",
};

export function GoldPriceCard({
  price,
  isHighlighted = false,
  animationDelay = 0,
}: GoldPriceCardProps) {
  const karatKey = String(price.karat);
  const colorClass = KARAT_COLORS[karatKey] ?? KARAT_COLORS["21"];
  const karatIcon = KARAT_ICONS[karatKey] ?? karatKey;
  const isUp = price.change > 0;
  const isDown = price.change < 0;

  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: animationDelay / 1000,
        ease: "easeOut",
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className={cn(
        "gold-card p-5 cursor-pointer",
        `bg-gradient-to-br ${colorClass}`,
        isHighlighted &&
          "ring-2 ring-gold-500/40 shadow-lg shadow-gold-500/10 animate-pulse-glow"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <motion.div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-gold-gradient shadow-md shadow-gold-500/30",
              "text-white font-black text-sm"
            )}
            whileHover={{ rotate: 10 }}
          >
            {karatIcon}
          </motion.div>
          <div>
            <p className="font-bold text-sm leading-none">
              {getKaratLabel(price.karat)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {price.karat === "pound" ? "٨ جرام عيار ٢١" : "للجرام الواحد"}
            </p>
          </div>
        </div>

        <motion.div
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            getPriceChangeBg(price.change)
          )}
          animate={
            price.change !== 0
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={{ duration: 0.3 }}
        >
          <TrendIcon className="w-3 h-3" />
          <span>{formatPercent(price.changePercent)}</span>
        </motion.div>
      </div>

      <div className="space-y-1">
        <motion.div
          className="flex items-baseline gap-1.5"
          key={price.buyPrice}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-2xl font-black tracking-tight">
            {formatPrice(price.buyPrice)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            ج.م
          </span>
        </motion.div>
        {price.change !== 0 && (
          <motion.p
            className={cn(
              "text-xs font-semibold",
              isUp ? "text-green-500" : "text-red-500"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {isUp ? "▲" : "▼"} {Math.abs(price.change)} ج.م
          </motion.p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">شراء</p>
          <motion.p
            className="text-sm font-bold text-green-600 dark:text-green-400"
            key={`buy-${price.buyPrice}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {formatPrice(price.buyPrice)}
          </motion.p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">بيع</p>
          <motion.p
            className="text-sm font-bold text-red-500 dark:text-red-400"
            key={`sell-${price.sellPrice}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {formatPrice(price.sellPrice)}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
