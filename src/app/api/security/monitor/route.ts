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

  const memUsage = process.memoryUsage();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    latency: Date.now() - startTime,
    database: { status: dbStatus, latency: dbLatency },
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDb: !!process.env.DATABASE_URL,
      hasAuth: !!process.env.NEXTAUTH_SECRET,
      hasGoldApi: !!process.env.GOLDAPI_KEY,
    },
  });
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
