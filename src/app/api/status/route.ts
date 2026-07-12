import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSecurityStats } from "@/lib/security/ip-block";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const security = getSecurityStats();

  return NextResponse.json({
    success: true,
    status: "ok",
    database: statuses.database,
    security: {
      blockedIPs: security.blockedIPs,
      suspiciousIPs: security.suspiciousIPs,
    },
  });
}
