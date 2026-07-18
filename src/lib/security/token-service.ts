import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_FAMILY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  var __tokenBlacklist: Set<string> | undefined;
  var __refreshTokenStore: Map<string, {
    userId: string;
    family: string;
    expiresAt: number;
    rotatedAt: number;
  }> | undefined;
}

const tokenBlacklist: Set<string> = globalThis.__tokenBlacklist ??= new Set();
const refreshTokenStore: Map<string, {
  userId: string;
  family: string;
  expiresAt: number;
  rotatedAt: number;
}> = globalThis.__refreshTokenStore ??= new Map();

interface TokenPayload {
  sub: string;
  email?: string;
  isAdmin?: boolean;
  iat: number;
  exp: number;
  jti: string;
  family: string;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET or ENCRYPTION_KEY required in production");
    }
    return "dev-fallback-secret-do-not-use-in-production";
  }
  return secret;
}

function generateTokenId(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateFamilyId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function base64UrlEncode(data: Buffer | string): string {
  const str = typeof data === "string" ? data : data.toString("base64");
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64");
}

function sign(payload: object): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.${signature}`;
}

function verify(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(`${header}.${body}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (signature !== expectedSig) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(body).toString("utf8"));

    if (payload.exp && Date.now() > payload.exp * 1000) return null;
    if (!payload.sub || !payload.jti || !payload.family) return null;

    return payload;
  } catch {
    return null;
  }
}

export function generateAccessToken(user: {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
}, family?: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email || undefined,
    isAdmin: user.isAdmin,
    iat: now,
    exp: now + Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
    jti: generateTokenId(),
    family: family || generateFamilyId(),
  };
  return sign(payload);
}

export function generateRefreshToken(userId: string, family?: string): {
  token: string;
  family: string;
} {
  const tokenFamily = family || generateFamilyId();
  const tokenId = generateTokenId();
  const now = Date.now();

  const storedToken = {
    userId,
    family: tokenFamily,
    expiresAt: now + REFRESH_TOKEN_EXPIRY_MS,
    rotatedAt: now,
  };

  refreshTokenStore.set(tokenId, storedToken);

  const payload = {
    sub: userId,
    jti: tokenId,
    family: tokenFamily,
    exp: Math.floor((now + REFRESH_TOKEN_EXPIRY_MS) / 1000),
    iat: Math.floor(now / 1000),
    type: "refresh",
  };

  return { token: sign(payload), family: tokenFamily };
}

export function generateTokenPair(user: {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
}): { accessToken: string; refreshToken: string; family: string } {
  const family = generateFamilyId();
  const accessToken = generateAccessToken(user, family);
  const { token: refreshToken } = generateRefreshToken(user.id, family);
  return { accessToken, refreshToken, family };
}

export function validateAccessToken(token: string): {
  valid: boolean;
  payload?: TokenPayload;
  reason?: string;
} {
  const payload = verify(token);
  if (!payload) {
    return { valid: false, reason: "Invalid or expired token" };
  }

  if (tokenBlacklist.has(payload.jti)) {
    return { valid: false, reason: "Token has been revoked" };
  }

  return { valid: true, payload };
}

export function rotateRefreshToken(refreshToken: string): {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
} {
  const payload = verify(refreshToken);
  if (!payload) {
    return { error: "Invalid refresh token" };
  }

  if (tokenBlacklist.has(payload.jti)) {
    return { error: "Refresh token reuse detected - all tokens invalidated" };
  }

  const stored = refreshTokenStore.get(payload.jti);
  if (!stored) {
    return { error: "Refresh token not found" };
  }

  if (stored.expiresAt < Date.now()) {
    refreshTokenStore.delete(payload.jti);
    return { error: "Refresh token expired" };
  }

  const familyAge = Date.now() - (stored.expiresAt - REFRESH_TOKEN_EXPIRY_MS);
  if (familyAge > TOKEN_FAMILY_MAX_AGE_MS) {
    refreshTokenStore.delete(payload.jti);
    return { error: "Token family expired" };
  }

  tokenBlacklist.add(payload.jti);
  refreshTokenStore.delete(payload.jti);

  const { token: newRefreshToken, family } = generateRefreshToken(
    stored.userId,
    stored.family
  );

  const accessToken = generateAccessToken(
    {
      id: stored.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
    },
    family
  );

  return { accessToken, refreshToken: newRefreshToken };
}

export function revokeAllUserTokens(userId: string): void {
  for (const [tokenId, stored] of refreshTokenStore.entries()) {
    if (stored.userId === userId) {
      tokenBlacklist.add(tokenId);
      refreshTokenStore.delete(tokenId);
    }
  }
}

export function revokeTokenFamily(family: string): void {
  for (const [tokenId, stored] of refreshTokenStore.entries()) {
    if (stored.family === family) {
      tokenBlacklist.add(tokenId);
      refreshTokenStore.delete(tokenId);
    }
  }
}

export async function persistTokenBlacklist(tokenId: string, expiresAt: number): Promise<void> {
  try {
    await prisma.verificationToken.create({
      data: {
        identifier: `blacklist:${tokenId}`,
        token: tokenId,
        expires: new Date(expiresAt),
      },
    });
  } catch {
    // Token may already be persisted
  }
}

export function getTokenInfo() {
  return {
    blacklistSize: tokenBlacklist.size,
    activeRefreshTokens: refreshTokenStore.size,
  };
}
