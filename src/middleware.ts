import { NextRequest, NextResponse } from "next/server";

const BOT_USER_AGENTS = /curl|wget|python|gohttp|phantom|headless|puppeteer|playwright|selenium/i;

const HONEYPOT_PATHS = [
  "/wp-admin", "/wp-login.php", "/wp-content", "/wp-includes",
  "/.env", "/.git/config", "/.git/HEAD", "/phpmyadmin", "/phpMyAdmin",
  "/admin/config", "/debug", "/api/internal", "/api/debug", "/api/config",
  "/xmlrpc.php", "/wp-json", "/feed", "/rss",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

  // 1. Honeypot detection - trap bots
  if (HONEYPOT_PATHS.some(p => pathname.toLowerCase().startsWith(p))) {
    return NextResponse.json(
      { error: "Not Found", message: "This page does not exist" },
      { status: 404, headers: { "X-Content-Type-Options": "nosniff" } }
    );
  }

  // 2. Bot detection
  if (BOT_USER_AGENTS.test(ua)) {
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/news") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/initiate")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3. HTTP method enforcement on sensitive endpoints
  if (pathname === "/api/status" && req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // 4. Block common attack paths
  if (
    pathname.includes("../") ||
    pathname.includes("..%2f") ||
    pathname.includes("%2e%2e") ||
    pathname.includes("/etc/passwd") ||
    pathname.includes("/proc/self")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. API security headers
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }

  // 6. Clickjacking protection for pages
  if (!pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("X-Frame-Options", "DENY");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
