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
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastUpdated: null,

      fetchPrices: async (silent = false) => {
        const hasPrices = get().prices !== null;
        if (!silent && !hasPrices) set({ isLoading: true });
        else if (silent) set({ isRefreshing: true });
        set({ error: null });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const res = await fetch("/api/gold-prices", {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const json = await res.json();
          if (!json.success) throw new Error(json.error || "API failed");

          set({
            prices: json.data,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            isRefreshing: false,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error && err.name === "AbortError"
              ? "انتهت مهلة الاتصال."
              : "تعذر تحديث الأسعار. يرجى المحاولة مجدداً.";
          set({
            error: msg,
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
