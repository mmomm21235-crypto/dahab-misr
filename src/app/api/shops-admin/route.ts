import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
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
}
