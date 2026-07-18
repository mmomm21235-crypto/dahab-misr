import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const [totalUsers, totalAlerts, totalShops, totalPortfolio, totalNews, latestPrice] =
      await Promise.all([
        prisma.user.count(),
        prisma.alert.count(),
        prisma.shop.count(),
        prisma.portfolioHolding.count(),
        prisma.newsArticle.count(),
        prisma.goldPrice.findFirst({
          orderBy: { createdAt: "desc" },
          select: {
            karat24Buy: true,
            karat24Sell: true,
            karat21Buy: true,
            karat21Sell: true,
            karat18Buy: true,
            karat18Sell: true,
            poundBuy: true,
            poundSell: true,
            dollarPrice: true,
            change24: true,
            change21: true,
            change18: true,
            changePound: true,
          },
        }),
      ]);

    const recentAlerts = await prisma.alert.findMany({
      where: { triggeredAt: { not: null } },
      orderBy: { triggeredAt: "desc" },
      take: 5,
      select: {
        id: true,
        karat: true,
        targetPrice: true,
        condition: true,
        triggeredAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAlerts,
        totalShops,
        totalPortfolio,
        totalNews,
        latestPrice,
        recentAlerts,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
