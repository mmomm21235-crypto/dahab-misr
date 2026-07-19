"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import type { GoldPrices } from "@/types";
import { useGoldStore } from "@/stores/goldStore";
import { useSettingsStore } from "@/stores/settingsStore";

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
  const { settings } = useSettingsStore();

  useEffect(() => {
    fetchPrices(false);
    const intervalMs = (settings.refreshInterval ?? 60) * 1000;
    const interval = setInterval(() => fetchPrices(true), intervalMs);
    return () => clearInterval(interval);
  }, [fetchPrices, settings.refreshInterval]);

  const refresh = useCallback(() => fetchPrices(true), [fetchPrices]);

  const value = useMemo(() => {
    return {
      prices,
      isLoading,
      isRefreshing,
      error,
      refresh,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    };
  }, [prices, isLoading, isRefreshing, error, refresh, lastUpdated]);

  return (
    <GoldContext.Provider value={value}>
      {children}
    </GoldContext.Provider>
  );
}

export const useGoldContext = () => useContext(GoldContext);
