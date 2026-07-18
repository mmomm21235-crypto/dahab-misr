import { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse, createRateLimitHeaders } from "./rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { validateRequest, validateRequestBody } from "./security/api-firewall";
import { checkDDoSProtection } from "./security/ddos-protection";
import { checkHoneypot, createHoneypotResponse } from "./security/honeypot";

type RateLimitType = keyof typeof RATE_LIMITS;

interface SecurityOptions {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  validateBody?: (body: any) => { valid: boolean; error?: string };
  firewall?: boolean;
  ddos?: boolean;
  honeypot?: boolean;
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function withSecurity(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: SecurityOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const ip = getClientIp(req);

    if (options.honeypot !== false) {
      const honeypotResult = checkHoneypot(req);
      if (honeypotResult.isHoneypot) {
        if (honeypotResult.isBanned) {
          return new Response(
            JSON.stringify({ error: "Access denied" }),
            { status: 403 }
          );
        }
        return createHoneypotResponse();
      }
    }

    if (options.firewall !== false) {
      const firewallResult = validateRequest(req);
      if (!firewallResult.allowed) {
        return new Response(
          JSON.stringify({ error: "Request blocked" }),
          { status: 403 }
        );
      }

      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        const bodyResult = await validateRequestBody(req);
        if (!bodyResult.allowed) {
          return new Response(
            JSON.stringify({ error: bodyResult.reason || "Request blocked" }),
            { status: 403 }
          );
        }
      }
    }

    if (options.ddos !== false) {
      const ddosResult = checkDDoSProtection(req);
      if (!ddosResult.allowed) {
        const response = new Response(
          JSON.stringify({ error: ddosResult.reason || "Service unavailable" }),
          { status: 503 }
        );
        if (ddosResult.retryAfter) {
          response.headers.set("Retry-After", String(ddosResult.retryAfter));
        }
        return response;
      }
      if (ddosResult.throttled) {
        const response = new Response(
          JSON.stringify({ error: ddosResult.reason || "Request throttled" }),
          { status: 429 }
        );
        if (ddosResult.retryAfter) {
          response.headers.set("Retry-After", String(ddosResult.retryAfter));
        }
        return response;
      }
    }

    if (options.rateLimit) {
      const identifier = `${ip}:${options.rateLimit}`;
      const result = checkRateLimit(identifier, RATE_LIMITS[options.rateLimit]);
      if (!result.allowed) {
        return createRateLimitResponse(result.resetTime);
      }
    }

    if (options.requireAuth || options.requireAdmin) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      if (options.requireAdmin) {
        const { prisma } = await import("./db/prisma");
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail || !user || session.user.email !== adminEmail) {
          return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }
      }
    }

    if (options.validateBody && (req.method === "POST" || req.method === "PUT")) {
      try {
        const body = await req.clone().json();
        const validation = options.validateBody(body);
        if (!validation.valid) {
          return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
      }
    }

    return handler(req, context);
  };
}
