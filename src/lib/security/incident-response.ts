export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved" | "dismissed";
export type IncidentAction =
  | "auto_block_ip"
  | "auto_disable_account"
  | "alert_admin"
  | "rate_limit"
  | "log_only";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string;
  ip?: string;
  userId?: string;
  path?: string;
  actions: IncidentAction[];
  details: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface ResponseRule {
  id: string;
  name: string;
  trigger: IncidentSeverity;
  conditions: ResponseCondition[];
  actions: IncidentAction[];
  cooldownMs: number;
  enabled: boolean;
}

export interface ResponseCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "in";
  value: string | number | string[];
}

export interface NotificationConfig {
  type: "log" | "email" | "webhook";
  enabled: boolean;
  endpoint?: string;
  minSeverity: IncidentSeverity;
}

declare global {
  var __incidents: Incident[] | undefined;
  var __responseRules: ResponseRule[] | undefined;
  var __notificationConfigs: NotificationConfig[] | undefined;
  var __incidentCooldowns: Map<string, number> | undefined;
}

const MAX_INCIDENTS = 500;

const incidents: Incident[] = globalThis.__incidents ??= [];
const responseRules: ResponseRule[] =
  globalThis.__responseRules ??= [
    {
      id: "rule_critical_auto_block",
      name: "Auto-block on critical threats",
      trigger: "critical",
      conditions: [
        { field: "severity", operator: "eq", value: "critical" },
      ],
      actions: ["auto_block_ip", "alert_admin", "log_only"],
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: "rule_high_alert",
      name: "Alert admin on high threats",
      trigger: "high",
      conditions: [
        { field: "severity", operator: "eq", value: "high" },
      ],
      actions: ["alert_admin", "log_only"],
      cooldownMs: 5 * 60 * 1000,
      enabled: true,
    },
    {
      id: "rule_medium_log",
      name: "Log medium threats",
      trigger: "medium",
      conditions: [
        { field: "severity", operator: "eq", value: "medium" },
      ],
      actions: ["log_only"],
      cooldownMs: 15 * 60 * 1000,
      enabled: true,
    },
    {
      id: "rule_brute_force",
      name: "Respond to brute force",
      trigger: "high",
      conditions: [
        { field: "type", operator: "contains", value: "brute_force" },
      ],
      actions: ["auto_block_ip", "alert_admin", "log_only"],
      cooldownMs: 10 * 60 * 1000,
      enabled: true,
    },
    {
      id: "rule_data_exfil",
      name: "Respond to data exfiltration",
      trigger: "critical",
      conditions: [
        { field: "type", operator: "contains", value: "data_exfiltration" },
      ],
      actions: ["auto_block_ip", "auto_disable_account", "alert_admin", "log_only"],
      cooldownMs: 0,
      enabled: true,
    },
  ];

const notificationConfigs: NotificationConfig[] =
  globalThis.__notificationConfigs ??= [
    { type: "log", enabled: true, minSeverity: "medium" },
  ];

const incidentCooldowns: Map<string, number> =
  globalThis.__incidentCooldowns ??= new Map();

function generateIncidentId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function evaluateCondition(condition: ResponseCondition, incident: Incident): boolean {
  let fieldValue: unknown;

  if (condition.field === "severity") {
    fieldValue = incident.severity;
  } else if (condition.field === "type") {
    fieldValue = incident.source;
  } else if (condition.field === "ip") {
    fieldValue = incident.ip;
  } else if (condition.field === "status") {
    fieldValue = incident.status;
  } else {
    fieldValue = (incident.details as Record<string, unknown>)[condition.field];
  }

  switch (condition.operator) {
    case "eq":
      return String(fieldValue) === String(condition.value);
    case "neq":
      return String(fieldValue) !== String(condition.value);
    case "gt":
      return Number(fieldValue) > Number(condition.value);
    case "lt":
      return Number(fieldValue) < Number(condition.value);
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(String(fieldValue));
    default:
      return false;
  }
}

function evaluateRule(rule: ResponseRule, incident: Incident): boolean {
  if (!rule.enabled) return false;
  if (rule.trigger !== incident.severity) return false;

  return rule.conditions.every((condition) => evaluateCondition(condition, incident));
}

async function executeAction(
  action: IncidentAction,
  incident: Incident
): Promise<void> {
  switch (action) {
    case "auto_block_ip":
      if (incident.ip) {
        const { addIPToBlocklist } = await import("./threat-intelligence");
        addIPToBlocklist({
          ip: incident.ip,
          reason: `Auto-blocked: ${incident.title}`,
          source: "incident_response",
          severity: incident.severity,
          durationMs: incident.severity === "critical" ? undefined : 24 * 60 * 60 * 1000,
        });

        const { blockIP } = await import("./ip-block");
        blockIP(incident.ip);
      }
      break;

    case "auto_disable_account":
      if (incident.userId) {
        console.error(`[INCIDENT] Account ${incident.userId} flagged for disable: ${incident.title}`);
      }
      break;

    case "alert_admin":
      await sendNotifications(incident);
      break;

    case "rate_limit":
      console.warn(`[INCIDENT] Rate limit triggered for ${incident.ip}: ${incident.title}`);
      break;

    case "log_only":
      console.log(`[INCIDENT] ${incident.severity.toUpperCase()}: ${incident.title}`, {
        id: incident.id,
        ip: incident.ip,
        source: incident.source,
      });
      break;
  }
}

