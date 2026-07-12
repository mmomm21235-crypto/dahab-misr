import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [totalUsers, totalAlerts, totalShops, totalPortfolio, totalNews, latestPrice] =
      await Promise.all([
        prisma.user.count(),
        prisma.alert.count(),
        prisma.shop.count(),
        prisma.portfolioHolding.count(),
        prisma.newsArticle.count(),
        prisma.goldPrice.findFirst({ orderBy: { createdAt: "desc" } }),
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
        user: { select: { name: true, email: true } },
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
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
