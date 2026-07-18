import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const { getSecurityStats } = await import("@/lib/security/security-monitor");
    const { getOverallThreatLevel, getDetections } = await import("@/lib/security/intrusion-detection");
    const { getBlockedIPs, getThreatIntelligenceStats, isIPThreat } = await import("@/lib/security/threat-intelligence");
    const { getIncidents, getIncidentStats } = await import("@/lib/security/incident-response");

    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "overview";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    switch (view) {
      case "overview":
        return NextResponse.json({
          success: true,
          data: {
            threatLevel: getOverallThreatLevel(),
            securityStats: getSecurityStats(),
            threatIntelStats: getThreatIntelligenceStats(),
            incidentStats: getIncidentStats(),
            activeBlocks: getBlockedIPs().length,
            recentIncidents: getIncidents({ limit: 10 }),
          },
        });

      case "threat-level":
        return NextResponse.json({
          success: true,
          data: getOverallThreatLevel(),
        });

      case "blocks":
        return NextResponse.json({
          success: true,
          data: getBlockedIPs(),
        });

      case "incidents":
        return NextResponse.json({
          success: true,
          data: getIncidents({ limit }),
          stats: getIncidentStats(),
        });

      case "detections":
        return NextResponse.json({
          success: true,
          data: getDetections({ limit }),
        });

      case "ip":
        const ip = url.searchParams.get("ip");
        if (!ip) {
          return NextResponse.json(
            { success: false, error: "IP parameter required" },
            { status: 400 }
          );
        }
        const profile = isIPThreat(ip);
        return NextResponse.json({
          success: true,
          data: profile || { ip, message: "No threat data found" },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid view parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch threat data" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
