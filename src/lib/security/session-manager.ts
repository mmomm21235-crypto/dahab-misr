import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

const SESSION_ANOMALY_THRESHOLD = 5;
const ANOMALY_WINDOW_MS = 10 * 60 * 1000;

interface SessionFingerprint {
  ip: string;
  userAgent: string;
  acceptLanguage?: string;
  timestamp: number;
}

interface AnomalyRecord {
  count: number;
  firstSeen: number;
  events: string[];
}

declare global {
  var __sessionAnomalies: Map<string, AnomalyRecord> | undefined;
  var __sessionStore: Map<string, SessionFingerprint> | undefined;
}

const anomalyStore: Map<string, AnomalyRecord> =
  globalThis.__sessionAnomalies ??= new Map();
const sessionStore: Map<string, SessionFingerprint> =
  globalThis.__sessionStore ??= new Map();

function generateSessionFingerprint(data: {
  ip: string;
  userAgent: string;
  acceptLanguage?: string;
}): string {
  const payload = `${data.ip}:${data.userAgent}:${data.acceptLanguage || ""}:${Math.floor(Date.now() / 86400000)}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function createSessionFingerprint(req: {
  ip: string;
  userAgent: string;
  acceptLanguage?: string;
}): string {
  const fp: SessionFingerprint = {
    ip: req.ip,
    userAgent: req.userAgent,
    acceptLanguage: req.acceptLanguage,
    timestamp: Date.now(),
  };
  const id = generateSessionFingerprint(req);
  sessionStore.set(id, fp);
  return id;
}

export function validateSessionFingerprint(
  fingerprintId: string,
  req: { ip: string; userAgent: string; acceptLanguage?: string }
): { valid: boolean; reason?: string } {
  const stored = sessionStore.get(fingerprintId);
  if (!stored) {
    return { valid: false, reason: "Session not found" };
  }

  if (stored.userAgent !== req.userAgent) {
    recordAnomaly(fingerprintId, "USER_AGENT_CHANGE");
    return { valid: false, reason: "User agent mismatch" };
  }

  if (stored.ip !== req.ip) {
    recordAnomaly(fingerprintId, "IP_CHANGE");
    const ipClassChange =
      getIpClass(stored.ip) !== getIpClass(req.ip);
    if (ipClassChange) {
      return { valid: false, reason: "Network class change detected" };
    }
  }

  if (stored.acceptLanguage && req.acceptLanguage && stored.acceptLanguage !== req.acceptLanguage) {
    recordAnomaly(fingerprintId, "LANGUAGE_CHANGE");
  }

  stored.timestamp = Date.now();
  return { valid: true };
}

function getIpClass(ip: string): string {
  const parts = ip.split(".");
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return ip;
}

function recordAnomaly(sessionId: string, event: string) {
  const now = Date.now();
  const existing = anomalyStore.get(sessionId);

  if (!existing || now - existing.firstSeen > ANOMALY_WINDOW_MS) {
    anomalyStore.set(sessionId, {
      count: 1,
      firstSeen: now,
      events: [event],
    });
    return;
  }

  existing.count++;
  existing.events.push(event);
}

export async function checkSessionAnomaly(sessionId: string): Promise<{
  suspicious: boolean;
  shouldInvalidate: boolean;
  reason?: string;
}> {
  const record = anomalyStore.get(sessionId);
  if (!record) {
    return { suspicious: false, shouldInvalidate: false };
  }

  const now = Date.now();
  if (now - record.firstSeen > ANOMALY_WINDOW_MS) {
    anomalyStore.delete(sessionId);
    return { suspicious: false, shouldInvalidate: false };
  }

  if (record.count >= SESSION_ANOMALY_THRESHOLD) {
    return {
      suspicious: true,
      shouldInvalidate: true,
      reason: `${record.count} anomalies detected: ${record.events.slice(-3).join(", ")}`,
    };
  }

  if (record.count >= Math.floor(SESSION_ANOMALY_THRESHOLD / 2)) {
    return {
      suspicious: true,
      shouldInvalidate: false,
      reason: `${record.count} anomalies detected`,
    };
  }

  return { suspicious: false, shouldInvalidate: false };
}

export async function rotateSession(sessionToken: string): Promise<string | null> {
  try {
    const existing = await prisma.session.findUnique({
      where: { sessionToken },
    });
    if (!existing) return null;

    const newToken = crypto.randomBytes(32).toString("hex");
    const now = new Date();

    await prisma.session.update({
      where: { id: existing.id },
      data: {
        sessionToken: newToken,
        expires: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    sessionStore.delete(sessionToken);
    anomalyStore.delete(sessionToken);

    return newToken;
  } catch {
    return null;
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({ where: { userId } });

    for (const [key, fp] of sessionStore.entries()) {
      void fp;
      sessionStore.delete(key);
      anomalyStore.delete(key);
    }
  } catch {
    // Silently handle
  }
}

export async function invalidateSession(sessionToken: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { sessionToken },
    });
    sessionStore.delete(sessionToken);
    anomalyStore.delete(sessionToken);
  } catch {
    // Session may already be deleted
  }
}

export function extractRequestMeta(req: {
  headers: Record<string, string | undefined>;
  ip?: string;
}): { ip: string; userAgent: string; acceptLanguage?: string } {
  const ip =
    req.ip ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "unknown";
  const acceptLanguage = req.headers["accept-language"];

  return { ip, userAgent, acceptLanguage };
}

export function getSessionSecurityInfo() {
  return {
    activeSessions: sessionStore.size,
    trackedAnomalies: anomalyStore.size,
  };
}
