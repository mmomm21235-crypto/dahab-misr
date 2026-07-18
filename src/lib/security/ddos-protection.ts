import { NextRequest } from "next/server";

const CONNECTION_WINDOW_MS = 60 * 1000;
const MAX_CONNECTIONS_PER_IP = 100;
const THROTTLE_WINDOW_MS = 5 * 60 * 1000;
const THROTTLE_MULTIPLIER = 0.5;
const PATTERN_WINDOW_MS = 10 * 1000;
const PATTERN_THRESHOLD = 50;
const BLOCK_THRESHOLD = 200;
const BLOCK_DURATION_MS = 30 * 60 * 1000;

declare global {
  var __ddosConnections: Map<string, DDoSConnectionEntry> | undefined;
  var __ddosPatterns: Map<string, DDoSPatternEntry> | undefined;
  var __ddosThrottled: Map<string, DDoSThrottleEntry> | undefined;
  var __ddosBlocked: Map<string, number> | undefined;
  var __ddosStats: DDoSStatsEntry | undefined;
}

interface DDoSConnectionEntry {
  count: number;
  windowStart: number;
}

interface DDoSPatternEntry {
  timestamps: number[];
  lastCleanup: number;
}

interface DDoSThrottleEntry {
  level: number;
  expiresAt: number;
}

interface DDoSStatsEntry {
  totalRequests: number;
  blockedRequests: number;
  throttledRequests: number;
  peakRPM: number;
  currentRPM: number;
  lastRPCCalculation: number;
  requestTimestamps: number[];
}

const connections: Map<string, DDoSConnectionEntry> =
  globalThis.__ddosConnections ??= new Map();
const patterns: Map<string, DDoSPatternEntry> =
  globalThis.__ddosPatterns ??= new Map();
const throttled: Map<string, DDoSThrottleEntry> =
  globalThis.__ddosThrottled ??= new Map();
const blocked: Map<string, number> =
  globalThis.__ddosBlocked ??= new Map();
const stats: DDoSStatsEntry = globalThis.__ddosStats ??= {
  totalRequests: 0,
  blockedRequests: 0,
  throttledRequests: 0,
  peakRPM: 0,
  currentRPM: 0,
  lastRPCCalculation: Date.now(),
  requestTimestamps: [],
};

