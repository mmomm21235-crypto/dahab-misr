import { NextRequest } from "next/server";
import { createHash } from "crypto";

// ── Bot Detection ────────────────────────────────────────────────────

const KNOWN_BOT_USER_AGENTS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /facebookexternalhit/i,
  /ia_archiver/i,
  /alexabot/i,
  /mj12bot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /dotbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest/i,
  /slackbot/i,
  /vkShare/i,
  /W3C_Validator/i,
  /whatsapp/i,
  /flipboard/i,
  /tumblr/i,
  /bitlybot/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /discordbot/i,
  /qwantify/i,
  /pinterestbot/i,
  /bitrix link preview/i,
  /xing-contenttabreceiver/i,
  /chrome-lighthouse/i,
  /telegrambot/i,
  /seznambot/i,
  /crawler/i,
  /spider/i,
];

const HEADLESS_BROWSER_PATTERNS = [
  /headless/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /SlimerJS/i,
  /Nightmare/i,
  /Electron/i,
];

export interface BotDetectionResult {
  isBot: boolean;
  isHeadless: boolean;
  isKnownBot: boolean;
  reason?: string;
}

export function detectBot(userAgent: string | null): BotDetectionResult {
  if (!userAgent) {
    return { isBot: true, isHeadless: false, isKnownBot: false, reason: "No user agent" };
  }

  for (const pattern of HEADLESS_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      return {
        isBot: true,
        isHeadless: true,
        isKnownBot: false,
        reason: `Headless browser detected: ${pattern.source}`,
      };
    }
  }

  for (const pattern of KNOWN_BOT_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return {
        isBot: true,
        isHeadless: false,
        isKnownBot: true,
        reason: `Known bot: ${pattern.source}`,
      };
    }
  }

  return { isBot: false, isHeadless: false, isKnownBot: false };
}

// ── Browser Fingerprinting ───────────────────────────────────────────

export interface BrowserFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  accept: string;
  platform: string;
  connection: string;
  headers: Record<string, string>;
  hash: string;
}

export function createFingerprint(req: NextRequest): BrowserFingerprint {
  const headers: Record<string, string> = {};
  const importantHeaders = [
    "user-agent",
    "accept-language",
    "accept-encoding",
    "accept",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "sec-fetch-dest",
    "sec-fetch-mode",
    "sec-fetch-site",
    "connection",
  ];

  for (const h of importantHeaders) {
    const value = req.headers.get(h) || "";
    headers[h] = value;
  }

  const raw = [
    req.headers.get("user-agent") || "",
    req.headers.get("accept-language") || "",
    req.headers.get("accept-encoding") || "",
    req.headers.get("sec-ch-ua") || "",
  ].join("|");

  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);

  return {
    userAgent: req.headers.get("user-agent") || "",
    acceptLanguage: req.headers.get("accept-language") || "",
    acceptEncoding: req.headers.get("accept-encoding") || "",
    accept: req.headers.get("accept") || "",
    platform: req.headers.get("sec-ch-ua-platform") || "",
    connection: req.headers.get("connection") || "",
    headers,
    hash,
  };
}

// ── Honeypot Endpoints ──────────────────────────────────────────────

const HONEYPOT_PATHS = [
  "/admin/config",
  "/wp-admin",
  "/.env",
  "/.git/config",
  "/phpmyadmin",
  "/admin/login",
  "/xmlrpc.php",
  "/wp-login.php",
  "/debug",
  "/trace",
  "/.well-known/security.txt",
];

export function isHoneypotPath(pathname: string): boolean {
  return HONEYPOT_PATHS.some(
    (hp) => pathname === hp || pathname.startsWith(hp + "/")
  );
}

// ── Iframe / Clickjacking Detection ─────────────────────────────────

export function detectIframe(req: NextRequest): boolean {
  const secFetchDest = req.headers.get("sec-fetch-dest");
  if (secFetchDest === "iframe" || secFetchDest === "subframe") {
    return true;
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const host = req.headers.get("host") || "";
      if (refererUrl.host !== host) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

// ── Request Pattern Analysis ─────────────────────────────────────────

interface RequestPattern {
  path: string;
  method: string;
  timestamp: number;
}

declare global {
  var __requestPatterns: Map<string, RequestPattern[]> | undefined;
}

const requestPatterns: Map<string, RequestPattern[]> =
  globalThis.__requestPatterns ??= new Map();

const PATTERN_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

export function trackRequestPattern(ip: string, path: string, method: string): boolean {
  const now = Date.now();
  const patterns = requestPatterns.get(ip) || [];

  const recent = patterns.filter((p) => now - p.timestamp < PATTERN_WINDOW);
  recent.push({ path, method, timestamp: now });
  requestPatterns.set(ip, recent);

  if (recent.length > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  const uniquePaths = new Set(recent.map((p) => p.path));
  if (uniquePaths.size > 20 && recent.length > 40) {
    return true;
  }

  return false;
}

export function cleanupPatterns(): void {
  const now = Date.now();
  for (const [ip, patterns] of requestPatterns) {
    const recent = patterns.filter((p) => now - p.timestamp < PATTERN_WINDOW);
    if (recent.length === 0) {
      requestPatterns.delete(ip);
    } else {
      requestPatterns.set(ip, recent);
    }
  }
}

// ── Comprehensive Anti-Scraping Check ────────────────────────────────

export interface AntiScrapingResult {
  blocked: boolean;
  reason?: string;
  isBot: boolean;
  isHeadless: boolean;
  isKnownBot: boolean;
  isHoneypot: boolean;
  isIframe: boolean;
  isSuspiciousPattern: boolean;
}

export function checkAntiScraping(req: NextRequest): AntiScrapingResult {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const pathname = new URL(req.url).pathname;

  if (isHoneypotPath(pathname)) {
    return {
      blocked: true,
      reason: "Honeypot trap triggered",
      isBot: true,
      isHeadless: false,
      isKnownBot: false,
      isHoneypot: true,
      isIframe: false,
      isSuspiciousPattern: false,
    };
  }

  const botResult = detectBot(req.headers.get("user-agent"));

  const isIframe = detectIframe(req);

  const isSuspicious = trackRequestPattern(ip, pathname, req.method);

  return {
    blocked: botResult.isHeadless || isSuspicious,
    reason: botResult.isHeadless
      ? botResult.reason
      : isSuspicious
        ? "Suspicious request pattern"
        : undefined,
    isBot: botResult.isBot,
    isHeadless: botResult.isHeadless,
    isKnownBot: botResult.isKnownBot,
    isHoneypot: false,
    isIframe,
    isSuspiciousPattern: isSuspicious,
  };
}

// ── Honeypot Response ───────────────────────────────────────────────

export function createHoneypotResponse(): Response {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Access granted",
      debug: {
        server: "nginx/1.18.0",
        php: "8.1.2",
        database: "mysql",
        config: {
          db_host: "127.0.0.1",
          db_user: "admin",
          db_pass: "xxxxxxxx",
          api_key: "xxxxxxxxxxxxxxxxxxxxxxxx",
        },
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Honeypot": "true",
        "Cache-Control": "no-store",
      },
    }
  );
}
