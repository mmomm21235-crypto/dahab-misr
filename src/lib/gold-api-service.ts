import type { GoldPrices } from "@/types";
import { fetchUsdEgpRate } from "./usd-service";

interface GoldApiResponse {
  timestamp: number;
  price: number;
  ch: number;
  chp: number | null;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  price_gram_20k: number;
  price_gram_18k: number;
  price_gram_14k: number;
  price_gram_10k: number;
}

export async function fetchGoldPricesFromAPI(): Promise<GoldPrices | null> {
  const apiKey = process.env.GOLD_API_KEY;

  if (!apiKey) {
    console.warn("GOLD_API_KEY not configured, using mock data");
    return null;
  }

  try {
    const [goldRes, usdRate] = await Promise.all([
      fetch("https://www.goldapi.io/api/XAU/EGP", {
        headers: {
          "x-access-token": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      }),
      fetchUsdEgpRate(),
    ]);

    if (!goldRes.ok) {
      console.error(`GoldAPI responded with ${goldRes.status}`);
      return null;
    }

    const data: GoldApiResponse = await goldRes.json();

    return {
      karat24: {
        karat: 24,
        buyPrice: Math.round(data.price_gram_24k),
        sellPrice: Math.round(data.price_gram_24k * 1.02),
        change: Math.round(data.ch / 31.1035),
        changePercent: data.chp ?? 0,
      },
      karat21: {
        karat: 21,
        buyPrice: Math.round(data.price_gram_21k),
        sellPrice: Math.round(data.price_gram_21k * 1.02),
        change: Math.round((data.ch / 31.1035) * 0.875),
        changePercent: data.chp ?? 0,
      },
      karat18: {
        karat: 18,
        buyPrice: Math.round(data.price_gram_18k),
        sellPrice: Math.round(data.price_gram_18k * 1.02),
        change: Math.round((data.ch / 31.1035) * 0.75),
        changePercent: data.chp ?? 0,
      },
      pound: {
        karat: "pound",
        buyPrice: Math.round(data.price_gram_21k * 8),
        sellPrice: Math.round(data.price_gram_21k * 8 * 1.015),
        change: Math.round((data.ch / 31.1035) * 0.875 * 8),
        changePercent: data.chp ?? 0,
      },
      dollar: parseFloat(usdRate.toFixed(2)),
      lastUpdated: new Date(data.timestamp * 1000).toISOString(),
      source: "GoldAPI.io",
    };
  } catch (err) {
    console.error("GoldAPI fetch failed:", err);
    return null;
  }
}
