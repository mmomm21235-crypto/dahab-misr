import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "dahab-misr";
const DB_VERSION = 1;

interface DahabDB {
  prices: {
    key: string;
    value: { id: string; data: unknown; cachedAt: number };
  };
  settings: {
    key: string;
    value: { id: string; data: unknown };
  };
  alerts: {
    key: string;
    value: { id: string; data: unknown };
  };
}

let dbPromise: Promise<IDBPDatabase<DahabDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DahabDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("prices")) {
          db.createObjectStore("prices", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("alerts")) {
          db.createObjectStore("alerts", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function cachePriceData(key: string, data: unknown) {
  const db = await getDB();
  await db.put("prices", {
    id: key,
    data,
    cachedAt: Date.now(),
  });
}

export async function getCachedPriceData<T>(key: string): Promise<{ data: T; cachedAt: number } | null> {
  const db = await getDB();
  const entry = await db.get("prices", key);
  if (!entry) return null;
  return entry as { data: T; cachedAt: number };
}

export async function isOnline(): Promise<boolean> {
  try {
    const res = await fetch("/api/gold-prices", {
      method: "HEAD",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearAllCaches() {
  const db = await getDB();
  await db.clear("prices");
  await db.clear("settings");
  await db.clear("alerts");
}
