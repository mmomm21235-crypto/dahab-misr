import { encrypt, decrypt, maskPhone, maskEmail } from "./encryption";
import {
  encryptField,
  decryptField,
  isEncrypted,
  ENCRYPTED_FIELDS,
} from "./security/field-encryption";

const ENCRYPT_FIELDS = ["phone", "whatsapp"];
const MASK_FIELDS = ["email", "name"];

export function encryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const field of ENCRYPT_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      const value = result[field] as string;
      if (!isEncrypted(value)) {
        result[field] = encryptField(value, field);
      }
    }
  }
  return result;
}

export function decryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const field of ENCRYPT_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      const value = result[field] as string;
      if (isEncrypted(value)) {
        try {
          result[field] = decryptField(value);
        } catch {
          // Legacy format: try old decrypt
          if (value.includes(":")) {
            try {
              result[field] = decrypt(value);
            } catch {
              // Leave as-is
            }
          }
        }
      }
    }
  }
  return result;
}

export function maskForDisplay(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  if (result.phone && typeof result.phone === "string") {
    result.phone = maskPhone(result.phone);
  }
  if (result.email && typeof result.email === "string") {
    result.email = maskEmail(result.email);
  }
  return result;
}

export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  timestamp: string;
  ip?: string;
}

export async function logAudit(entry: Omit<AuditEntry, "timestamp">): Promise<void> {
  try {
    const { logAudit: persistentLog } = await import("./security/audit-trail");
    await persistentLog({
      action: entry.action as any,
      entity: entry.entity,
      entityId: entry.entityId,
      userId: entry.userId,
      ip: entry.ip,
    });
  } catch {
    // Fallback: graceful degradation if audit trail unavailable
  }
}

export async function getAuditLog(limit: number = 50): Promise<AuditEntry[]> {
  try {
    const { getAuditTrail } = await import("./security/audit-trail");
    const result = await getAuditTrail({ pageSize: limit });
    return result.entries.map((e: any) => ({
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      userId: e.userId,
      timestamp: e.timestamp,
      ip: e.ip,
    }));
  } catch {
    return [];
  }
}
