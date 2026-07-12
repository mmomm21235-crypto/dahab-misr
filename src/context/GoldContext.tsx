"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import type { GoldPrices } from "@/types";
import { useGoldStore } from "@/stores/goldStore";

interface GoldContextValue {
  prices: GoldPrices | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

const GoldContext = createContext<GoldContextValue>({
  prices: null,
  isLoading: true,
  isRefreshing: false,
  error: null,
  refresh: () => {},
  lastUpdated: null,
});

export function GoldProvider({ children }: { children: React.ReactNode }) {
  const { prices, isLoading, isRefreshing, error, lastUpdated, fetchPrices } =
    useGoldStore();

  useEffect(() => {
    fetchPrices(false);
    const interval = setInterval(() => fetchPrices(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const refresh = useCallback(() => fetchPrices(true), [fetchPrices]);

  const value = useMemo(
    () => ({ prices, isLoading, isRefreshing, error, refresh, lastUpdated }),
    [prices, isLoading, isRefreshing, error, refresh, lastUpdated]
  );

  return (
    <GoldContext.Provider value={value}>
      {children}
    </GoldContext.Provider>
  );
}

export const useGoldContext = () => useContext(GoldContext);
