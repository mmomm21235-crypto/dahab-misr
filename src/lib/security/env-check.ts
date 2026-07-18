const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
];

const SENSITIVE_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "GOLD_API_KEY",
  "NEWS_DATA_API_KEY",
  "ADMIN_EMAIL",
  "ENCRYPTION_KEY",
];

export function checkEnvironment(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  return { valid: missing.length === 0, missing };
}

export function getSafeEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasDb: !!process.env.DATABASE_URL,
    hasAuth: !!process.env.AUTH_SECRET,
    hasGoldApi: !!process.env.GOLD_API_KEY,
    hasNewsApi: !!process.env.NEWS_DATA_API_KEY,
    hasGoogleAuth: !!process.env.AUTH_GOOGLE_ID,
    hasVapid: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    hasEncryption: !!process.env.ENCRYPTION_KEY,
  };
}
