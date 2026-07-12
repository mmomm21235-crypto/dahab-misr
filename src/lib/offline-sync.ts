import { cachePriceData, getCachedPriceData, isOnline } from "./db/indexeddb";
import type { GoldPrices } from "@/types";

const CACHE_TTL = 5 * 60 * 1000;

export async function getPricesWithFallback(): Promise<GoldPrices | null> {
  const online = await isOnline();

  if (online) {
    try {
      const res = await fetch("/api/gold-prices");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await cachePriceData("gold-prices", json.data);
          return json.data as GoldPrices;
        }
      }
    } catch {
      // Network error, fallback to cache
    }
  }

  const cached = await getCachedPriceData<GoldPrices>("gold-prices");
  if (cached) {
    const age = Date.now() - cached.cachedAt;
    if (age < CACHE_TTL) {
      return cached.data;
    }
  }

  return null;
}
