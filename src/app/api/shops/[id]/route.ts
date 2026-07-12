import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    await prisma.shop.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    console.error("DELETE /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete shop" }, { status: 500 });
  }
}
