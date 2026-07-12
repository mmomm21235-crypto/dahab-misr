// Distributed-safe rate limiting using globalThis for serverless persistence
// In Vercel serverless, globalThis persists across invocations within the same instance
// For true distributed limiting, migrate to Upstash Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

declare global {
  var __rateLimitMap: Map<string, RateLimitEntry> | undefined;
}

const rateLimitMap: Map<string, RateLimitEntry> = globalThis.__rateLimitMap ??= new Map();

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
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
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

export const RATE_LIMITS = {
  api: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many API requests" },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, message: "Too many auth attempts" },
  goldPrices: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many price requests" },
  push: { windowMs: 60 * 1000, maxRequests: 5, message: "Too many push requests" },
  portfolio: { windowMs: 60 * 1000, maxRequests: 20, message: "Too many portfolio requests" },
  news: { windowMs: 60 * 1000, maxRequests: 15, message: "Too many news requests" },
  shops: { windowMs: 60 * 1000, maxRequests: 30, message: "Too many shop requests" },
};