async function sendNotifications(incident: Incident): Promise<void> {
  const severityOrder: IncidentSeverity[] = ["low", "medium", "high", "critical"];
  const incidentLevel = severityOrder.indexOf(incident.severity);

  for (const config of notificationConfigs) {
    if (!config.enabled) continue;

    const configLevel = severityOrder.indexOf(config.minSeverity);
    if (incidentLevel < configLevel) continue;

    switch (config.type) {
      case "log":
        console.log(
          `[SECURITY NOTIFICATION] ${incident.severity.toUpperCase()}: ${incident.title}`,
          {
            id: incident.id,
            description: incident.description,
            ip: incident.ip,
            source: incident.source,
            timestamp: new Date(incident.createdAt).toISOString(),
          }
        );
        break;

      case "email":
        if (config.endpoint) {
          console.log(`[EMAIL NOTIFICATION] Would send to ${config.endpoint}: ${incident.title}`);
        }
        break;

      case "webhook":
        if (config.endpoint) {
          console.log(`[WEBHOOK NOTIFICATION] Would POST to ${config.endpoint}: ${incident.title}`);
        }
        break;
    }
  }
}

export async function createIncident(params: {
  title: string;
  description: string;
  severity: IncidentSeverity;
  source: string;
  ip?: string;
  userId?: string;
  path?: string;
  details?: Record<string, unknown>;
}): Promise<Incident> {
  const now = Date.now();
  const incident: Incident = {
    id: generateIncidentId(),
    title: params.title,
    description: params.description,
    severity: params.severity,
    status: "open",
    source: params.source,
    ip: params.ip,
    userId: params.userId,
    path: params.path,
    actions: [],
    details: params.details ?? {},
    createdAt: now,
    updatedAt: now,
  };

  incidents.push(incident);
  if (incidents.length > MAX_INCIDENTS) {
    incidents.splice(0, incidents.length - MAX_INCIDENTS);
  }

  for (const rule of responseRules) {
    const cooldownKey = `${rule.id}:${incident.ip ?? "global"}`;
    const lastTriggered = incidentCooldowns.get(cooldownKey);

    if (lastTriggered && now - lastTriggered < rule.cooldownMs) {
      continue;
    }

    if (evaluateRule(rule, incident)) {
      for (const action of rule.actions) {
        if (!incident.actions.includes(action)) {
          incident.actions.push(action);
        }
        await executeAction(action, incident);
      }

      if (rule.cooldownMs > 0) {
        incidentCooldowns.set(cooldownKey, now);
      }
    }
  }

  incident.status = incident.actions.length > 0 ? "investigating" : "open";
  incident.updatedAt = Date.now();

  return incident;
}

export function updateIncident(
  incidentId: string,
  updates: {
    status?: IncidentStatus;
    resolvedBy?: string;
    details?: Record<string, unknown>;
  }
): Incident | null {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) return null;

  if (updates.status) {
    incident.status = updates.status;
    if (updates.status === "resolved") {
      incident.resolvedAt = Date.now();
      incident.resolvedBy = updates.resolvedBy;
    }
  }

  if (updates.details) {
    incident.details = { ...incident.details, ...updates.details };
  }

  incident.updatedAt = Date.now();
  return incident;
}

export function getIncidents(filters?: {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  ip?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): Incident[] {
  let filtered = [...incidents];

  if (filters?.status) {
    filtered = filtered.filter((i) => i.status === filters.status);
  }
  if (filters?.severity) {
    filtered = filtered.filter((i) => i.severity === filters.severity);
  }
  if (filters?.ip) {
    filtered = filtered.filter((i) => i.ip === filters.ip);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((i) => i.createdAt >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((i) => i.createdAt <= filters.endDate!);
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getIncidentById(incidentId: string): Incident | undefined {
  return incidents.find((i) => i.id === incidentId);
}

export function getIncidentStats() {
  const now = Date.now();
  const last24h = incidents.filter((i) => now - i.createdAt < 24 * 60 * 60 * 1000);

  return {
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((i) => i.status === "open").length,
    investigatingIncidents: incidents.filter((i) => i.status === "investigating").length,
    resolvedIncidents: incidents.filter((i) => i.status === "resolved").length,
    incidents24h: last24h.length,
    criticalIncidents: last24h.filter((i) => i.severity === "critical").length,
    highIncidents: last24h.filter((i) => i.severity === "high").length,
    actionsTaken: incidents.reduce((acc, i) => acc + i.actions.length, 0),
  };
}

export function addResponseRule(rule: Omit<ResponseRule, "id">): ResponseRule {
  const newRule: ResponseRule = {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  responseRules.push(newRule);
  return newRule;
}

export function getResponseRules(): ResponseRule[] {
  return [...responseRules];
}

export function addNotificationConfig(config: NotificationConfig): void {
  const existing = notificationConfigs.find((c) => c.type === config.type);
  if (existing) {
    Object.assign(existing, config);
  } else {
    notificationConfigs.push(config);
  }
}

export function getNotificationConfigs(): NotificationConfig[] {
  return [...notificationConfigs];
}
