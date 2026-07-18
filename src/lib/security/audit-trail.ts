import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export enum AuditAction {
  AUTH_LOGIN = "AUTH_LOGIN",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED",
  AUTH_TOKEN_REFRESH = "AUTH_TOKEN_REFRESH",
  AUTH_SESSION_CREATE = "AUTH_SESSION_CREATE",
  AUTH_SESSION_DESTROY = "AUTH_SESSION_DESTROY",

  DATA_READ = "DATA_READ",
  DATA_CREATE = "DATA_CREATE",
  DATA_UPDATE = "DATA_UPDATE",
  DATA_DELETE = "DATA_DELETE",
  DATA_EXPORT = "DATA_EXPORT",
  DATA_SEARCH = "DATA_SEARCH",

  ADMIN_USER_ACTION = "ADMIN_USER_ACTION",
  ADMIN_SYSTEM_ACTION = "ADMIN_SYSTEM_ACTION",
  ADMIN_CONFIG_CHANGE = "ADMIN_CONFIG_CHANGE",
  ADMIN_DATA_EXPORT = "ADMIN_DATA_EXPORT",

  SECURITY_SUSPICIOUS = "SECURITY_SUSPICIOUS",
  SECURITY_RATE_LIMIT = "SECURITY_RATE_LIMIT",
  SECURITY_BLOCK = "SECURITY_BLOCK",
  SECURITY_TOKEN_REUSE = "SECURITY_TOKEN_REUSE",
  SECURITY_SESSION_HIJACK = "SECURITY_SESSION_HIJACK",

  SHOP_VIEW = "SHOP_VIEW",
  SHOP_CREATE = "SHOP_CREATE",
  SHOP_UPDATE = "SHOP_UPDATE",
  SHOP_DELETE = "SHOP_DELETE",

  PORTFOLIO_VIEW = "PORTFOLIO_VIEW",
  PORTFOLIO_CREATE = "PORTFOLIO_CREATE",
  PORTFOLIO_UPDATE = "PORTFOLIO_UPDATE",
  PORTFOLIO_DELETE = "PORTFOLIO_DELETE",

  ALERT_CREATE = "ALERT_CREATE",
  ALERT_UPDATE = "ALERT_UPDATE",
  ALERT_DELETE = "ALERT_DELETE",
  ALERT_TRIGGER = "ALERT_TRIGGER",
}

interface AuditEntryData {
  action: AuditAction | string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

interface AuditEntryRecord {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  checksum: string;
  previousChecksum: string;
  createdAt: Date;
}

declare global {
  var __auditBuffer: AuditEntryData[] | undefined;
  var __lastAuditChecksum: string | undefined;
}

const auditBuffer: AuditEntryData[] = globalThis.__auditBuffer ??= [];
const BUFFER_FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 50;

let lastChecksum: string = globalThis.__lastAuditChecksum ??= "GENESIS";

function computeChecksum(entry: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  timestamp: string;
  previousChecksum: string;
}): string {
  const data = [
    entry.action,
    entry.entity,
    entry.entityId || "",
    entry.userId || "",
    entry.timestamp,
    entry.previousChecksum,
  ].join("|");

  return crypto.createHash("sha256").update(data).digest("hex");
}

async function flushBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return;

  const entries = auditBuffer.splice(0, MAX_BUFFER_SIZE);

  for (const entry of entries) {
    try {
      const timestamp = new Date().toISOString();
      const checksum = computeChecksum({
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        timestamp,
        previousChecksum: lastChecksum,
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `audit:${entry.action}:${timestamp}:${crypto.randomBytes(4).toString("hex")}`,
          token: JSON.stringify({
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId,
            userId: entry.userId,
            details: entry.details,
            ip: entry.ip,
            userAgent: entry.userAgent,
            sessionId: entry.sessionId,
            checksum,
            previousChecksum: lastChecksum,
          }),
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      lastChecksum = checksum;
      globalThis.__lastAuditChecksum = lastChecksum;
    } catch {
      // Re-add failed entries to buffer for retry
      auditBuffer.unshift(entry);
    }
  }
}

if (!globalThis.__auditInterval) {
  globalThis.__auditInterval = setInterval(flushBuffer, BUFFER_FLUSH_INTERVAL_MS);
}

declare global {
  var __auditInterval: ReturnType<typeof setInterval> | undefined;
}

export async function logAudit(entry: AuditEntryData): Promise<void> {
  auditBuffer.push(entry);

  if (auditBuffer.length >= MAX_BUFFER_SIZE) {
    await flushBuffer();
  }
}

export async function logAuthEvent(
  action: AuditAction,
  userId?: string,
  details?: Record<string, any>,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    action,
    entity: "auth",
    userId,
    details,
    ip,
    userAgent,
  });
}

