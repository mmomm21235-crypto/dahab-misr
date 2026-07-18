import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";
import { getFirewallStats, getFirewallEvents, getBlockedIPs } from "@/lib/security/api-firewall";
import { getDDoSStats, getActiveConnections, getThrottledIPs } from "@/lib/security/ddos-protection";
import { getHoneypotStats, getHoneypotHits, getHoneypotBans } from "@/lib/security/honeypot";
import { getGeoStats } from "@/lib/security/geolocation";
import { getSecurityStats } from "@/lib/security/ip-block";

export const dynamic = "force-dynamic";

export const GET = withSecurity(async () => {
  try {
    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin();

    const firewall = getFirewallStats();
    const firewallEvents = getFirewallEvents(20);
    const blockedIPsList = getBlockedIPs();

    const ddos = getDDoSStats();
    const activeConnections = getActiveConnections();
    const throttledIPs = getThrottledIPs();

    const honeypot = getHoneypotStats();
    const honeypotRecentHits = getHoneypotHits(20);
    const honeypotBansList = getHoneypotBans();

    const geo = getGeoStats();
    const ipBlock = getSecurityStats();

    return NextResponse.json({
      success: true,
      data: {
        firewall: {
          ...firewall,
          recentEvents: firewallEvents,
          blockedIPs: blockedIPsList,
        },
        ddos: {
          ...ddos,
          activeConnections: activeConnections.slice(0, 50),
          throttledIPs: throttledIPs.slice(0, 50),
        },
        honeypot: {
          ...honeypot,
          recentHits: honeypotRecentHits,
          activeBans: honeypotBansList,
        },
        geolocation: geo,
        ipBlock,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch firewall status" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true, requireAdmin: true });
