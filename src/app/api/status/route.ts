import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  const statuses: Record<string, unknown> = {
    database: { status: "unknown" },
  };

  try {
    const count = await prisma.goldPrice.count();
    statuses.database = {
      status: "healthy",
      records: count,
    };
  } catch {
    statuses.database = { status: "error" };
  }

  return NextResponse.json({
    success: true,
    status: "ok",
    database: statuses.database,
  });
}, { rateLimit: "api" });
