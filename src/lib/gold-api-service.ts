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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const [goldRes, usdRate] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", {
        signal: controller.signal,
      }),
      fetchUsdEgpRate(),
    ]);

    if (!goldRes.ok) {
      return null;
    }

    const data: GoldApiPriceResponse = await goldRes.json();

    if (typeof data.price !== "number" || data.price <= 0) {
      return null;
    }

    const goldUsdPerOz = data.price;
    const goldUsdPerGram = goldUsdPerOz / TROY_OZ_TO_GRAM;
    const goldEgpPerGram = goldUsdPerGram * usdRate;

    const karat24Buy = Math.round(goldEgpPerGram);
    const karat21Buy = Math.round(goldEgpPerGram * (21 / 24));
    const karat18Buy = Math.round(goldEgpPerGram * (18 / 24));
    const poundBuy = Math.round(karat21Buy * 8);

    let prev: { karat24Buy: number; karat21Buy: number; karat18Buy: number; poundBuy: number } | null = null;
    try {
      const { prisma } = await import("@/lib/db/prisma");
      prev = await prisma.goldPrice.findFirst({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      prev = null;
    }

    function calcChange(current: number, prevVal: number | null | undefined): number {
      return prevVal ? current - prevVal : 0;
    }
    function calcChangePercent(current: number, prevVal: number | null | undefined): number {
      return prevVal ? parseFloat((((current - prevVal) / prevVal) * 100).toFixed(2)) : 0;
    }

    return {
      karat24: {
        karat: 24,
        buyPrice: karat24Buy,
        sellPrice: Math.round(karat24Buy * 0.98),
        change: calcChange(karat24Buy, prev?.karat24Buy),
        changePercent: calcChangePercent(karat24Buy, prev?.karat24Buy),
      },
      karat21: {
        karat: 21,
        buyPrice: karat21Buy,
        sellPrice: Math.round(karat21Buy * 0.98),
        change: calcChange(karat21Buy, prev?.karat21Buy),
        changePercent: calcChangePercent(karat21Buy, prev?.karat21Buy),
      },
      karat18: {
        karat: 18,
        buyPrice: karat18Buy,
        sellPrice: Math.round(karat18Buy * 0.98),
        change: calcChange(karat18Buy, prev?.karat18Buy),
        changePercent: calcChangePercent(karat18Buy, prev?.karat18Buy),
      },
      pound: {
        karat: "pound",
        buyPrice: poundBuy,
        sellPrice: Math.round(poundBuy * 0.98),
        change: calcChange(poundBuy, prev?.poundBuy),
        changePercent: calcChangePercent(poundBuy, prev?.poundBuy),
      },
      dollar: parseFloat(usdRate.toFixed(2)),
      lastUpdated: new Date(data.updatedAt).toISOString(),
      source: "gold-api.com",
    };
  } catch (err) {
    console.error("[gold-api-service]", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
