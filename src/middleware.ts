import { NextRequest, NextResponse } from "next/server";

const BLOCKED_PATHS = ["/api/admin", "/api/security", "/api/shops-admin"];
const BOT_USER_AGENTS = /bot|crawler|spider|scraper|curl|wget|python|gohttp/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";

  if (BOT_USER_AGENTS.test(ua) && !pathname.startsWith("/api/news")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pathname === "/api/status" || pathname.startsWith("/api/status/")) {
    if (req.method !== "GET") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }
  }

  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
