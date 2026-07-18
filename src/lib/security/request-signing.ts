import crypto from "crypto";

const SIGNING_ALGORITHM = "sha256";
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

declare global {
  var __usedNonces: Map<string, number> | undefined;
}

const usedNonces: Map<string, number> = globalThis.__usedNonces ??= new Map();

declare global {
  var __nonceCleanup: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__nonceCleanup) {
  globalThis.__nonceCleanup = setInterval(() => {
    const now = Date.now();
    for (const [nonce, timestamp] of usedNonces) {
      if (now - timestamp > NONCE_TTL_MS) {
        usedNonces.delete(nonce);
      }
    }
  }, 60 * 1000);
}

function getSigningSecret(): string {
  const secret = process.env.API_SIGNING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("API_SIGNING_SECRET environment variable is required in production");
    }
    return "dev-signing-secret-do-not-use-in-production";
  }
  return secret;
}

export interface SignedHeaders {
  "x-signature": string;
  "x-timestamp": string;
  "x-nonce": string;
}

export interface SignatureVerification {
  valid: boolean;
  error?: string;
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signRequest(
  method: string,
  path: string,
  body: string | null,
  timestamp: string,
  nonce: string
): string {
  const secret = getSigningSecret();
  const payload = [method.toUpperCase(), path, body || "", timestamp, nonce].join("\n");
  return crypto.createHmac(SIGNING_ALGORITHM, secret).update(payload).digest("hex");
}

export function createSignedHeaders(
  method: string,
  path: string,
  body: string | null = null
): SignedHeaders {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const signature = signRequest(method, path, body, timestamp, nonce);

  return {
    "x-signature": signature,
    "x-timestamp": timestamp,
    "x-nonce": nonce,
  };
}

export function verifySignature(
  method: string,
  path: string,
  body: string | null,
  signature: string,
  timestamp: string,
  nonce: string
): SignatureVerification {
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs)) {
    return { valid: false, error: "Invalid timestamp format" };
  }

  const now = Date.now();
  if (Math.abs(now - timestampMs) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, error: "Request timestamp expired" };
  }

  if (usedNonces.has(nonce)) {
    return { valid: false, error: "Nonce already used (replay detected)" };
  }

  const expectedSignature = signRequest(method, path, body, timestamp, nonce);
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "Invalid signature" };
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  if (!isValid) {
    return { valid: false, error: "Invalid signature" };
  }

  usedNonces.set(nonce, now);

  return { valid: true };
}

export function verifyRequestSignature(req: {
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  body?: string | null;
}): SignatureVerification {
  const signature = req.headers["x-signature"];
  const timestamp = req.headers["x-timestamp"];
  const nonce = req.headers["x-nonce"];

  if (!signature || !timestamp || !nonce) {
    return { valid: false, error: "Missing signing headers" };
  }

  try {
    const urlObj = new URL(req.url);
    const path = urlObj.pathname + urlObj.search;

    return verifySignature(
      req.method,
      path,
      req.body ?? null,
      signature,
      timestamp,
      nonce
    );
  } catch {
    return { valid: false, error: "Failed to parse request URL" };
  }
}

export function createClientSigner(secret: string) {
  return {
    sign: (method: string, path: string, body: string | null = null) => {
      const timestamp = Date.now().toString();
      const nonce = generateNonce();
      const payload = [method.toUpperCase(), path, body || "", timestamp, nonce].join("\n");
      const signature = crypto
        .createHmac(SIGNING_ALGORITHM, secret)
        .update(payload)
        .digest("hex");

      return {
        "x-signature": signature,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
      };
    },
  };
}
