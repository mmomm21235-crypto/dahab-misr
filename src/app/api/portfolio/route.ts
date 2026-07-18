import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPortfolioHoldings, createPortfolioHolding } from "@/lib/db/portfolio";
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

    const holdings = await getPortfolioHoldings(user.id);
    return NextResponse.json({ success: true, data: holdings });
  } catch (error) {

    return NextResponse.json({ success: false, error: "Failed to fetch portfolio" }, { status: 500 });
  }
}, { rateLimit: "portfolio", requireAuth: true });

export const POST = withSecurity(async (request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { name, karat, weight, buyPrice, buyDate, notes } = body;

    if (!name || !karat || !weight || !buyPrice) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (typeof name !== "string" || name.length > 100) {
      return NextResponse.json({ success: false, error: "Invalid name" }, { status: 400 });
    }

    const nw = parseFloat(weight);
    const bp = parseFloat(buyPrice);
    const k = parseInt(karat);
    if (isNaN(nw) || nw <= 0 || isNaN(bp) || bp <= 0 || ![14, 18, 21, 24].includes(k)) {
      return NextResponse.json({ success: false, error: "Invalid values" }, { status: 400 });
    }

    const holding = await createPortfolioHolding(user.id, {
      name: name.trim(),
      karat: k,
      weight: nw,
      buyPrice: bp,
      buyDate: buyDate || undefined,
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ success: true, data: holding }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create holding" }, { status: 500 });
  }
}, {
  rateLimit: "portfolio",
  requireAuth: true,
  validateBody: (body) => {
    if (!body.name || !body.karat || !body.weight || !body.buyPrice) return { valid: false, error: "Missing required fields" };
    return { valid: true };
  },
});
