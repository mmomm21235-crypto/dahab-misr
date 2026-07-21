import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GoldPrices } from "@/types";

interface GoldState {
  prices: GoldPrices | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
  fetchPrices: (silent?: boolean) => Promise<void>;
}

export const useGoldStore = create<GoldState>()(
  persist(
    (set, get) => ({
      prices: null,
      isLoading: true,
      isRefreshing: false,
      error: null,
      lastUpdated: null,

      fetchPrices: async (silent = false) => {
        const hasPrices = get().prices !== null;
        if (!silent && !hasPrices) set({ isLoading: true });
        else set({ isRefreshing: true });
        set({ error: null });

        try {
          const res = await fetch("/api/gold-prices");
          if (!res.ok) throw new Error("API error");

          const json = await res.json();
          if (!json.success) throw new Error(json.error);

          set({
            prices: json.data,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            isRefreshing: false,
          });
        } catch {
          set({
            error: "تعذر تحديث الأسعار. يرجى المحاولة مجدداً.",
            isLoading: false,
            isRefreshing: false,
          });
        }
      },
    }),
    {
      name: "gold-store",
      partialize: (state) => ({
        prices: state.prices,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
