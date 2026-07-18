import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