declare global {
  var __ddosCleanup: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__ddosCleanup) {
  globalThis.__ddosCleanup = setInterval(() => {
    const now = Date.now();

    for (const [ip, entry] of connections) {
      if (now - entry.windowStart > CONNECTION_WINDOW_MS) {
        connections.delete(ip);
      }
    }

    for (const [ip, entry] of patterns) {
      if (now - entry.lastCleanup > PATTERN_WINDOW_MS) {
        patterns.delete(ip);
      }
    }

    for (const [ip, entry] of throttled) {
      if (now > entry.expiresAt) {
        throttled.delete(ip);
      }
    }

    for (const [ip, blockedAt] of blocked) {
      if (now - blockedAt > BLOCK_DURATION_MS) {
        blocked.delete(ip);
      }
    }

    stats.requestTimestamps = stats.requestTimestamps.filter(
      (t) => now - t < 60 * 1000
    );
  }, 30 * 1000);
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export interface DDoSResult {
  allowed: boolean;
  throttled: boolean;
  retryAfter?: number;
  reason?: string;
}

function calculateRPM(): number {
  const now = Date.now();
  if (now - stats.lastRPCCalculation < 10000) {
    return stats.currentRPM;
  }

  const oneMinuteAgo = now - 60 * 1000;
  stats.requestTimestamps = stats.requestTimestamps.filter((t) => t > oneMinuteAgo);
  stats.currentRPM = stats.requestTimestamps.length;

  if (stats.currentRPM > stats.peakRPM) {
    stats.peakRPM = stats.currentRPM;
  }

  stats.lastRPCCalculation = now;
  return stats.currentRPM;
}

export function checkDDoSProtection(req: NextRequest): DDoSResult {
  const ip = getClientIp(req);
  const now = Date.now();

  stats.totalRequests++;
  stats.requestTimestamps.push(now);

  const blockedUntil = blocked.get(ip);
  if (blockedUntil) {
    if (now - blockedUntil < BLOCK_DURATION_MS) {
      stats.blockedRequests++;
      const retryAfter = Math.ceil((BLOCK_DURATION_MS - (now - blockedUntil)) / 1000);
      return {
        allowed: false,
        throttled: false,
        retryAfter,
        reason: "IP temporarily blocked due to DDoS activity",
      };
    }
    blocked.delete(ip);
  }

  const connEntry = connections.get(ip);
  if (!connEntry || now - connEntry.windowStart > CONNECTION_WINDOW_MS) {
    connections.set(ip, { count: 1, windowStart: now });
  } else {
    connEntry.count++;
    if (connEntry.count > BLOCK_THRESHOLD) {
      blocked.set(ip, now);
      stats.blockedRequests++;
      return {
        allowed: false,
        throttled: false,
        retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000),
        reason: "Connection limit exceeded - IP blocked",
      };
    }
    if (connEntry.count > MAX_CONNECTIONS_PER_IP) {
      const throttleEntry = throttled.get(ip);
      const level = throttleEntry ? throttleEntry.level + 1 : 1;
      const throttleDuration = THROTTLE_WINDOW_MS * Math.pow(THROTTLE_MULTIPLIER, level - 1);

      throttled.set(ip, {
        level,
        expiresAt: now + throttleDuration,
      });

      stats.throttledRequests++;
      return {
        allowed: true,
        throttled: true,
        retryAfter: Math.ceil(throttleDuration / 1000),
        reason: "Request throttled due to high connection rate",
      };
    }
  }

  const patternEntry = patterns.get(ip);
  if (!patternEntry) {
    patterns.set(ip, { timestamps: [now], lastCleanup: now });
  } else {
    patternEntry.timestamps.push(now);
    patternEntry.lastCleanup = now;

    const recentTimestamps = patternEntry.timestamps.filter(
      (t) => now - t < PATTERN_WINDOW_MS
    );
    patternEntry.timestamps = recentTimestamps;

    if (recentTimestamps.length > PATTERN_THRESHOLD) {
      blocked.set(ip, now);
      stats.blockedRequests++;
      return {
        allowed: false,
        throttled: false,
        retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000),
        reason: "Suspicious request pattern detected",
      };
    }
  }

  const rpm = calculateRPM();
  if (rpm > 1000) {
    const throttleEntry = throttled.get(ip);
    if (!throttleEntry || now > throttleEntry.expiresAt) {
      throttled.set(ip, {
        level: 1,
        expiresAt: now + THROTTLE_WINDOW_MS,
      });
      stats.throttledRequests++;
      return {
        allowed: true,
        throttled: true,
        retryAfter: Math.ceil(THROTTLE_WINDOW_MS / 1000),
        reason: "System under high load - request throttled",
      };
    }
  }

  const throttleEntry = throttled.get(ip);
  if (throttleEntry && now < throttleEntry.expiresAt) {
    stats.throttledRequests++;
    return {
      allowed: true,
      throttled: true,
      retryAfter: Math.ceil((throttleEntry.expiresAt - now) / 1000),
      reason: "Request throttled",
    };
  }

  return { allowed: true, throttled: false };
}

export function getDDoSStats() {
  const rpm = calculateRPM();
  return {
    totalRequests: stats.totalRequests,
    blockedRequests: stats.blockedRequests,
    throttledRequests: stats.throttledRequests,
    peakRPM: stats.peakRPM,
    currentRPM: rpm,
    activeConnections: connections.size,
    blockedIPs: blocked.size,
    throttledIPs: throttled.size,
  };
}

export function manualThrottleIP(ip: string, durationMs: number): void {
  throttled.set(ip, {
    level: 1,
    expiresAt: Date.now() + durationMs,
  });
}

export function manualBlockIP(ip: string): void {
  blocked.set(ip, Date.now());
}

export function manualUnblockIP(ip: string): boolean {
  return blocked.delete(ip);
}

export function getActiveConnections(): Array<{ ip: string; count: number; windowStart: number }> {
  const result: Array<{ ip: string; count: number; windowStart: number }> = [];
  for (const [ip, entry] of connections) {
    result.push({ ip, count: entry.count, windowStart: entry.windowStart });
  }
  return result;
}

export function getThrottledIPs(): Array<{ ip: string; level: number; expiresAt: number }> {
  const now = Date.now();
  const result: Array<{ ip: string; level: number; expiresAt: number }> = [];
  for (const [ip, entry] of throttled) {
    if (now < entry.expiresAt) {
      result.push({ ip, level: entry.level, expiresAt: entry.expiresAt });
    }
  }
  return result;
}
