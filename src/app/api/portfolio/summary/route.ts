import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId: user.id },
      select: { karat: true, weight: true, buyPrice: true },
    });

    let totalWeight = 0;
    let totalCost = 0;
    const byKarat: Record<number, { weight: number; cost: number }> = {};

    for (const h of holdings) {
      totalWeight += h.weight;
      totalCost += h.weight * h.buyPrice;
      if (!byKarat[h.karat]) byKarat[h.karat] = { weight: 0, cost: 0 };
      byKarat[h.karat].weight += h.weight;
      byKarat[h.karat].cost += h.weight * h.buyPrice;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalHoldings: holdings.length,
        totalWeight,
        totalCost,
        averageBuyPrice: totalWeight > 0 ? Math.round(totalCost / totalWeight) : 0,
        byKarat,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch summary" }, { status: 500 });
  }
}, { rateLimit: "portfolio", requireAuth: true });
