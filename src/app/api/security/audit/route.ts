import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();
    const { getAuditLog } = await import("@/lib/data-protection");
    const log = getAuditLog(100);
    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Failed to fetch audit log" }, { status: 500 });
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
