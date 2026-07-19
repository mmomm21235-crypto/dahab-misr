import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    return crypto.scryptSync("dahab-misr-dev-fallback-key-do-not-use-in-production", "dahab-misr-salt", 32);
  }
  const salt = `dahab-misr-${process.env.NODE_ENV || "development"}`;
  return crypto.scryptSync(envKey, salt, 32);
}

const KEY = getKey();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return email;
  return local[0] + "***" + local[local.length - 1] + "@" + domain;
}

export function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + "*".repeat(name.length - 1);
}
