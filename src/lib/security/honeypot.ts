import { NextRequest } from "next/server";

const HONEYPOT_PATHS = new Set([
  "/api/internal",
  "/api/debug",
  "/api/config",
  "/api/health-internal",
  "/api/v1/debug",
  "/api/v1/config",
  "/api/v1/internal",
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.env.development",
  "/.env.staging",
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/xmlrpc.php",
  "/.git/config",
  "/.git/HEAD",
  "/.gitignore",
  "/robots.txt",
  "/sitemap.xml",
  "/admin.php",
  "/administrator",
  "/phpmyadmin",
  "/phpinfo.php",
  "/server-status",
  "/server-info",
  "/.htaccess",
  "/.htpasswd",
  "/backup",
  "/db",
  "/database",
  "/sql",
  "/dump",
  "/config.php",
  "/config.json",
  "/config.yml",
  "/config.yaml",
  "/web.config",
  "/crossdomain.xml",
  "/actuator",
  "/actuator/env",
  "/actuator/health",
  "/swagger",
  "/swagger-ui",
  "/api-docs",
  "/graphql",
  "/_debug",
  "/_profiler",
  "/trace",
  "/metrics",
  "/console",
  "/_console",
  "/debug/vars",
  "/debug/pprof",
  "/debug/requests",
]);

const HONEYPOT_QUERY_PATTERNS = [
  /debug=true/i,
  /admin=true/i,
  /verbose=true/i,
  /test=true/i,
  /dev=true/i,
];

declare global {
  var __honeypotHits: HoneypotHit[] | undefined;
  var __honeypotBans: Map<string, HoneypotBan> | undefined;
}

interface HoneypotHit {
  timestamp: number;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  query: string;
}

interface HoneypotBan {
  bannedAt: number;
  reason: string;
  hitCount: number;
}

const honeypotHits: HoneypotHit[] = globalThis.__honeypotHits ??= [];
const honeypotBans: Map<string, HoneypotBan> = globalThis.__honeypotBans ??= new Map();

const MAX_HITS = 500;
const AUTO_BAN_THRESHOLD = 3;
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

declare global {
  var __honeypotCleanup: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__honeypotCleanup) {
  globalThis.__honeypotCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, ban] of honeypotBans) {
      if (now - ban.bannedAt > BAN_DURATION_MS) {
        honeypotBans.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function recordHit(hit: HoneypotHit): void {
  honeypotHits.push(hit);
  if (honeypotHits.length > MAX_HITS) {
    honeypotHits.splice(0, honeypotHits.length - MAX_HITS);
  }
}

function banIP(ip: string, reason: string): void {
  const existing = honeypotBans.get(ip);
  honeypotBans.set(ip, {
    bannedAt: Date.now(),
    reason,
    hitCount: (existing?.hitCount || 0) + 1,
  });
}

export interface HoneypotCheckResult {
  isHoneypot: boolean;
  isBanned: boolean;
  shouldRespond: boolean;
}

export function checkHoneypot(req: NextRequest): HoneypotCheckResult {
  const ip = getClientIp(req);
  const path = req.nextUrl.pathname;
  const method = req.method;
  const userAgent = req.headers.get("user-agent") || "unknown";
  const query = req.nextUrl.search;

  const ban = honeypotBans.get(ip);
  if (ban && Date.now() - ban.bannedAt < BAN_DURATION_MS) {
    return {
      isHoneypot: true,
      isBanned: true,
      shouldRespond: true,
    };
  }
  if (ban) {
    honeypotBans.delete(ip);
  }

  if (HONEYPOT_PATHS.has(path)) {
    const hit: HoneypotHit = {
      timestamp: Date.now(),
      ip,
      path,
      method,
      userAgent,
      query,
    };
    recordHit(hit);

    const ipHits = honeypotHits.filter(
      (h) => h.ip === ip && Date.now() - h.timestamp < 60 * 60 * 1000
    );

    if (ipHits.length >= AUTO_BAN_THRESHOLD) {
      banIP(ip, `Honeypot access: ${path}`);
    }

    return {
      isHoneypot: true,
      isBanned: false,
      shouldRespond: true,
    };
  }

  for (const pattern of HONEYPOT_QUERY_PATTERNS) {
    for (const [, value] of req.nextUrl.searchParams.entries()) {
      if (pattern.test(value)) {
        const hit: HoneypotHit = {
          timestamp: Date.now(),
          ip,
          path,
          method,
          userAgent,
          query,
        };
        recordHit(hit);

        const ipHits = honeypotHits.filter(
          (h) => h.ip === ip && Date.now() - h.timestamp < 60 * 60 * 1000
        );

        if (ipHits.length >= AUTO_BAN_THRESHOLD) {
          banIP(ip, `Honeypot query param pattern`);
        }

        return {
          isHoneypot: true,
          isBanned: false,
          shouldRespond: true,
        };
      }
    }
  }

  return {
    isHoneypot: false,
    isBanned: false,
    shouldRespond: false,
  };
}

export function isIPBanned(ip: string): boolean {
  const ban = honeypotBans.get(ip);
  if (!ban) return false;
  if (Date.now() - ban.bannedAt > BAN_DURATION_MS) {
    honeypotBans.delete(ip);
    return false;
  }
  return true;
}

export function createHoneypotResponse(): Response {
  const fakeData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    data: {
      users: [
        { id: 1, email: "admin@example.com", role: "admin" },
        { id: 2, email: "user@example.com", role: "user" },
      ],
      config: {
        database: "postgresql://user:pass@localhost:5432/db",
        secret: "fake-secret-do-not-use",
        apiKey: "sk-fake-key-12345",
      },
    },
  };

  return new Response(JSON.stringify(fakeData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Honeypot": "true",
    },
  });
}

export function getHoneypotHits(limit = 50): HoneypotHit[] {
  return honeypotHits.slice(-limit);
}

export function getHoneypotBans(): Array<{ ip: string; bannedAt: number; reason: string; hitCount: number }> {
  const now = Date.now();
  const result: Array<{ ip: string; bannedAt: number; reason: string; hitCount: number }> = [];
  for (const [ip, ban] of honeypotBans) {
    if (now - ban.bannedAt < BAN_DURATION_MS) {
      result.push({ ip, bannedAt: ban.bannedAt, reason: ban.reason, hitCount: ban.hitCount });
    }
  }
  return result;
}

export function manualBanIP(ip: string, reason: string): void {
  banIP(ip, reason);
}

export function manualUnbanIP(ip: string): boolean {
  return honeypotBans.delete(ip);
}

export function getHoneypotStats() {
  const now = Date.now();
  const recentHits = honeypotHits.filter(
    (h) => now - h.timestamp < 60 * 60 * 1000
  );

  const pathCounts: Record<string, number> = {};
  for (const hit of recentHits) {
    pathCounts[hit.path] = (pathCounts[hit.path] || 0) + 1;
  }

  const uniqueIPs = new Set(recentHits.map((h) => h.ip));

  return {
    totalHits: honeypotHits.length,
    recentHits: recentHits.length,
    activeBans: honeypotBans.size,
    uniqueAttackingIPs: uniqueIPs.size,
    topPaths: pathCounts,
  };
}
