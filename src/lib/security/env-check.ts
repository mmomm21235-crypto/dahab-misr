const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const SENSITIVE_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "GOLDAPI_KEY",
  "NEWS_DATA_API_KEY",
  "ADMIN_EMAIL",
];

export function checkEnvironment(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  return { valid: missing.length === 0, missing };
}

export function getSafeEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasDb: !!process.env.DATABASE_URL,
    hasAuth: !!process.env.NEXTAUTH_SECRET,
    hasGoldApi: !!process.env.GOLDAPI_KEY,
    hasNewsApi: !!process.env.NEWS_DATA_API_KEY,
    hasGoogleAuth: !!process.env.GOOGLE_CLIENT_ID,
    hasVapid: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  };
}

export function validateClientEnv() {
  if (typeof window !== "undefined") {
    const publicKeys = Object.keys(
      window.__NEXT_DATA__?.props?.pageProps || {}
    );
  }
}
