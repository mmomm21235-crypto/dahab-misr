import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withSecurity } from "@/lib/api-security";

export const GET = withSecurity(async () => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, data: shops });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    console.error("GET /api/shops-admin error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch shops" }, { status: 500 });
  }
}, { rateLimit: "shops", requireAuth: true, requireAdmin: true });