export async function logDataAccess(
  action: AuditAction,
  entity: string,
  entityId: string,
  userId: string,
  details?: Record<string, any>,
  ip?: string
): Promise<void> {
  await logAudit({
    action,
    entity,
    entityId,
    userId,
    details,
    ip,
  });
}

export async function logAdminAction(
  action: AuditAction,
  details: Record<string, any>,
  userId: string,
  ip?: string
): Promise<void> {
  await logAudit({
    action,
    entity: "admin",
    userId,
    details,
    ip,
  });
}

export async function logSecurityEvent(
  action: AuditAction,
  details: Record<string, any>,
  ip?: string,
  userId?: string
): Promise<void> {
  await logAudit({
    action,
    entity: "security",
    userId,
    details,
    ip,
  });
}

export async function getAuditTrail(options: {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  entries: any[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { userId, action, entity, startDate, endDate, page = 1, pageSize = 50 } = options;

  const where: any = {};

  if (userId) where.identifier = { contains: userId };
  if (action) where.identifier = { contains: `audit:${action}` };
  if (entity) where.token = { contains: `"entity":"${entity}"` };
  if (startDate || endDate) {
    where.expires = {};
    if (startDate) where.expires.gte = new Date(startDate);
    if (endDate) where.expires.lte = new Date(endDate);
  }

  where.identifier = { startsWith: "audit:" };

  const [entries, total] = await Promise.all([
    prisma.verificationToken.findMany({
      where,
      orderBy: { expires: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.verificationToken.count({ where }),
  ]);

  const parsedEntries = entries
    .map((entry) => {
      try {
        const tokenData = JSON.parse(entry.token);
        const timestampPart = entry.identifier.replace("audit:", "").split(":").slice(1, -1).join(":");
        return {
          identifier: entry.identifier,
          ...tokenData,
          timestamp: timestampPart,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return {
    entries: parsedEntries,
    total,
    page,
    pageSize,
  };
}

export async function verifyAuditIntegrity(): Promise<{
  valid: boolean;
  brokenAt?: number;
  totalEntries: number;
}> {
  try {
    const entries = await prisma.verificationToken.findMany({
      where: { identifier: { startsWith: "audit:" } },
      orderBy: { expires: "asc" },
    });

    let previousChecksum = "GENESIS";

    for (let i = 0; i < entries.length; i++) {
      try {
        const tokenData = JSON.parse(entries[i].token);
        const expectedChecksum = computeChecksum({
          action: tokenData.action,
          entity: tokenData.entity,
          entityId: tokenData.entityId,
          userId: tokenData.userId,
          timestamp: entries[i].identifier.replace("audit:", "").split(":").slice(1).join(":"),
          previousChecksum,
        });

        if (tokenData.checksum !== expectedChecksum) {
          return {
            valid: false,
            brokenAt: i,
            totalEntries: entries.length,
          };
        }

        previousChecksum = tokenData.checksum;
      } catch {
        continue;
      }
    }

    return { valid: true, totalEntries: entries.length };
  } catch {
    return { valid: false, totalEntries: 0 };
  }
}

export async function exportAuditTrail(
  startDate?: string,
  endDate?: string,
  format: "json" | "csv" = "json"
): Promise<string> {
  const result = await getAuditTrail({
    startDate,
    endDate,
    pageSize: 10000,
  });

  if (format === "csv") {
    const headers = "Timestamp,Action,Entity,EntityId,UserId,IP,UserAgent,Checksum\n";
    const rows = result.entries
      .map((e) =>
        [
          e.timestamp,
          e.action,
          e.entity,
          e.entityId || "",
          e.userId || "",
          e.ip || "",
          e.userAgent || "",
          e.checksum || "",
        ].join(",")
      )
      .join("\n");
    return headers + rows;
  }

  return JSON.stringify(result.entries, null, 2);
}
