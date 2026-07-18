import { NextRequest } from "next/server";

const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_URL_LENGTH = 2048;
const MAX_HEADER_LENGTH = 8192;

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE|DECLARE|CAST|CONVERT|INTO|FROM|WHERE|HAVING|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET)\b)/i,
  /(--|#|\/\*|\*\/|;)/,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  /(CHAR\s*\(|CONCAT\s*\(|0x[0-9a-f]+)/i,
  /(\bWAITFOR\b\s+DELAY)/i,
  /(\bBENCHMARK\s*\()/i,
  /(\bSLEEP\s*\()/i,
  /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<link[\s>]/i,
  /<meta[\s>]/i,
  /data\s*:\s*text\/html/i,
  /vbscript\s*:/i,
  /expression\s*\(/i,
  /&#x?[0-9a-f]+;?/i,
  /<svg[\s>]+on\w+/i,
  /<img[\s>]+[^>]*onerror/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e/i,
  /%252e%252e/i,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\/proc\/self/,
  /\\windows\\system32/i,
  /~\//,
];

const HEADER_INJECTION_PATTERNS = [
  /\r\n/,
  /\n\r/,
  /%0d%0a/i,
  /%0a%0d/i,
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/,
];

const BLOCKED_CONTENT_TYPES = [
  "multipart/form-data",
  "application/x-www-form-urlencoded",
];

const ALLOWED_CONTENT_TYPES = [
  "application/json",
  "text/plain",
];

export interface FirewallResult {
  allowed: boolean;
  reason?: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface FirewallEvent {
  timestamp: number;
  ip: string;
  path: string;
  method: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
}

declare global {
  var __firewallEvents: FirewallEvent[] | undefined;
  var __firewallBlockedIPs: Map<string, { blockedAt: number; reason: string }> | undefined;
}

const firewallEvents: FirewallEvent[] = globalThis.__firewallEvents ??= [];
const blockedIPs: Map<string, { blockedAt: number; reason: string }> =
  globalThis.__firewallBlockedIPs ??= new Map();

const MAX_EVENTS = 1000;
const BLOCK_DURATION = 60 * 60 * 1000;

function recordEvent(event: FirewallEvent): void {
  firewallEvents.push(event);
  if (firewallEvents.length > MAX_EVENTS) {
    firewallEvents.splice(0, firewallEvents.length - MAX_EVENTS);
  }
}

function getParameterValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function detectSQLInjection(input: string): boolean {
  const decoded = getParameterValue(input);
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(decoded));
}

function detectXSS(input: string): boolean {
  const decoded = getParameterValue(input);
  return XSS_PATTERNS.some((pattern) => pattern.test(decoded));
}

function detectPathTraversal(input: string): boolean {
  const decoded = getParameterValue(input);
  return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(decoded));
}

function detectHeaderInjection(value: string): boolean {
  return HEADER_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

function checkBlockedIP(ip: string): boolean {
  const entry = blockedIPs.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.blockedAt > BLOCK_DURATION) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

function blockIP(ip: string, reason: string): void {
  blockedIPs.set(ip, { blockedAt: Date.now(), reason });
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function validateRequest(req: NextRequest): FirewallResult {
  const ip = getClientIp(req);

  if (checkBlockedIP(ip)) {
    return { allowed: false, reason: "IP is blocked", severity: "critical" };
  }

  const url = req.nextUrl;
  if (url.toString().length > MAX_URL_LENGTH) {
    const event: FirewallEvent = {
      timestamp: Date.now(),
      ip,
      path: url.pathname,
      method: req.method,
      reason: "URL too long",
      severity: "medium",
    };
    recordEvent(event);
    return { allowed: false, reason: "URL too long", severity: "medium" };
  }

  const sensitiveHeaders = ["x-forwarded-for", "x-real-ip", "x-forwarded-host", "x-forwarded-proto"];
  for (const header of sensitiveHeaders) {
    const value = req.headers.get(header);
    if (value && detectHeaderInjection(value)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: url.pathname,
        method: req.method,
        reason: `Header injection detected: ${header}`,
        severity: "high",
      };
      recordEvent(event);
      blockIP(ip, "Header injection");
      return { allowed: false, reason: "Header injection detected", severity: "high" };
    }
  }

  for (const [key, value] of req.headers.entries()) {
    if (key.startsWith("x-") && value.length > 1024) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: url.pathname,
        method: req.method,
        reason: `Oversized header: ${key}`,
        severity: "medium",
      };
      recordEvent(event);
      return { allowed: false, reason: "Header too large", severity: "medium" };
    }
  }

  for (const [key, value] of url.searchParams.entries()) {
    if (detectSQLInjection(value)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: url.pathname,
        method: req.method,
        reason: `SQL injection in query param: ${key}`,
        severity: "critical",
      };
      recordEvent(event);
      blockIP(ip, "SQL injection attempt");
      return { allowed: false, reason: "SQL injection detected", severity: "critical" };
    }

    if (detectXSS(value)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: url.pathname,
        method: req.method,
        reason: `XSS in query param: ${key}`,
        severity: "high",
      };
      recordEvent(event);
      blockIP(ip, "XSS attempt");
      return { allowed: false, reason: "XSS detected", severity: "high" };
    }

    if (detectPathTraversal(value)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: url.pathname,
        method: req.method,
        reason: `Path traversal in query param: ${key}`,
        severity: "high",
      };
      recordEvent(event);
      blockIP(ip, "Path traversal attempt");
      return { allowed: false, reason: "Path traversal detected", severity: "high" };
    }
  }

  if (detectPathTraversal(url.pathname)) {
    const event: FirewallEvent = {
      timestamp: Date.now(),
      ip,
      path: url.pathname,
      method: req.method,
      reason: "Path traversal in URL path",
      severity: "high",
    };
    recordEvent(event);
    blockIP(ip, "Path traversal attempt");
    return { allowed: false, reason: "Path traversal detected", severity: "high" };
  }

  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const contentType = req.headers.get("content-type") || "";
    if (!ALLOWED_CONTENT_TYPES.some((ct) => contentType.includes(ct))) {
      if (BLOCKED_CONTENT_TYPES.some((ct) => contentType.includes(ct))) {
        const event: FirewallEvent = {
          timestamp: Date.now(),
          ip,
          path: url.pathname,
          method: req.method,
          reason: `Blocked Content-Type: ${contentType}`,
          severity: "medium",
        };
        recordEvent(event);
        return { allowed: false, reason: "Content-Type not allowed", severity: "medium" };
      }
    }
  }

  return { allowed: true, severity: "low" };
}

