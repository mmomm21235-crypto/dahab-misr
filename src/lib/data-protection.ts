import { encrypt, decrypt, maskPhone, maskEmail } from "./encryption";

const ENCRYPT_FIELDS = ["phone", "whatsapp"];
const MASK_FIELDS = ["email", "name"];

export function encryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const field of ENCRYPT_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

export function decryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const field of ENCRYPT_FIELDS) {
    if (result[field] && typeof result[field] === "string" && result[field].includes(":")) {
      try {
        result[field] = decrypt(result[field]);
      } catch {
        // Already decrypted or invalid
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

const auditLog: AuditEntry[] = [];
const MAX_AUDIT_LOG = 1000;

export function logAudit(entry: Omit<AuditEntry, "timestamp">) {
  auditLog.push({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > MAX_AUDIT_LOG) {
    auditLog.splice(0, auditLog.length - MAX_AUDIT_LOG);
  }
}

export function getAuditLog(limit: number = 50): AuditEntry[] {
  return auditLog.slice(-limit).reverse();
}
