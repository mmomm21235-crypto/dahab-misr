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
  const prices = useGoldStore((s) => s.prices);
  const isLoading = useGoldStore((s) => s.isLoading);
  const isRefreshing = useGoldStore((s) => s.isRefreshing);
  const error = useGoldStore((s) => s.error);
  const lastUpdated = useGoldStore((s) => s.lastUpdated);
  const fetchPrices = useGoldStore((s) => s.fetchPrices);
  const refreshInterval = useSettingsStore((s) => s.settings.refreshInterval);

  useEffect(() => {
    fetchPrices(false);
    const intervalMs = (refreshInterval ?? 600) * 1000;
    const interval = setInterval(() => fetchPrices(true), intervalMs);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  const refresh = useCallback(() => fetchPrices(true), [fetchPrices]);

  const lastUpdatedDate = useMemo(
    () => (lastUpdated ? new Date(lastUpdated) : null),
    [lastUpdated]
  );

  const value = useMemo(
    () => ({
      prices,
      isLoading,
      isRefreshing,
      error,
      refresh,
      lastUpdated: lastUpdatedDate,
    }),
    [prices, isLoading, isRefreshing, error, refresh, lastUpdatedDate]
  );

  return (
    <GoldContext.Provider value={value}>
      {children}
    </GoldContext.Provider>
  );
}

export const useGoldContext = () => useContext(GoldContext);
