import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateHistoricalData } from "@/lib/goldData";
import { withSecurity } from "@/lib/api-security";
import type { GoldPrices } from "@/types";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async (request: NextRequest) => {
  const period = request.nextUrl.searchParams.get("period") ?? "week";

  try {
    const now = new Date();
    let hoursBack: number;

    switch (period) {
      case "day":
        hoursBack = 24;
        break;
      case "week":
        hoursBack = 7 * 24;
        break;
      case "month":
        hoursBack = 30 * 24;
        break;
      case "3months":
        hoursBack = 90 * 24;
        break;
      case "6months":
        hoursBack = 180 * 24;
        break;
      case "year":
        hoursBack = 365 * 24;
        break;
      default:
        hoursBack = 7 * 24;
    }

    const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    const records = await prisma.goldPrice.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 1000,
    });

    const latestRecord = records.length > 0 ? records[records.length - 1] : null;

    const prices = latestRecord
      ? ({
          karat24: { buyPrice: latestRecord.karat24Buy, sellPrice: latestRecord.karat24Sell, change: 0, changePercent: 0 },
          karat21: { buyPrice: latestRecord.karat21Buy, sellPrice: latestRecord.karat21Sell, change: 0, changePercent: 0 },
          karat18: { buyPrice: latestRecord.karat18Buy, sellPrice: latestRecord.karat18Sell, change: 0, changePercent: 0 },
          pound: { karat: "pound", buyPrice: latestRecord.poundBuy, sellPrice: latestRecord.poundSell, change: 0, changePercent: 0 },
          dollar: latestRecord.dollarPrice,
          lastUpdated: latestRecord.createdAt.toISOString(),
          source: "database",
        } as GoldPrices)
      : undefined;

    const anchorPoints = records.map((r) => ({
      date: r.createdAt.toISOString(),
      price24: Math.round(r.karat24Buy),
      price21: Math.round(r.karat21Buy),
      price18: Math.round(r.karat18Buy),
    }));

    const data = generateHistoricalData(period as any, prices as any, anchorPoints);

    return NextResponse.json({
      success: true,
      data,
      source: records.length > 0 ? "blend" : "mock",
      recordCount: records.length,
    });
  } catch (error) {
    const data = generateHistoricalData(period as any);
    return NextResponse.json({ success: true, data, source: "mock-fallback" });
  }
}, { rateLimit: "goldPrices" });
