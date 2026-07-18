import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const { verifyIntegrity, verifyBuildOutput } = await import("@/lib/security/integrity");

    const integrityReport = verifyIntegrity();
    const buildReport = verifyBuildOutput();

    return NextResponse.json({
      success: true,
      data: {
        integrity: integrityReport,
        build: buildReport,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Integrity check failed" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
