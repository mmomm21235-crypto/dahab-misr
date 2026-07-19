"use client";

import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff < 0) {
      setPullDistance(0);
      return;
    }
    const distance = Math.min(diff * 0.5, MAX_PULL);
    setPullDistance(distance);
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } catch {}
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const rotation = pullDistance / THRESHOLD * 360;
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        animate={{ height: pullDistance > 0 || isRefreshing ? pullDistance || THRESHOLD : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col items-center gap-1 py-2">
          <RefreshCw
            className={cn(
              "w-5 h-5 text-gold-500 transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{ transform: isRefreshing ? undefined : `rotate(${rotation}deg)` }}
          />
          <span className="text-xs text-muted-foreground font-bold">
            {isRefreshing
              ? "جاري التحديث..."
              : pullDistance >= THRESHOLD
                ? "اترك للتحديث"
                : "اسحب للتحديث"}
          </span>
        </div>
      </motion.div>
      <div style={{ transform: `translateY(${pullDistance > 0 || isRefreshing ? 0 : -pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
}
