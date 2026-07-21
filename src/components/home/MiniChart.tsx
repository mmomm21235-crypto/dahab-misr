"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { generateHistoricalData } from "@/lib/goldData";
import { formatPrice, formatShortDate } from "@/lib/utils";
import { useGoldContext } from "@/context/GoldContext";
import type { GoldHistoryPoint } from "@/types";
import { Skeleton } from "@/components/shared/SkeletonCard";
import { motion } from "framer-motion";

export function MiniChart() {
  const { prices, isLoading: pricesLoading } = useGoldContext();
  const [data, setData] = useState<GoldHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/gold-prices/history?period=day");
        const json = await res.json();
        if (json.success && json.data.length > 1) {
          setData(json.data);
        } else {
          setData(generateHistoricalData("day", prices ?? undefined));
        }
      } catch {
        setData(generateHistoricalData("day", prices ?? undefined));
      }
      setIsLoading(false);
    };
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || pricesLoading) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  if (data.length === 0) {
    return (
      <div className="gold-card p-4 text-center text-muted-foreground text-sm">
        لا توجد بيانات متاحة حالياً
      </div>
    );
  }

  const firstPrice = data[0]?.price21 ?? 0;
  const lastPrice = data[data.length - 1]?.price21 ?? 0;
  const isUp = lastPrice >= firstPrice;

  return (
    <motion.div
      className="gold-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-muted-foreground">عيار 21</span>
        <span className={`text-xs font-bold ${isUp ? "text-green-500" : "text-red-500"}`}>
          {isUp ? "▲" : "▼"} {formatPrice(Math.abs(lastPrice - firstPrice))} ج.م
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
        >
          <defs>
            <linearGradient id="miniGoldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontFamily: "Cairo, sans-serif",
              fontSize: "12px",
              direction: "rtl",
            }}
            formatter={(value: number) => [
              `${formatPrice(value)} ج.م`,
              "عيار 21",
            ]}
            labelFormatter={formatShortDate}
          />
          <Area
            type="monotone"
            dataKey="price21"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#miniGoldGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#f59e0b" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
