import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updatePortfolioHolding, deletePortfolioHolding } from "@/lib/db/portfolio";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export const PUT = withSecurity(async (request: Request, { params }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const { id } = await params;
    const body = await request.json();
    const { name, karat, weight, buyPrice, buyDate, notes } = body;

    const data: Record<string, string | number> = {};
    if (name) data.name = String(name).slice(0, 100);
    if (karat) data.karat = parseInt(karat);
    if (weight) data.weight = parseFloat(weight);
    if (buyPrice) data.buyPrice = parseFloat(buyPrice);
    if (buyDate) data.buyDate = buyDate;
    if (notes !== undefined) data.notes = String(notes).slice(0, 500);

    const holding = await updatePortfolioHolding(id, user.id, data);
    if (!holding) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: holding });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}, { rateLimit: "portfolio", requireAuth: true });

export const DELETE = withSecurity(async (_request: Request, { params }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const { id } = await params;
    const deleted = await deletePortfolioHolding(id, user.id);
    if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}, { rateLimit: "portfolio", requireAuth: true });
