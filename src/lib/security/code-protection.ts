import { createHash } from "crypto";

const PROJECT_ID = "dahab-misr";
const PROJECT_VERSION = "2.1.0";

// ── Anti-Debug Detection ─────────────────────────────────────────────

interface DevToolsState {
  open: boolean;
  lastCheck: number;
}

let devToolsState: DevToolsState = { open: false, lastCheck: 0 };

export function detectDevTools(): boolean {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  if (now - devToolsState.lastCheck < 3000) return devToolsState.open;
  devToolsState.lastCheck = now;

  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;

  devToolsState.open = widthThreshold || heightThreshold;
  return devToolsState.open;
}

export function detectDebuggerStatements(): boolean {
  if (typeof window === "undefined") return false;

  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const elapsed = performance.now() - start;
  return elapsed > 100;
}

export function onDevToolsOpen(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let wasOpen = detectDevTools();

  const intervalId = setInterval(() => {
    const isOpen = detectDevTools();
    if (isOpen && !wasOpen) {
      callback();
    }
    wasOpen = isOpen;
  }, 2000);

  return () => clearInterval(intervalId);
}

// ── Code Watermarking ────────────────────────────────────────────────

export interface WatermarkPayload {
  projectId: string;
  version: string;
  timestamp: number;
  instanceId: string;
}

function generateInstanceId(): string {
  return createHash("sha256")
    .update(`${PROJECT_ID}-${Date.now()}-${Math.random().toString(36)}`)
    .digest("hex")
    .slice(0, 16);
}

const INSTANCE_ID = generateInstanceId();

export function createWatermarkPayload(): WatermarkPayload {
  return {
    projectId: PROJECT_ID,
    version: PROJECT_VERSION,
    timestamp: Date.now(),
    instanceId: INSTANCE_ID,
  };
}

export function embedWatermark(data: Record<string, unknown>): Record<string, unknown> {
  return {
    ...data,
    _wm: createWatermarkPayload(),
  };
}

export function decodeWatermark(data: Record<string, unknown>): WatermarkPayload | null {
  const wm = data._wm as WatermarkPayload | undefined;
  if (
    wm &&
    typeof wm.projectId === "string" &&
    typeof wm.version === "string" &&
    typeof wm.timestamp === "number"
  ) {
    return wm;
  }
  return null;
}

// ── Function Integrity Checker ───────────────────────────────────────

type IntegrityMap = Map<string, string>;

declare global {
  var __functionIntegrityMap: IntegrityMap | undefined;
}

const functionStore: IntegrityMap = globalThis.__functionIntegrityMap ??= new Map();

export function registerFunction(name: string, fn: Function): void {
  const body = fn.toString();
  const hash = createHash("sha256").update(body).digest("hex");
  functionStore.set(name, hash);
}

export function verifyFunction(name: string, fn: Function): boolean {
  const stored = functionStore.get(name);
  if (!stored) return true;
  const body = fn.toString();
  const current = createHash("sha256").update(body).digest("hex");
  return stored === current;
}

export function verifyAllFunctions(): { name: string; intact: boolean }[] {
  return Array.from(functionStore.entries()).map(([name, storedHash]) => {
    const fn = (globalThis as Record<string, unknown>)[name];
    if (typeof fn !== "function") return { name, intact: false };
    const body = fn.toString();
    const current = createHash("sha256").update(body).digest("hex");
    return { name, intact: storedHash === current };
  });
}

// ── Self-Healing Code ────────────────────────────────────────────────

interface CriticalFunction {
  name: string;
  implementation: Function;
}

const criticalFunctions: CriticalFunction[] = [];

export function registerCriticalFunction(name: string, fn: Function): void {
  criticalFunctions.push({ name, implementation: fn });
  registerFunction(name, fn);
}

export function restoreCriticalFunctions(): { restored: string[]; failed: string[] } {
  const restored: string[] = [];
  const failed: string[] = [];

  for (const critical of criticalFunctions) {
    if (!verifyFunction(critical.name, critical.implementation)) {
      try {
        registerFunction(critical.name, critical.implementation);
        restored.push(critical.name);
      } catch {
        failed.push(critical.name);
      }
    }
  }

  return { restored, failed };
}

// ── Protection Check ─────────────────────────────────────────────────

export interface ProtectionStatus {
  projectId: string;
  version: string;
  timestamp: number;
  devToolsDetected: boolean;
  debuggerDetected: boolean;
  integrityCheck: { name: string; intact: boolean }[];
  allProtected: boolean;
}

export function getProtectionStatus(): ProtectionStatus {
  return {
    projectId: PROJECT_ID,
    version: PROJECT_VERSION,
    timestamp: Date.now(),
    devToolsDetected: typeof window !== "undefined" ? detectDevTools() : false,
    debuggerDetected: typeof window !== "undefined" ? detectDebuggerStatements() : false,
    integrityCheck: verifyAllFunctions(),
    allProtected: true,
  };
}
