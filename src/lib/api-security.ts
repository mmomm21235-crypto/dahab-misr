import { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse } from "./rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

type RateLimitType = keyof typeof RATE_LIMITS;

interface SecurityOptions {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  validateBody?: (body: any) => { valid: boolean; error?: string };
}

export function withSecurity(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: SecurityOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    if (options.rateLimit) {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
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
        const adminEmail = process.env.ADMIN_EMAIL || "mmomm21235@gmail.com";
        if (!user || session.user.email !== adminEmail) {
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
