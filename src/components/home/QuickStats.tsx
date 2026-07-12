"use client";

import React from "react";
import { DollarSign, TrendingUp, Award } from "lucide-react";
import { useGoldContext } from "@/context/GoldContext";
import { formatPrice, cn } from "@/lib/utils";
import { Skeleton } from "@/components/shared/SkeletonCard";
import { motion } from "framer-motion";

export const QuickStats = React.memo(function QuickStats() {
  const { prices, isLoading } = useGoldContext();

  if (isLoading || !prices) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "الدولار",
      value: `${prices.dollar}`,
      unit: "ج.م",
      Icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "عيار 24",
      value: formatPrice(prices.karat24.buyPrice),
      unit: "ج.م",
      Icon: Award,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "أعلى ارتفاع",
      value:
        prices.karat21.change > 0
          ? `+${formatPrice(prices.karat21.change)}`
          : formatPrice(Math.abs(prices.karat21.change)),
      unit: "ج.م",
      Icon: TrendingUp,
      color:
        prices.karat21.change >= 0 ? "text-green-500" : "text-red-500",
      bg:
        prices.karat21.change >= 0
          ? "bg-green-500/10 border-green-500/20"
          : "bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {stats.map(({ label, value, unit, Icon, color, bg }) => (
        <motion.div
          key={label}
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
          }}
          className={cn("rounded-2xl border p-3 text-center", bg)}
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <Icon className={cn("w-4 h-4 mx-auto mb-1.5", color)} />
          <p className="text-[10px] text-muted-foreground leading-none mb-1">
            {label}
          </p>
          <motion.p
            className="text-sm font-black leading-none"
            key={value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{unit}</p>
        </motion.div>
      ))}
    </motion.div>
  );
});
