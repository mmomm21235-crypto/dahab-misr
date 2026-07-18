import { createHash, createHmac } from "crypto";

const APP_ID = "dahab-misr";
const APP_VERSION = "2.1.0";

// ── Project Identity ─────────────────────────────────────────────────

export interface ProjectIdentity {
  id: string;
  version: string;
  name: string;
  owner: string;
  createdAt: string;
}

const PROJECT_IDENTITY: ProjectIdentity = {
  id: APP_ID,
  version: APP_VERSION,
  name: "ذهب مصر - Dahab Misr",
  owner: "Dahab Misr",
  createdAt: "2026-01-01",
};

// ── Authorized Domains ───────────────────────────────────────────────

const AUTHORIZED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "dahab-misr.com",
  "www.dahab-misr.com",
  "dahabmisr.vercel.app",
];

function getAuthorizedDomains(): string[] {
  const envDomains = process.env.AUTHORIZED_DOMAINS;
  if (envDomains) {
    return [...AUTHORIZED_DOMAINS, ...envDomains.split(",").map((d) => d.trim())];
  }
  return AUTHORIZED_DOMAINS;
}

// ── Runtime License Validation ───────────────────────────────────────

const LICENSE_KEY = process.env.APP_LICENSE_KEY || "";

function computeLicenseHash(): string {
  const payload = `${APP_ID}:${APP_VERSION}:${LICENSE_KEY}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function verifyLicense(): boolean {
  if (!LICENSE_KEY) {
    return true;
  }

  const expectedHash = process.env.LICENSE_HASH;
  if (!expectedHash) return true;

  const actualHash = computeLicenseHash();
  return actualHash === expectedHash;
}

export function getLicenseStatus(): LicenseStatus {
  const verified = verifyLicense();
  const isDevelopment = process.env.NODE_ENV !== "production";

  return {
    valid: verified || isDevelopment,
    licensed: !!LICENSE_KEY,
    projectId: APP_ID,
    version: APP_VERSION,
    checkedAt: new Date().toISOString(),
  };
}

// ── Domain Verification ──────────────────────────────────────────────

export function isAuthorizedDomain(hostname: string): boolean {
  const domains = getAuthorizedDomains();

  for (const domain of domains) {
    if (hostname === domain) return true;
    if (domain.includes("*")) {
      const pattern = domain.replace(/\*/g, ".*");
      if (new RegExp(`^${pattern}$`).test(hostname)) return true;
    }
  }

  return false;
}

export function verifyRequestDomain(req: { headers: { get: (h: string) => string | null } }): DomainVerification {
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  const requestHost = host.split(":")[0];
  const authorized = isAuthorizedDomain(requestHost);

  let originAuthorized = true;
  if (origin) {
    try {
      const originUrl = new URL(origin);
      originAuthorized = isAuthorizedDomain(originUrl.hostname);
    } catch {
      originAuthorized = false;
    }
  }

  let refererAuthorized = true;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      refererAuthorized = isAuthorizedDomain(refererUrl.hostname);
    } catch {
      refererAuthorized = false;
    }
  }

  return {
    authorized,
    originAuthorized,
    refererAuthorized,
    hostname: requestHost,
    isSecure: !["localhost", "127.0.0.1"].includes(requestHost),
  };
}

// ── Tamper Detection ─────────────────────────────────────────────────

export function detectTampering(): TamperDetectionResult {
  const issues: string[] = [];

  if (typeof window !== "undefined") {
    if (window.location.hostname !== window.location.hostname.toLowerCase()) {
      issues.push("Hostname contains unusual characters");
    }

    const scripts = document.querySelectorAll("script[src]");
    scripts.forEach((script) => {
      const src = script.getAttribute("src");
      if (src && !src.startsWith("/") && !src.includes(window.location.hostname)) {
        issues.push(`External script detected: ${src}`);
      }
    });
  }

  return {
    tampered: issues.length > 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

// ── App Info ─────────────────────────────────────────────────────────

export function getAppInfo() {
  return {
    id: APP_ID,
    version: APP_VERSION,
    licensed: !!LICENSE_KEY,
    identity: PROJECT_IDENTITY,
    timestamp: new Date().toISOString(),
  };
}

// ── Console Watermark ────────────────────────────────────────────────

export function printWatermark() {
  if (typeof window !== "undefined") {
    console.log(
      "%cذهب مصر - Dahab Misr",
      "color: #f59e0b; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
    );
    console.log(
      "%c© 2026 ذهب مصر. All rights reserved.",
      "color: #888; font-size: 12px;"
    );
    console.log(
      "%cUnauthorized copying or distribution of this application is prohibited.",
      "color: #ef4444; font-size: 11px;"
    );
  }
}

// ── Types ────────────────────────────────────────────────────────────

interface LicenseStatus {
  valid: boolean;
  licensed: boolean;
  projectId: string;
  version: string;
  checkedAt: string;
}

interface DomainVerification {
  authorized: boolean;
  originAuthorized: boolean;
  refererAuthorized: boolean;
  hostname: string;
  isSecure: boolean;
}

interface TamperDetectionResult {
  tampered: boolean;
  issues: string[];
  checkedAt: string;
}

export type { LicenseStatus, DomainVerification, TamperDetectionResult };
