import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  const startTime = Date.now();

  let dbStatus = "ok";
  let dbLatency = 0;
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    latency: Date.now() - startTime,
    database: { status: dbStatus, latency: dbLatency },
  });
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
