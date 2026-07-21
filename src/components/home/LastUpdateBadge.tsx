"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useGoldContext } from "@/context/GoldContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function LastUpdateBadge() {
  const { lastUpdated, isRefreshing, refresh } = useGoldContext();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = () => {
    if (!lastUpdated) return "جارٍ التحديث...";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    return `منذ ${Math.floor(diff / 3600)} ساعة`;
  };

  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            "bg-muted border border-border/50"
          )}
        >
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">آخر تحديث:</span>
          <motion.span
            className="font-bold text-foreground"
            key={getTimeAgo()}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getTimeAgo()}
          </motion.span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <motion.button
        onClick={refresh}
        disabled={isRefreshing}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
          "bg-gold-500/10 border border-gold-500/20 text-gold-600 dark:text-gold-400",
          "hover:bg-gold-500/20 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        {isRefreshing ? "جارٍ التحديث..." : "تحديث"}
      </motion.button>
    </motion.div>
  );
}
