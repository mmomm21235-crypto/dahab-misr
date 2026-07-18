export type SecurityEventType =
  | "failed_login"
  | "brute_force"
  | "unauthorized_access"
  | "suspicious_api_usage"
  | "data_exfiltration"
  | "account_compromised"
  | "ip_blocked"
  | "rate_limit_exceeded";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  ip: string;
  userId?: string;
  path: string;
  method: string;
  userAgent: string;
  details: string;
  timestamp: number;
  resolved: boolean;
}

interface SecurityThreshold {
  count: number;
  windowMs: number;
  severity: SecuritySeverity;
}

const ALERT_THRESHOLDS: Record<SecurityEventType, SecurityThreshold> = {
  failed_login: { count: 5, windowMs: 15 * 60 * 1000, severity: "medium" },
  brute_force: { count: 10, windowMs: 10 * 60 * 1000, severity: "high" },
  unauthorized_access: { count: 3, windowMs: 30 * 60 * 1000, severity: "high" },
  suspicious_api_usage: { count: 20, windowMs: 5 * 60 * 1000, severity: "medium" },
  data_exfiltration: { count: 1, windowMs: 60 * 60 * 1000, severity: "critical" },
  account_compromised: { count: 1, windowMs: 60 * 60 * 1000, severity: "critical" },
  ip_blocked: { count: 1, windowMs: 0, severity: "high" },
  rate_limit_exceeded: { count: 1, windowMs: 0, severity: "low" },
};

declare global {
  var __securityEvents: SecurityEvent[] | undefined;
  var __securityEventCounters: Map<string, { count: number; windowStart: number }> | undefined;
  var __securityAlerts: SecurityAlert[] | undefined;
}

const MAX_EVENTS = 1000;
const MAX_ALERTS = 500;

const events: SecurityEvent[] = globalThis.__securityEvents ??= [];
const eventCounters: Map<string, { count: number; windowStart: number }> =
  globalThis.__securityEventCounters ??= new Map();
const alerts: SecurityAlert[] = globalThis.__securityAlerts ??= [];

export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  ip: string;
  userId?: string;
  triggeredAt: number;
  acknowledged: boolean;
  eventCount: number;
}

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function checkThreshold(type: SecurityEventType, ip: string): boolean {
  const threshold = ALERT_THRESHOLDS[type];
  const key = `${type}:${ip}`;
  const now = Date.now();
  const counter = eventCounters.get(key);

  if (!counter || now - counter.windowStart > threshold.windowMs) {
    eventCounters.set(key, { count: 1, windowStart: now });
    return false;
  }

  counter.count++;
  return counter.count >= threshold.count;
}

function createAlert(
  type: SecurityEventType,
  severity: SecuritySeverity,
  ip: string,
  userId: string | undefined,
  message: string,
  eventCount: number
): void {
  const alert: SecurityAlert = {
    id: generateAlertId(),
    type,
    severity,
    message,
    ip,
    userId,
    triggeredAt: Date.now(),
    acknowledged: false,
    eventCount,
  };

  alerts.push(alert);
  if (alerts.length > MAX_ALERTS) {
    alerts.splice(0, alerts.length - MAX_ALERTS);
  }

  if (severity === "critical" || severity === "high") {
    console.error(`[SECURITY ${severity.toUpperCase()}] ${message}`, {
      type,
      ip,
      userId,
      eventCount,
    });
  }
}

export async function trackSecurityEvent(params: {
  type: SecurityEventType;
  ip: string;
  userId?: string;
  path: string;
  method: string;
  userAgent: string;
  details: string;
  severity?: SecuritySeverity;
}): Promise<void> {
  const severity = params.severity ?? ALERT_THRESHOLDS[params.type].severity;

  const event: SecurityEvent = {
    id: generateId(),
    type: params.type,
    severity,
    ip: params.ip,
    userId: params.userId,
    path: params.path,
    method: params.method,
    userAgent: params.userAgent,
    details: params.details,
    timestamp: Date.now(),
    resolved: false,
  };

  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  if (checkThreshold(params.type, params.ip)) {
    const counterKey = `${params.type}:${params.ip}`;
    const counter = eventCounters.get(counterKey);
    const count = counter?.count ?? 1;

    createAlert(
      params.type,
      severity,
      params.ip,
      params.userId,
      `${params.type} detected from ${params.ip}: ${params.details} (${count} occurrences)`,
      count
    );

    if (params.type === "data_exfiltration" || params.type === "account_compromised") {
      const { blockIP } = await import("./ip-block");
      blockIP(params.ip);
    }
  }
}

export function getSecurityEvents(filters?: {
  type?: SecurityEventType;
  severity?: SecuritySeverity;
  ip?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): SecurityEvent[] {
  let filtered = [...events];

  if (filters?.type) {
    filtered = filtered.filter((e) => e.type === filters.type);
  }
  if (filters?.severity) {
    filtered = filtered.filter((e) => e.severity === filters.severity);
  }
  if (filters?.ip) {
    filtered = filtered.filter((e) => e.ip === filters.ip);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getSecurityAlerts(filters?: {
  severity?: SecuritySeverity;
  acknowledged?: boolean;
  limit?: number;
}): SecurityAlert[] {
  let filtered = [...alerts];

  if (filters?.severity) {
    filtered = filtered.filter((a) => a.severity === filters.severity);
  }
  if (filters?.acknowledged !== undefined) {
    filtered = filtered.filter((a) => a.acknowledged === filters.acknowledged);
  }

  filtered.sort((a, b) => b.triggeredAt - a.triggeredAt);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function resolveEvent(eventId: string): boolean {
  const event = events.find((e) => e.id === eventId);
  if (event) {
    event.resolved = true;
    return true;
  }
  return false;
}

export function getSecurityStats() {
  const now = Date.now();
  const last24h = events.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);
  const last1h = events.filter((e) => now - e.timestamp < 60 * 60 * 1000);

  return {
    totalEvents: events.length,
    events24h: last24h.length,
    events1h: last1h.length,
    unresolvedEvents: events.filter((e) => !e.resolved).length,
    unacknowledgedAlerts: alerts.filter((a) => !a.acknowledged).length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length,
    highAlerts: alerts.filter((a) => a.severity === "high" && !a.acknowledged).length,
    eventsByType: events.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      },
      {} as Record<SecurityEventType, number>
    ),
    eventsBySeverity: events.reduce(
      (acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      },
      {} as Record<SecuritySeverity, number>
    ),
    uniqueIPs24h: new Set(last24h.map((e) => e.ip)).size,
  };
}
