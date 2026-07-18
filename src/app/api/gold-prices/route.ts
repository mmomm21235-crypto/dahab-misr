import { NextResponse } from "next/server";
import { fetchGoldPricesFromAPI } from "@/lib/gold-api-service";
import { generateCurrentPrices } from "@/lib/goldData";
import { prisma } from "@/lib/db/prisma";
import { checkAlertsAndNotify } from "@/lib/push-service";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  try {
    let prices = await fetchGoldPricesFromAPI();
    let source = "GoldAPI.io";

    if (!prices) {
      prices = generateCurrentPrices();
      source = "mock";
    }

    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
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
    }

    try {
      await checkAlertsAndNotify(prices);
    } catch (alertErr) {
    }

    return NextResponse.json(
      { success: true, data: prices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    const prices = generateCurrentPrices();
    return NextResponse.json(
      { success: true, data: prices },
      { status: 200 }
    );
  }
}, { rateLimit: "goldPrices" });
