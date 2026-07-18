import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

declare global {
  var __encryptionKeyCache: Map<string, Buffer> | undefined;
}

const keyCache: Map<string, Buffer> = globalThis.__encryptionKeyCache ??= new Map();

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    return "dev-only-fallback-key-do-not-use-in-production";
  }
  return key;
}

function deriveKey(salt: string, purpose: string = "enc"): Buffer {
  const cacheKey = `${salt}:${purpose}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const derived = crypto.pbkdf2Sync(
    getMasterKey(),
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha512"
  );
  keyCache.set(cacheKey, derived);
  return derived;
}

function getCurrentKeyVersion(): string {
  return process.env.ENCRYPTION_KEY_VERSION || "v1";
}

function getKeyForVersion(version: string): Buffer {
  const salt = `dahab-misr-key-${version}`;
  return deriveKey(salt, "field-encryption");
}

export function encryptField(plaintext: string, fieldName?: string): string {
  if (!plaintext || typeof plaintext !== "string") return plaintext;

  const version = getCurrentKeyVersion();
  const key = getKeyForVersion(version);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const fieldSalt = fieldName
    ? crypto.createHash("sha256").update(fieldName).digest("hex").substring(0, 16)
    : "";
  if (fieldSalt) {
    cipher.update(fieldSalt);
  }

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${version}:${fieldSalt}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== "string") return ciphertext;

  const parts = ciphertext.split(":");
  if (parts.length < 4) return ciphertext;

  const [version, fieldSalt, ivHex, authTagHex, ...encryptedParts] = parts;
  const encrypted = encryptedParts.join(":");

  try {
    let key: Buffer;
    try {
      key = getKeyForVersion(version);
    } catch {
      key = getKeyForVersion("v1");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    if (fieldSalt) {
      decipher.update(Buffer.from(fieldSalt, "utf8"));
    }

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return ciphertext;
  }
}

export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const result: Record<string, any> = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      const value = result[field] as string;
      if (!isEncrypted(value)) {
        result[field] = encryptField(value, field);
      }
    }
  }
  return result as T;
}

export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const result: Record<string, any> = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      const value = result[field] as string;
      if (isEncrypted(value)) {
        try {
          result[field] = decryptField(value);
        } catch {
          // Leave as-is if decryption fails
        }
      }
    }
  }
  return result as T;
}

export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(":");
  return parts.length >= 4 && /^[0-9a-f]+$/.test(parts[0].replace(/^v\d+$/, ""));
}

export function hashForSearch(value: string, fieldName: string): string {
  const salt = `dahab-search-${fieldName}-${getCurrentKeyVersion()}`;
  return crypto.createHmac("sha256", salt).update(value.toLowerCase().trim()).digest("hex");
}

export function createSearchableEncryptedField(
  plaintext: string,
  fieldName: string
): { encrypted: string; searchHash: string } {
  return {
    encrypted: encryptField(plaintext, fieldName),
    searchHash: hashForSearch(plaintext, fieldName),
  };
}

export function searchableMatch(
  plaintext: string,
  fieldName: string,
  storedHash: string
): boolean {
  const computedHash = hashForSearch(plaintext, fieldName);
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function rotateEncryptionKey(
  data: Array<{ id: string; fields: Record<string, string> }>,
  fieldsToRotate: string[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const record of data) {
    try {
      const decryptedFields: Record<string, string> = {};
      for (const field of fieldsToRotate) {
        const value = record.fields[field];
        if (value && isEncrypted(value)) {
          decryptedFields[field] = decryptField(value);
        }
      }

      for (const field of fieldsToRotate) {
        if (decryptedFields[field]) {
          record.fields[field] = encryptField(decryptedFields[field], field);
        }
      }
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

export function secureErase(value: string): string {
  if (!value) return value;
  return crypto.randomBytes(Math.ceil(value.length / 2)).toString("hex").substring(0, value.length);
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const ENCRYPTED_FIELDS = ["phone", "whatsapp", "email"];
export const HASHED_SEARCH_FIELDS = ["phone", "whatsapp", "email"];
