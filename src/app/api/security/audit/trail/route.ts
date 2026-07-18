import { NextRequest } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const { getAuditTrail, verifyAuditIntegrity, exportAuditTrail } = await import("@/lib/security/audit-trail");

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50", 10), 200);
    const format = (searchParams.get("format") as "json" | "csv") || "json";

    if (format === "csv" || format === "json") {
      const exportData = await exportAuditTrail(startDate, endDate, format);
      const contentType = format === "csv" ? "text/csv" : "application/json";
      const filename = `audit-trail-${new Date().toISOString().split("T")[0]}.${format}`;

      return new Response(exportData, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const result = await getAuditTrail({
      userId,
      action,
      entity,
      startDate,
      endDate,
      page,
      pageSize,
    });

    const integrity = await verifyAuditIntegrity();

    return Response.json({
      success: true,
      data: {
        entries: result.entries,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize),
        },
        integrity: {
          valid: integrity.valid,
          totalEntries: integrity.totalEntries,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json(
        { success: false, error: "غير مصرح" },
        { status: 403 }
      );
    }
    return Response.json(
      { success: false, error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
