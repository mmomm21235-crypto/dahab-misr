"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { generateHistoricalData } from "@/lib/goldData";
import { formatPrice, formatShortDate, cn } from "@/lib/utils";
import type { GoldHistoryPoint, ChartPeriod } from "@/types";
import { ChartSkeleton } from "@/components/shared/SkeletonCard";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useGoldContext } from "@/context/GoldContext";

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "day", label: "يوم" },
  { value: "week", label: "أسبوع" },
  { value: "month", label: "شهر" },
  { value: "3months", label: "3 شهور" },
  { value: "6months", label: "6 شهور" },
  { value: "year", label: "سنة" },
];

const KARATS = [
  { key: "price24" as const, label: "عيار 24", color: "#f59e0b" },
  { key: "price21" as const, label: "عيار 21", color: "#d97706" },
  { key: "price18" as const, label: "عيار 18", color: "#92400e" },
];

type NumericKey = (typeof KARATS)[number]["key"];

export function ChartsContent() {
  const { prices } = useGoldContext();
  const [period, setPeriod] = useState<ChartPeriod>("week");
  const [data, setData] = useState<GoldHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKarats, setActiveKarats] = useState<string[]>(["price21", "price24"]);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/gold-prices/history?period=${period}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setData(json.data);
        } else {
          setData(generateHistoricalData(period, prices ?? undefined));
        }
      } catch {
        setData(generateHistoricalData(period, prices ?? undefined));
      }
      setIsLoading(false);
    };
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [period, prices]);

  const toggleKarat = (key: string) => {
    setActiveKarats((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm" style={{ fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
        <p className="text-muted-foreground text-xs mb-2">
          {label ? formatShortDate(label) : ""}
        </p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">
              {KARATS.find((k) => k.key === p.name)?.label}:
            </span>
            <span className="font-bold">{formatPrice(p.value)} ج.م</span>
          </div>
        ))}
      </div>
    );
  };

  const getPriceChange = (key: NumericKey): number => {
    if (data.length < 2) return 0;
    const first = data[0][key];
    const last = data[data.length - 1][key];
    return parseFloat((((last - first) / first) * 100).toFixed(2));
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-black text-lg">الرسوم البيانية</h1>
          <p className="text-xs text-muted-foreground">تتبع حركة الأسعار</p>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2 p-1 bg-muted rounded-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              period === value
                ? "bg-card shadow-sm text-gold-600 dark:text-gold-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {!isLoading && data.length > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {KARATS.map(({ key, label, color }) => {
            const change = getPriceChange(key);
            const isUp = change >= 0;
            return (
              <motion.button
                key={key}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                onClick={() => toggleKarat(key)}
                className={cn(
                  "p-3 rounded-2xl border-2 text-center transition-all",
                  activeKarats.includes(key)
                    ? "border-opacity-100"
                    : "border-border opacity-50"
                )}
                style={{
                  borderColor: activeKarats.includes(key) ? color : undefined,
                  backgroundColor: activeKarats.includes(key)
                    ? `${color}15`
                    : undefined,
                }}
              >
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={cn("text-sm font-black", isUp ? "text-green-500" : "text-red-500")}>
                  {isUp ? "▲" : "▼"} {Math.abs(change)}%
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <motion.div
          className="gold-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-sm mb-4">الحركة السعرية</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {KARATS.map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              {KARATS.filter(({ key }) => activeKarats.includes(key)).map(({ key, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 5, fill: color }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div
          className="gold-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-bold text-sm mb-4">مقارنة العيارات</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => KARATS.find((k) => k.key === value)?.label ?? value}
                wrapperStyle={{ fontFamily: "Cairo, sans-serif", fontSize: "12px", direction: "rtl" }}
              />
              {KARATS.map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
}
