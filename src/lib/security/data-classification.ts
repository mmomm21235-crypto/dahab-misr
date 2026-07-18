import { encrypt, decrypt, maskPhone, maskEmail, maskName } from "@/lib/encryption";

export enum DataClassification {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  CONFIDENTIAL = "CONFIDENTIAL",
  RESTRICTED = "RESTRICTED",
}

interface ClassificationRule {
  classification: DataClassification;
  encrypt: boolean;
  maskInLogs: boolean;
  maskInDisplay: boolean;
  requireAudit: boolean;
  retentionDays: number;
  accessRoles: string[];
}

const CLASSIFICATION_RULES: Record<DataClassification, ClassificationRule> = {
  [DataClassification.PUBLIC]: {
    classification: DataClassification.PUBLIC,
    encrypt: false,
    maskInLogs: false,
    maskInDisplay: false,
    requireAudit: false,
    retentionDays: 365,
    accessRoles: ["public", "user", "admin"],
  },
  [DataClassification.INTERNAL]: {
    classification: DataClassification.INTERNAL,
    encrypt: false,
    maskInLogs: true,
    maskInDisplay: false,
    requireAudit: false,
    retentionDays: 180,
    accessRoles: ["user", "admin"],
  },
  [DataClassification.CONFIDENTIAL]: {
    classification: DataClassification.CONFIDENTIAL,
    encrypt: true,
    maskInLogs: true,
    maskInDisplay: true,
    requireAudit: true,
    retentionDays: 90,
    accessRoles: ["admin"],
  },
  [DataClassification.RESTRICTED]: {
    classification: DataClassification.RESTRICTED,
    encrypt: true,
    maskInLogs: true,
    maskInDisplay: true,
    requireAudit: true,
    retentionDays: 30,
    accessRoles: ["admin"],
  },
};

const FIELD_CLASSIFICATIONS: Record<string, DataClassification> = {
  phone: DataClassification.RESTRICTED,
  whatsapp: DataClassification.RESTRICTED,
  email: DataClassification.CONFIDENTIAL,
  name: DataClassification.INTERNAL,
  address: DataClassification.CONFIDENTIAL,
  pushSubscription: DataClassification.CONFIDENTIAL,
  ip: DataClassification.CONFIDENTIAL,
  userAgent: DataClassification.INTERNAL,
  sessionId: DataClassification.CONFIDENTIAL,
  targetPrice: DataClassification.INTERNAL,
  buyPrice: DataClassification.INTERNAL,
  notes: DataClassification.INTERNAL,
  content: DataClassification.INTERNAL,
};

export function classifyField(fieldName: string): DataClassification {
  return FIELD_CLASSIFICATIONS[fieldName] || DataClassification.INTERNAL;
}

export function getClassificationRule(classification: DataClassification): ClassificationRule {
  return CLASSIFICATION_RULES[classification];
}

export function protectDataByClassification(
  data: Record<string, any>,
  classification: DataClassification
): Record<string, any> {
  const rule = CLASSIFICATION_RULES[classification];
  const result = { ...data };

  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined || typeof value !== "string") continue;

    const fieldClassification = classifyField(key);
    const fieldRule = CLASSIFICATION_RULES[fieldClassification];

    if (fieldRule.encrypt) {
      try {
        if (!value.includes(":") || value.split(":").length !== 3) {
          result[key] = encrypt(value);
        }
      } catch {
        // Skip if already encrypted
      }
    }

    if (fieldRule.maskInDisplay && rule.maskInDisplay) {
      result[key] = maskFieldByType(key, value);
    }
  }

  return result;
}

export function unprotectDataByClassification(
  data: Record<string, any>,
  classification: DataClassification,
  userRole: string
): Record<string, any> {
  const rule = CLASSIFICATION_RULES[classification];

  if (!rule.accessRoles.includes(userRole)) {
    throw new Error(`Access denied: role ${userRole} cannot access ${classification} data`);
  }

  const result = { ...data };

  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined || typeof value !== "string") continue;

    const fieldClassification = classifyField(key);
    const fieldRule = CLASSIFICATION_RULES[fieldClassification];

    if (fieldRule.encrypt && value.includes(":")) {
      try {
        result[key] = decrypt(value);
      } catch {
        // May already be decrypted
      }
    }
  }

  return result;
}

export function maskForLogging(data: Record<string, any>): Record<string, any> {
  const result = { ...data };

  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined || typeof value !== "string") continue;

    const fieldClassification = classifyField(key);
    const fieldRule = CLASSIFICATION_RULES[fieldClassification];

    if (fieldRule.maskInLogs) {
      result[key] = maskFieldByType(key, value);
    }
  }

  return result;
}

function maskFieldByType(fieldName: string, value: string): string {
  if (fieldName.toLowerCase().includes("phone")) return maskPhone(value);
  if (fieldName.toLowerCase().includes("email")) return maskEmail(value);
  if (fieldName.toLowerCase().includes("name")) return maskName(value);
  if (fieldName === "pushSubscription") return "***MASKED***";
  if (fieldName === "ip") return value.replace(/\d+$/, "***");
  if (fieldName === "userAgent") return "***MASKED***";
  if (fieldName === "sessionId") return value.substring(0, 8) + "***";
  if (value.length > 20) return value.substring(0, 4) + "***" + value.slice(-2);
  return "***";
}

export async function logClassifiedDataAccess(params: {
  userId: string;
  fieldName: string;
  classification: DataClassification;
  action: "READ" | "WRITE" | "DELETE" | "EXPORT";
  recordId?: string;
  ip?: string;
}): Promise<void> {
  const rule = CLASSIFICATION_RULES[params.classification];
  if (!rule.requireAudit) return;

  try {
    const { logAudit } = await import("./audit-trail");
    await logAudit({
      action: `DATA_${params.action}`,
      entity: "ClassifiedData",
      entityId: params.recordId,
      userId: params.userId,
      details: {
        fieldName: params.fieldName,
        classification: params.classification,
      },
      ip: params.ip,
    });
  } catch {
    // Audit logging should not break main flow
  }
}

export function getAllClassifications(): Record<string, ClassificationRule> {
  return { ...CLASSIFICATION_RULES };
}

export function getFieldClassifications(): Record<string, DataClassification> {
  return { ...FIELD_CLASSIFICATIONS };
}
