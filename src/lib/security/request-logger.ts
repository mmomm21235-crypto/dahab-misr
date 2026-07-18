export type LogLevel = "info" | "warn" | "error" | "debug";

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  contentLength?: number;
  userId?: string;
  level: LogLevel;
}

interface LogConfig {
  maxEntries: number;
  maskSensitiveFields: boolean;
  excludedPaths: string[];
}

declare global {
  var __requestLogs: RequestLogEntry[] | undefined;
  var __requestLogIdCounter: number | undefined;
}

const config: LogConfig = {
  maxEntries: 1000,
  maskSensitiveFields: true,
  excludedPaths: ["/api/health", "/_next/", "/favicon.ico"],
};

const requestLogs: RequestLogEntry[] = globalThis.__requestLogs ??= [];
let idCounter: number = globalThis.__requestLogIdCounter ??= 0;

const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "session",
  "creditCard",
  "ssn",
  "nationalId",
];

const SENSITIVE_PATH_PATTERNS = [
  /\/auth/i,
  /\/login/i,
  /\/signup/i,
  /\/register/i,
  /\/password/i,
  /\/token/i,
  /\/session/i,
];

function maskSensitiveValue(value: string): string {
  if (!config.maskSensitiveFields) return value;

  const sensitivePattern = new RegExp(
    `(${SENSITIVE_FIELDS.join("|")})\\s*[=:]\\s*["']?([^"'&\\s]+)["']?`,
    "gi"
  );

  return value.replace(sensitivePattern, (match, field) => {
    return `${field}=***`;
  });
}

function maskHeaders(headers: Headers): Record<string, string> {
  const masked: Record<string, string> = {};
  const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];

  headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      masked[key] = "***";
    } else {
      masked[key] = value;
    }
  });

  return masked;
}

export function createRequestLogger() {
  return async function logRequest(params: {
    method: string;
    path: string;
    status: number;
    responseTime: number;
    ip: string;
    userAgent: string;
    contentLength?: number;
    userId?: string;
    level?: LogLevel;
  }): Promise<void> {
    const level = params.level || (params.status >= 500 ? "error" : params.status >= 400 ? "warn" : "info");

    const entry: RequestLogEntry = {
      id: `log_${++idCounter}`,
      timestamp: Date.now(),
      method: params.method,
      path: params.path,
      status: params.status,
      responseTime: params.responseTime,
      ip: params.ip,
      userAgent: params.userAgent.slice(0, 200),
      contentLength: params.contentLength,
      userId: params.userId,
      level,
    };

    requestLogs.push(entry);

    if (requestLogs.length > config.maxEntries) {
      requestLogs.splice(0, requestLogs.length - config.maxEntries);
    }

    if (level === "error") {
      console.error(`[REQUEST ERROR] ${params.method} ${params.path} ${params.status} ${params.responseTime}ms`);
    } else if (level === "warn") {
      console.warn(`[REQUEST WARN] ${params.method} ${params.path} ${params.status} ${params.responseTime}ms`);
    }
  };
}

export function logRequestDirect(params: {
  method: string;
  path: string;
  status: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  contentLength?: number;
  userId?: string;
  level?: LogLevel;
}): void {
  const level = params.level || (params.status >= 500 ? "error" : params.status >= 400 ? "warn" : "info");

  const entry: RequestLogEntry = {
    id: `log_${++idCounter}`,
    timestamp: Date.now(),
    method: params.method,
    path: params.path,
    status: params.status,
    responseTime: params.responseTime,
    ip: params.ip,
    userAgent: params.userAgent.slice(0, 200),
    contentLength: params.contentLength,
    userId: params.userId,
    level,
  };

  requestLogs.push(entry);

  if (requestLogs.length > config.maxEntries) {
    requestLogs.splice(0, requestLogs.length - config.maxEntries);
  }
}

export function getRequestLogs(filters?: {
  method?: string;
  path?: string;
  status?: number;
  level?: LogLevel;
  ip?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): RequestLogEntry[] {
  let filtered = [...requestLogs];

  if (filters?.method) {
    filtered = filtered.filter((l) => l.method === filters.method);
  }
  if (filters?.path) {
    filtered = filtered.filter((l) => l.path.includes(filters.path!));
  }
  if (filters?.status) {
    filtered = filtered.filter((l) => l.status === filters.status);
  }
  if (filters?.level) {
    filtered = filtered.filter((l) => l.level === filters.level);
  }
  if (filters?.ip) {
    filtered = filtered.filter((l) => l.ip === filters.ip);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((l) => l.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((l) => l.timestamp <= filters.endDate!);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getRequestLogStats() {
  const now = Date.now();
  const last24h = requestLogs.filter((l) => now - l.timestamp < 24 * 60 * 60 * 1000);
  const last1h = requestLogs.filter((l) => now - l.timestamp < 60 * 60 * 1000);

  const avgResponseTime24h = last24h.length > 0
    ? last24h.reduce((acc, l) => acc + l.responseTime, 0) / last24h.length
    : 0;

  return {
    totalLogs: requestLogs.length,
    logs24h: last24h.length,
    logs1h: last1h.length,
    avgResponseTime24h: Math.round(avgResponseTime24h),
    errorRate24h: last24h.length > 0
      ? ((last24h.filter((l) => l.level === "error").length / last24h.length) * 100).toFixed(2)
      : "0",
    uniqueIPs24h: new Set(last24h.map((l) => l.ip)).size,
    topPaths: Object.entries(
      last24h.reduce(
        (acc, l) => {
          acc[l.path] = (acc[l.path] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    statusCodes: last24h.reduce(
      (acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    ),
  };
}

export function clearOldLogs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  const initialLength = requestLogs.length;

  const filtered = requestLogs.filter((l) => l.timestamp > cutoff);
  requestLogs.length = 0;
  requestLogs.push(...filtered);

  return initialLength - requestLogs.length;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "unknown";
}

export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  if (!config.maskSensitiveFields) return data;

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = "***";
    } else if (typeof value === "string") {
      masked[key] = maskSensitiveValue(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
