import { NextResponse } from "next/server";
import { fetchGoldPricesFromAPI } from "@/lib/gold-api-service";
import { generateCurrentPrices } from "@/lib/goldData";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 10 * 60 * 1000;
let cachedPrices: ReturnType<typeof generateCurrentPrices> | null = null;
let cachedSource = "";
let lastFetchTime = 0;

export const GET = withSecurity(async () => {
  try {
    const now = Date.now();
    const cacheAge = now - lastFetchTime;

    if (cachedPrices && cacheAge < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, data: cachedPrices, source: cachedSource + " (cached)" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
          },
        }
      );
    }

    let prices = await fetchGoldPricesFromAPI();
    let source = "gold-api.com";

    if (!prices) {
      prices = generateCurrentPrices();
      source = "mock";
    }

    cachedPrices = prices;
    cachedSource = source;
    lastFetchTime = now;

    try {
      const { prisma } = await import("@/lib/db/prisma");
      const fiveMinAgo = new Date(now - 5 * 60 * 1000);
      const lastRecord = await prisma.goldPrice.findFirst({
        where: { createdAt: { gte: fiveMinAgo } },
        orderBy: { createdAt: "desc" },
      });

      if (!lastRecord || lastRecord.karat21Buy !== prices.karat21.buyPrice) {
        await prisma.goldPrice.create({
          data: {
            karat24Buy: prices.karat24.buyPrice,
            karat24Sell: prices.karat24.sellPrice,
            karat21Buy: prices.karat21.buyPrice,
            karat21Sell: prices.karat21.sellPrice,
            karat18Buy: prices.karat18.buyPrice,
            karat18Sell: prices.karat18.sellPrice,
            poundBuy: prices.pound.buyPrice,
            poundSell: prices.pound.sellPrice,
            dollarPrice: prices.dollar,
            change24: prices.karat24.change,
            change21: prices.karat21.change,
            change18: prices.karat18.change,
            changePound: prices.pound.change,
            source,
          },
        });
      }
    } catch (dbErr) {
      console.error("[GOLD-PRICES] DB write skipped:", dbErr);
    }

    return NextResponse.json(
      { success: true, data: prices, source },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("[GOLD-PRICES] Critical error:", error);
    if (cachedPrices) {
      return NextResponse.json(
        { success: true, data: cachedPrices, source: cachedSource + " (fallback)" },
        { status: 200 }
      );
    }
    const prices = generateCurrentPrices();
    return NextResponse.json(
      { success: true, data: prices, source: "mock-fallback" },
      { status: 200 }
    );
  }
}, { rateLimit: "goldPrices", firewall: false, ddos: false, honeypot: false });
