import { NextRequest } from "next/server";

const HIGH_RISK_COUNTRIES = new Set([
  "XX", "KP", "IR", "SY", "CU", "VE", "RU", "BY",
]);

const COMMON_COUNTRIES = new Set([
  "EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "IQ",
  "TR", "US", "GB", "DE", "FR", "CA", "AU", "IN", "PK", "BD",
]);

declare global {
  var __geoLogins: Map<string, GeoLoginEntry> | undefined;
  var __vpnExitNodes: Set<string> | undefined;
}

interface GeoLoginEntry {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  ip: string;
}

const geoLogins: Map<string, GeoLoginEntry[]> =
  globalThis.__geoLogins ??= new Map();

const knownVPNExitNodes: Set<string> =
  globalThis.__vpnExitNodes ??= new Set();

const MAX_LOGIN_HISTORY = 20;
const ANOMALY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const IMPOSSIBLE_SPEED_KMH = 900; // faster than commercial flights

export interface GeoLocation {
  country: string;
  city: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isp: string;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  riskScore: number;
}

export interface GeoAnomaly {
  type: "impossible_travel" | "new_country" | "high_risk_country" | "vpn_detected" | "tor_detected";
  severity: "low" | "medium" | "high";
  description: string;
}

function getHeaderValue(req: NextRequest, name: string): string {
  return req.headers.get(name) || "";
}

function estimateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function extractGeoFromHeaders(req: NextRequest): GeoLocation {
  const country = getHeaderValue(req, "cf-ipcountry") ||
    getHeaderValue(req, "x-country-code") || "XX";
  const city = getHeaderValue(req, "x-city") || "unknown";
  const region = getHeaderValue(req, "x-region") || "unknown";
  const timezone = getHeaderValue(req, "x-timezone") || "unknown";
  const latitude = parseFloat(getHeaderValue(req, "x-latitude") || "0");
  const longitude = parseFloat(getHeaderValue(req, "x-longitude") || "0");
  const isp = getHeaderValue(req, "x-isp") || "unknown";
  const isVPN = getHeaderValue(req, "x-vpn") === "true" || knownVPNExitNodes.has(country);
  const isProxy = getHeaderValue(req, "x-proxy") === "true";
  const isTor = getHeaderValue(req, "x-tor") === "true";

  let riskScore = 0;
  if (HIGH_RISK_COUNTRIES.has(country)) riskScore += 40;
  if (isVPN) riskScore += 20;
  if (isProxy) riskScore += 25;
  if (isTor) riskScore += 30;
  if (!COMMON_COUNTRIES.has(country)) riskScore += 10;

  return {
    country,
    city,
    region,
    timezone,
    latitude,
    longitude,
    isp,
    isVPN,
    isProxy,
    isTor,
    riskScore: Math.min(riskScore, 100),
  };
}

export function detectGeoAnomalies(
  userId: string,
  current: GeoLocation
): GeoAnomaly[] {
  const anomalies: GeoAnomaly[] = [];
  const history = geoLogins.get(userId) || [];

  if (history.length > 0) {
    const lastLogin = history[history.length - 1];
    const timeDiff = Date.now() - lastLogin.timestamp;

    if (timeDiff < ANOMALY_THRESHOLD_MS && lastLogin.country !== current.country) {
      const distance = estimateDistance(
        lastLogin.latitude, lastLogin.longitude,
        current.latitude, current.longitude
      );
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const speed = hoursDiff > 0 ? distance / hoursDiff : Infinity;

      if (speed > IMPOSSIBLE_SPEED_KMH) {
        anomalies.push({
          type: "impossible_travel",
          severity: "high",
          description: `Impossible travel detected: ${distance.toFixed(0)}km in ${Math.round(timeDiff / 60000)} minutes`,
        });
      }
    }

    const knownCountries = new Set(history.map((h) => h.country));
    if (!knownCountries.has(current.country)) {
      anomalies.push({
        type: "new_country",
        severity: "medium",
        description: `Login from new country: ${current.country}`,
      });
    }
  }

  if (HIGH_RISK_COUNTRIES.has(current.country)) {
    anomalies.push({
      type: "high_risk_country",
      severity: "medium",
      description: `Login from high-risk country: ${current.country}`,
    });
  }

  if (current.isVPN) {
    anomalies.push({
      type: "vpn_detected",
      severity: "low",
      description: "VPN connection detected",
    });
  }

  if (current.isTor) {
    anomalies.push({
      type: "tor_detected",
      severity: "high",
      description: "Tor exit node detected",
    });
  }

  return anomalies;
}

export function recordLogin(userId: string, geo: GeoLocation, ip: string): void {
  const history = geoLogins.get(userId) || [];
  history.push({
    country: geo.country,
    city: geo.city,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timestamp: Date.now(),
    ip,
  });
  if (history.length > MAX_LOGIN_HISTORY) {
    history.splice(0, history.length - MAX_LOGIN_HISTORY);
  }
  geoLogins.set(userId, history);
}

export function getLoginHistory(userId: string): GeoLoginEntry[] {
  return geoLogins.get(userId) || [];
}

export function isSensitiveOperation(path: string): boolean {
  const sensitivePatterns = [
    "/api/portfolio",
    "/api/alerts",
    "/api/push",
    "/api/admin",
    "/api/security",
  ];
  return sensitivePatterns.some((p) => path.startsWith(p));
}

export function shouldBlockForSensitiveOp(geo: GeoLocation): boolean {
  if (geo.isTor) return true;
  if (HIGH_RISK_COUNTRIES.has(geo.country)) return true;
  if (geo.isVPN && geo.riskScore > 50) return true;
  return false;
}

export function getGeoStats() {
  let totalLogins = 0;
  const countryCounts: Record<string, number> = {};

  for (const [, history] of geoLogins) {
    totalLogins += history.length;
    for (const entry of history) {
      countryCounts[entry.country] = (countryCounts[entry.country] || 0) + 1;
    }
  }

  return {
    trackedUsers: geoLogins.size,
    totalLogins,
    countryDistribution: countryCounts,
    vpnExitNodes: knownVPNExitNodes.size,
  };
}

export function addVPNExitNode(country: string): void {
  knownVPNExitNodes.add(country);
}

export function removeVPNExitNode(country: string): void {
  knownVPNExitNodes.delete(country);
}
