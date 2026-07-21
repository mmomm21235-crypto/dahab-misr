import type { GoldPrices } from "@/types";
import { fetchUsdEgpRate } from "./usd-service";

interface GoldApiPriceResponse {
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  name: string;
  price: number;
  symbol: string;
  updatedAt: string;
  updatedAtReadable: string;
}

const TROY_OZ_TO_GRAM = 31.1035;

export async function fetchGoldPricesFromAPI(): Promise<GoldPrices | null> {
  try {
    const [goldRes, usdRate] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", {
        next: { revalidate: 600 },
      }),
      fetchUsdEgpRate(),
    ]);

    if (!goldRes.ok) {
      return null;
    }

    const data: GoldApiPriceResponse = await goldRes.json();
    const goldUsdPerOz = data.price;
    const goldUsdPerGram = goldUsdPerOz / TROY_OZ_TO_GRAM;
    const goldEgpPerGram = goldUsdPerGram * usdRate;

    const karat24Price = Math.round(goldEgpPerGram);
    const karat22Price = Math.round(goldEgpPerGram * (22 / 24));
    const karat21Price = Math.round(goldEgpPerGram * (21 / 24));
    const karat18Price = Math.round(goldEgpPerGram * (18 / 24));

    const spread = 0.02;
    const poundSpread = 0.015;

    return {
      karat24: {
        karat: 24,
        buyPrice: karat24Price,
        sellPrice: Math.round(karat24Price * (1 + spread)),
        change: 0,
        changePercent: 0,
      },
      karat21: {
        karat: 21,
        buyPrice: karat21Price,
        sellPrice: Math.round(karat21Price * (1 + spread)),
        change: 0,
        changePercent: 0,
      },
      karat18: {
        karat: 18,
        buyPrice: karat18Price,
        sellPrice: Math.round(karat18Price * (1 + spread)),
        change: 0,
        changePercent: 0,
      },
      pound: {
        karat: "pound",
        buyPrice: Math.round(karat21Price * 8),
        sellPrice: Math.round(karat21Price * 8 * (1 + poundSpread)),
        change: 0,
        changePercent: 0,
      },
      dollar: parseFloat(usdRate.toFixed(2)),
      lastUpdated: new Date(data.updatedAt).toISOString(),
      source: "gold-api.com",
    };
  } catch (err) {
    return null;
  }
}
