import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAuditLog } from "@/lib/data-protection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const log = getAuditLog(100);
    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    console.error("GET /api/security/audit error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit log" }, { status: 500 });
  }
}