export async function validateRequestBody(req: NextRequest): Promise<FirewallResult> {
  const ip = getClientIp(req);

  if (checkBlockedIP(ip)) {
    return { allowed: false, reason: "IP is blocked", severity: "critical" };
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    const event: FirewallEvent = {
      timestamp: Date.now(),
      ip,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: "Body too large",
      severity: "medium",
    };
    recordEvent(event);
    return { allowed: false, reason: "Request body too large", severity: "medium" };
  }

  try {
    const text = await req.clone().text();
    if (text.length > MAX_BODY_SIZE) {
      return { allowed: false, reason: "Request body too large", severity: "medium" };
    }

    if (detectSQLInjection(text)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: req.nextUrl.pathname,
        method: req.method,
        reason: "SQL injection in request body",
        severity: "critical",
      };
      recordEvent(event);
      blockIP(ip, "SQL injection in body");
      return { allowed: false, reason: "SQL injection detected in body", severity: "critical" };
    }

    if (detectXSS(text)) {
      const event: FirewallEvent = {
        timestamp: Date.now(),
        ip,
        path: req.nextUrl.pathname,
        method: req.method,
        reason: "XSS in request body",
        severity: "high",
      };
      recordEvent(event);
      blockIP(ip, "XSS in body");
      return { allowed: false, reason: "XSS detected in body", severity: "high" };
    }
  } catch {
    // Body parsing failed, let handler deal with it
  }

  return { allowed: true, severity: "low" };
}

export function getFirewallEvents(limit = 50): FirewallEvent[] {
  return firewallEvents.slice(-limit);
}

export function getBlockedIPs(): Array<{ ip: string; blockedAt: number; reason: string }> {
  const now = Date.now();
  const result: Array<{ ip: string; blockedAt: number; reason: string }> = [];
  for (const [ip, entry] of blockedIPs) {
    if (now - entry.blockedAt <= BLOCK_DURATION) {
      result.push({ ip, blockedAt: entry.blockedAt, reason: entry.reason });
    }
  }
  return result;
}

export function manualBlockIP(ip: string, reason: string): void {
  blockIP(ip, reason);
}

export function unblockIP(ip: string): boolean {
  return blockedIPs.delete(ip);
}

export function getFirewallStats() {
  const now = Date.now();
  let activeBlocks = 0;
  for (const [, entry] of blockedIPs) {
    if (now - entry.blockedAt <= BLOCK_DURATION) activeBlocks++;
  }

  const recentEvents = firewallEvents.filter(
    (e) => now - e.timestamp < 60 * 60 * 1000
  );

  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const event of recentEvents) {
    severityCounts[event.severity]++;
  }

  return {
    activeBlockedIPs: activeBlocks,
    totalEvents: firewallEvents.length,
    recentEventsCount: recentEvents.length,
    severityCounts,
  };
}
