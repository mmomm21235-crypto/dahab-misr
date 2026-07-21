import type { PriceAlert, AppSettings } from "@/types";

const KEYS = {
  ALERTS: "dahab_misr_alerts",
  SETTINGS: "dahab_misr_settings",
  PRICES_CACHE: "dahab_misr_prices_cache",
  LAST_UPDATE: "dahab_misr_last_update",
};

// ===== Generic storage helpers =====
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error("LocalStorage write failed");
  }
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    console.error("LocalStorage remove failed");
  }
}

// ===== Alerts =====
export function getAlerts(): PriceAlert[] {
  return getItem<PriceAlert[]>(KEYS.ALERTS, []);
}

export function saveAlerts(alerts: PriceAlert[]): void {
  setItem(KEYS.ALERTS, alerts);
}

export function addAlert(alert: PriceAlert): void {
  const alerts = getAlerts();
  alerts.unshift(alert);
  saveAlerts(alerts);
}

export function updateAlert(id: string, updates: Partial<PriceAlert>): void {
  const alerts = getAlerts();
  const index = alerts.findIndex((a) => a.id === id);
  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...updates };
    saveAlerts(alerts);
  }
}

export function deleteAlert(id: string): void {
  const alerts = getAlerts().filter((a) => a.id !== id);
  saveAlerts(alerts);
}

// ===== Settings =====
const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  language: "ar",
  notifications: true,
  currency: "EGP",
};

export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  setItem(KEYS.SETTINGS, settings);
}

export function updateSettings(updates: Partial<AppSettings>): void {
  const current = getSettings();
  saveSettings({ ...current, ...updates });
}

// ===== Cache =====
export function getCachedPrices() {
  return getItem(KEYS.PRICES_CACHE, null);
}

export function setCachedPrices(prices: unknown): void {
  setItem(KEYS.PRICES_CACHE, prices);
  setItem(KEYS.LAST_UPDATE, new Date().toISOString());
}

export function clearCache(): void {
  removeItem(KEYS.PRICES_CACHE);
  removeItem(KEYS.LAST_UPDATE);
}

// ===== Generate unique ID =====
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
