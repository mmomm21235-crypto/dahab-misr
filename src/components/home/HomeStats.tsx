"use client";

import React, { useMemo } from "react";
import { useGoldContext } from "@/context/GoldContext";
import { formatPrice, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

const COLORS = ["#f59e0b", "#d97706", "#b45309", "#92400e"];

export const HomeStats = React.memo(function HomeStats() {
  const { prices, isLoading } = useGoldContext();

  const pieData = useMemo(() => {
    if (!prices) return [];
    return [
      { name: "عيار 24", value: prices.karat24.buyPrice },
      { name: "عيار 21", value: prices.karat21.buyPrice },
      { name: "عيار 18", value: prices.karat18.buyPrice },
      { name: "الجنيه", value: prices.pound.buyPrice / 8 },
    ];
  }, [prices]);

  const allChanges = useMemo(() => {
    if (!prices) return [];
    return [
      { label: "عيار 24", change: prices.karat24.change },
      { label: "عيار 21", change: prices.karat21.change },
      { label: "عيار 18", change: prices.karat18.change },
      { label: "الجنيه", change: prices.pound.change },
    ];
  }, [prices]);

  const avgChange = useMemo(() => {
    if (allChanges.length === 0) return 0;
    return allChanges.reduce((sum, c) => sum + c.change, 0) / allChanges.length;
  }, [allChanges]);

  if (isLoading || !prices) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {/* Donut Chart */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className="gold-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gold-500" />
          <h3 className="text-xs font-bold text-muted-foreground">
            مقارنة العيارات
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: COLORS[i] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-bold ms-auto">
                  {formatPrice(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Price Stats */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className="gold-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-gold-500" />
          <h3 className="text-xs font-bold text-muted-foreground">
            مؤشرات الأداء
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/50">
            <span className="text-xs text-muted-foreground">
              متوسط التغير
            </span>
            <span
              className={cn(
                "text-xs font-bold flex items-center gap-1",
                avgChange >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {avgChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {avgChange >= 0 ? "+" : ""}
              {formatPrice(Math.round(avgChange))} ج.م
            </span>
          </div>

          {allChanges.map(({ label, change }) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/30"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "text-xs font-bold",
                  change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {change >= 0 ? "+" : ""}
                {change} ج.م
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
});
