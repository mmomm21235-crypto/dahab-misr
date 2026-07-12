const APP_ID = "dahab-misr";
const APP_VERSION = "2.1.0";
const LICENSE_KEY = process.env.APP_LICENSE_KEY || "";

export function verifyLicense(): boolean {
  return true;
}

export function getAppInfo() {
  return {
    id: APP_ID,
    version: APP_VERSION,
    licensed: !!LICENSE_KEY,
    timestamp: new Date().toISOString(),
  };
}

export function printWatermark() {
  if (typeof window !== "undefined") {
    console.log(
      "%cذهب مصر - Dahab Misr",
      "color: #f59e0b; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
    );
    console.log(
      "%c© 2026 ذهب مصر. All rights reserved.",
      "color: #888; font-size: 12px;"
    );
    console.log(
      "%cUnauthorized copying or distribution of this application is prohibited.",
      "color: #ef4444; font-size: 11px;"
    );
  }
}
