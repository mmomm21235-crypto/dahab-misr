import { prisma } from "./prisma";
import type { GoldPrices } from "@/types";
import { fetchUsdEgpRate } from "@/lib/usd-service";

const GOLD_API_URL = "https://www.goldapi.io/api/XAU/EGP";
const CACHE_DURATION_MS = 5 * 60 * 1000;

interface GoldApiResponse {
  price: number;
  change: number;
  chgPercent: number;
  timestamp: number;
}

async function fetchFromGoldApi(): Promise<GoldPrices | null> {
  const apiKey = process.env.GOLD_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(GOLD_API_URL, {
      headers: {
        "x-access-token": apiKey,
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const data: GoldApiResponse = await res.json();
    const ounceToGram = 31.1035;
    const pricePerOunce = data.price;
    const pricePerGram = pricePerOunce / ounceToGram;

    const usdRate = await fetchUsdEgpRate();

    return {
      karat24: {
        karat: 24,
        buyPrice: Math.round(pricePerGram),
        sellPrice: Math.round(pricePerGram * 0.98),
        change: Math.round(data.change / ounceToGram),
        changePercent: parseFloat(data.chgPercent.toFixed(2)),
      },
      karat21: {
        karat: 21,
        buyPrice: Math.round(pricePerGram * 0.875),
        sellPrice: Math.round(pricePerGram * 0.875 * 0.98),
        change: Math.round((data.change / ounceToGram) * 0.875),
        changePercent: parseFloat(data.chgPercent.toFixed(2)),
      },
      karat18: {
        karat: 18,
        buyPrice: Math.round(pricePerGram * 0.75),
        sellPrice: Math.round(pricePerGram * 0.75 * 0.98),
        change: Math.round((data.change / ounceToGram) * 0.75),
        changePercent: parseFloat(data.chgPercent.toFixed(2)),
      },
      pound: {
        karat: "pound",
        buyPrice: Math.round(pricePerGram * 0.875 * 8),
        sellPrice: Math.round(pricePerGram * 0.875 * 8 * 0.98),
        change: Math.round((data.change / ounceToGram) * 0.875 * 8),
        changePercent: parseFloat(data.chgPercent.toFixed(2)),
      },
      dollar: parseFloat(usdRate.toFixed(2)),
      lastUpdated: new Date(data.timestamp * 1000).toISOString(),
      source: "GoldAPI.io",
    };
  } catch {
    return null;
  }
}

export async function getGoldPrices(): Promise<GoldPrices> {
  const { generateCurrentPrices } = await import("@/lib/goldData");
  const fallback = generateCurrentPrices();

  try {
    const [cached] = await prisma.goldPrice.findMany({
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (cached) {
      const age = Date.now() - cached.createdAt.getTime();
      if (age < CACHE_DURATION_MS) {
        return {
          karat24: {
            karat: 24,
            buyPrice: cached.karat24Buy,
            sellPrice: cached.karat24Sell,
            change: cached.change24 ?? 0,
            changePercent: 0,
          },
          karat21: {
            karat: 21,
            buyPrice: cached.karat21Buy,
            sellPrice: cached.karat21Sell,
            change: cached.change21 ?? 0,
            changePercent: 0,
          },
          karat18: {
            karat: 18,
            buyPrice: cached.karat18Buy,
            sellPrice: cached.karat18Sell,
            change: cached.change18 ?? 0,
            changePercent: 0,
          },
          pound: {
            karat: "pound",
            buyPrice: cached.poundBuy,
            sellPrice: cached.poundSell,
            change: cached.changePound ?? 0,
            changePercent: 0,
          },
          dollar: cached.dollarPrice,
          lastUpdated: cached.createdAt.toISOString(),
          source: cached.source,
        };
      }
    }

    const apiData = await fetchFromGoldApi();
    if (apiData) {
      await prisma.goldPrice.create({
        data: {
          karat24Buy: apiData.karat24.buyPrice,
          karat24Sell: apiData.karat24.sellPrice,
          karat21Buy: apiData.karat21.buyPrice,
          karat21Sell: apiData.karat21.sellPrice,
          karat18Buy: apiData.karat18.buyPrice,
          karat18Sell: apiData.karat18.sellPrice,
          poundBuy: apiData.pound.buyPrice,
          poundSell: apiData.pound.sellPrice,
          dollarPrice: apiData.dollar,
          change24: apiData.karat24.change,
          change21: apiData.karat21.change,
          change18: apiData.karat18.change,
          changePound: apiData.pound.change,
        },
      });
      return apiData;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export async function getPriceHistory(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.goldPrice.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      karat21Buy: true,
      karat24Buy: true,
      karat18Buy: true,
    },
  });
}
