import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const { getSecurityEvents, getSecurityAlerts, getSecurityStats } = await import("@/lib/security/security-monitor");
    const { getDetections, getThreatAssessments } = await import("@/lib/security/intrusion-detection");
    const { getBlockedIPs, getThreatIntelligenceStats } = await import("@/lib/security/threat-intelligence");
    const { getIncidents, getIncidentStats } = await import("@/lib/security/incident-response");

    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "events";
    const type = url.searchParams.get("type") as any;
    const severity = url.searchParams.get("severity") as any;
    const ip = url.searchParams.get("ip") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const startDate = url.searchParams.get("startDate")
      ? parseInt(url.searchParams.get("startDate")!, 10)
      : undefined;
    const endDate = url.searchParams.get("endDate")
      ? parseInt(url.searchParams.get("endDate")!, 10)
      : undefined;

    switch (view) {
      case "events":
        return NextResponse.json({
          success: true,
          data: getSecurityEvents({ type, severity, ip, startDate, endDate, limit }),
          stats: getSecurityStats(),
        });

      case "alerts":
        return NextResponse.json({
          success: true,
          data: getSecurityAlerts({ severity, limit }),
        });

      case "detections":
        return NextResponse.json({
          success: true,
          data: getDetections({
            category: url.searchParams.get("category") as any,
            level: severity as any,
            ip,
            startDate,
            endDate,
            limit,
          }),
        });

      case "threats":
        return NextResponse.json({
          success: true,
          data: getThreatAssessments({ limit }),
        });

      case "blocked":
        return NextResponse.json({
          success: true,
          data: getBlockedIPs(),
          stats: getThreatIntelligenceStats(),
        });

      case "incidents":
        return NextResponse.json({
          success: true,
          data: getIncidents({
            status: url.searchParams.get("status") as any,
            severity,
            ip,
            startDate,
            endDate,
            limit,
          }),
          stats: getIncidentStats(),
        });

      case "stats":
        return NextResponse.json({
          success: true,
          data: {
            security: getSecurityStats(),
            threatIntel: getThreatIntelligenceStats(),
            incidents: getIncidentStats(),
          },
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
      { success: false, error: "Failed to fetch security events" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });

const sseClients = new Set<ReadableStreamDefaultController>();

export function addSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.add(controller);
}

export function removeSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.delete(controller);
}

export function broadcastSecurityEvent(event: unknown): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const controller of sseClients) {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      sseClients.delete(controller);
    }
  }
}

export const runtime = "nodejs";
