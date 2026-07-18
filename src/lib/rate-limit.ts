// Distributed-safe rate limiting using globalThis for serverless persistence
// In Vercel serverless, globalThis persists across invocations within the same instance
// For true distributed limiting, migrate to Upstash Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface SlidingWindowEntry {
  timestamps: number[];
}

declare global {
  var __rateLimitMap: Map<string, RateLimitEntry> | undefined;
  var __slidingWindowMap: Map<string, SlidingWindowEntry> | undefined;
}

const rateLimitMap: Map<string, RateLimitEntry> = globalThis.__rateLimitMap ??= new Map();
const slidingWindowMap: Map<string, SlidingWindowEntry> =
  globalThis.__slidingWindowMap ??= new Map();

// Cleanup old entries every 5 minutes to prevent memory leaks
declare global {
  var __rateLimitCleanup: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__rateLimitCleanup) {
  globalThis.__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
    for (const [key, entry] of slidingWindowMap) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 60 * 1000);
      if (entry.timestamps.length === 0) {
        slidingWindowMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  algorithm?: "fixed" | "sliding";
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const algorithm = config.algorithm || "fixed";

  if (algorithm === "sliding") {
    return checkSlidingWindowRateLimit(identifier, config);
  }

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

function checkSlidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = slidingWindowMap.get(identifier) || { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetTime = oldestInWindow + config.windowMs;
    slidingWindowMap.set(identifier, entry);
    return { allowed: false, remaining: 0, resetTime };
  }

  entry.timestamps.push(now);
  slidingWindowMap.set(identifier, entry);

  const resetTime = entry.timestamps.length > 0
    ? entry.timestamps[0] + config.windowMs
    : now + config.windowMs;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetTime,
  };
}

export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  return checkRateLimit(`user:${userId}`, config);
}

export function checkEndpointRateLimit(
  endpoint: string,
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  return checkRateLimit(`endpoint:${endpoint}:${ip}`, config);
}

export function checkCombinedRateLimit(
  ip: string,
  userId: string | null,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const ipResult = checkRateLimit(`ip:${ip}`, {
    ...config,
    maxRequests: config.maxRequests * 2,
  });
  if (!ipResult.allowed) {
    return ipResult;
  }

  if (userId) {
    const userResult = checkUserRateLimit(userId, config);
    if (!userResult.allowed) {
      return userResult;
    }
  }

  const endpointResult = checkEndpointRateLimit(endpoint, ip, {
    ...config,
    maxRequests: Math.ceil(config.maxRequests * 0.5),
  });
  return endpointResult;
}

export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

export function createRateLimitHeaders(
  result: { allowed: boolean; remaining: number; resetTime: number },
  config: RateLimitConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(result.resetTime),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    headers["Retry-After"] = String(retryAfter);
  }

  return headers;
}

export const RATE_LIMITS = {
  api: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many API requests", algorithm: "sliding" as const },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, message: "Too many auth attempts", algorithm: "sliding" as const },
  goldPrices: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many price requests" },
  push: { windowMs: 60 * 1000, maxRequests: 5, message: "Too many push requests" },
  portfolio: { windowMs: 60 * 1000, maxRequests: 20, message: "Too many portfolio requests" },
  news: { windowMs: 60 * 1000, maxRequests: 15, message: "Too many news requests" },
  shops: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many shop requests" },
  admin: { windowMs: 60 * 1000, maxRequests: 60, message: "Too many admin requests", algorithm: "sliding" as const },
  security: { windowMs: 60 * 1000, maxRequests: 10, message: "Too many security requests", algorithm: "sliding" as const },
  search: { windowMs: 60 * 1000, maxRequests: 20, message: "Too many search requests" },
  write: { windowMs: 60 * 1000, maxRequests: 10, message: "Too many write requests", algorithm: "sliding" as const },
  upload: { windowMs: 5 * 60 * 1000, maxRequests: 5, message: "Too many upload requests" },
  publicApi: { windowMs: 60 * 1000, maxRequests: 60, message: "Too many public API requests", algorithm: "sliding" as const },
  webhook: { windowMs: 60 * 1000, maxRequests: 100, message: "Too many webhook requests" },
};

export function getRateLimitStats() {
  return {
    fixedWindowEntries: rateLimitMap.size,
    slidingWindowEntries: slidingWindowMap.size,
    totalEntries: rateLimitMap.size + slidingWindowMap.size,
  };
}
