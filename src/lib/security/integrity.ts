import { createHash, randomBytes } from "crypto";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// ── File Integrity Monitoring ────────────────────────────────────────

interface FileIntegrity {
  path: string;
  hash: string;
  size: number;
  lastModified: number;
}

interface IntegrityBaseline {
  version: string;
  createdAt: number;
  files: Map<string, FileIntegrity>;
}

declare global {
  var __integrityBaseline: IntegrityBaseline | undefined;
}

const CRITICAL_PATHS = [
  "src/lib/security",
  "src/lib/auth.ts",
  "src/lib/admin.ts",
  "src/lib/api-security.ts",
  "src/lib/license.ts",
  "next.config.ts",
  "prisma/schema.prisma",
];

function getProjectRoot(): string {
  return process.cwd();
}

function hashFile(filePath: string): string {
  try {
    const content = readFileSync(filePath);
    return createHash("sha256").update(content).digest("hex");
  } catch {
    return "";
  }
}

function scanCriticalFiles(): FileIntegrity[] {
  const root = getProjectRoot();
  const results: FileIntegrity[] = [];

  for (const criticalPath of CRITICAL_PATHS) {
    const fullPath = join(root, criticalPath);

    try {
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        const files = readdirSync(fullPath, { recursive: true }) as string[];
        for (const file of files) {
          if (typeof file !== "string" || !file.endsWith(".ts") && !file.endsWith(".js")) continue;
          const filePath = join(fullPath, file);
          const relPath = `${criticalPath}/${file}`;
          results.push({
            path: relPath,
            hash: hashFile(filePath),
            size: statSync(filePath).size,
            lastModified: statSync(filePath).mtimeMs,
          });
        }
      } else {
        results.push({
          path: criticalPath,
          hash: hashFile(fullPath),
          size: stat.size,
          lastModified: stat.mtimeMs,
        });
      }
    } catch {
      // File doesn't exist or can't be read — skip silently
    }
  }

  return results;
}

export function createIntegrityBaseline(): IntegrityBaseline {
  const files = scanCriticalFiles();
  const fileMap = new Map<string, FileIntegrity>();

  for (const f of files) {
    fileMap.set(f.path, f);
  }

  return {
    version: "1.0.0",
    createdAt: Date.now(),
    files: fileMap,
  };
}

declare global {
  var __integrityBaseline: IntegrityBaseline | undefined;
}

function getBaseline(): IntegrityBaseline {
  if (!globalThis.__integrityBaseline) {
    globalThis.__integrityBaseline = createIntegrityBaseline();
  }
  return globalThis.__integrityBaseline;
}

export function verifyIntegrity(): IntegrityReport {
  const baseline = getBaseline();
  const currentFiles = scanCriticalFiles();
  const modified: FileModification[] = [];
  const deleted: string[] = [];
  const added: FileModification[] = [];

  const baselineFiles = new Set(baseline.files.keys());
  const currentFileMap = new Map(currentFiles.map((f) => [f.path, f]));

  for (const [path, baselineEntry] of baseline.files) {
    const current = currentFileMap.get(path);

    if (!current) {
      deleted.push(path);
    } else if (current.hash !== baselineEntry.hash) {
      modified.push({
        path,
        baselineHash: baselineEntry.hash,
        currentHash: current.hash,
        baselineSize: baselineEntry.size,
        currentSize: current.size,
      });
    }
  }

  for (const f of currentFiles) {
    if (!baseline.files.has(f.path)) {
      added.push({
        path: f.path,
        baselineHash: "",
        currentHash: f.hash,
        baselineSize: 0,
        currentSize: f.size,
      });
    }
  }

  const isIntact = modified.length === 0 && deleted.length === 0;

  return {
    isIntact,
    version: baseline.version,
    baselineCreatedAt: new Date(baseline.createdAt).toISOString(),
    checkedAt: new Date().toISOString(),
    totalFiles: currentFiles.length,
    modifiedFiles: modified,
    deletedFiles: deleted,
    addedFiles: added,
    riskLevel: isIntact ? "none" : modified.length > 3 ? "critical" : "warning",
  };
}

// ── Build Verification ───────────────────────────────────────────────

export function verifyBuildOutput(): BuildVerification {
  const root = getProjectRoot();

  const checks: BuildCheck[] = [
    { name: ".next/standalone", path: ".next/standalone", required: true },
    { name: ".next/static", path: ".next/static", required: true },
    { name: "node_modules", path: "node_modules", required: true },
  ];

  const results: BuildCheckResult[] = [];

  for (const check of checks) {
    try {
      const stat = statSync(join(root, check.path));
      results.push({
        name: check.name,
        exists: stat.isDirectory() || stat.isFile(),
        type: stat.isDirectory() ? "directory" : "file",
      });
    } catch {
      results.push({
        name: check.name,
        exists: false,
        type: "missing",
      });
    }
  }

  return {
    passed: results.every((r) => r.exists),
    checks: results,
    timestamp: new Date().toISOString(),
  };
}

// ── Client Bundle Integrity ──────────────────────────────────────────

const CLIENT_NONCES = new Map<string, number>();

export function generateClientNonce(): string {
  const nonce = randomBytes(16).toString("base64");
  CLIENT_NONCES.set(nonce, Date.now());

  const now = Date.now();
  for (const [nonceKey, timestamp] of CLIENT_NONCES) {
    if (now - timestamp > 5 * 60 * 1000) {
      CLIENT_NONCES.delete(nonceKey);
    }
  }

  return nonce;
}

export function validateClientNonce(nonce: string): boolean {
  const timestamp = CLIENT_NONCES.get(nonce);
  if (!timestamp) return false;
  CLIENT_NONCES.delete(nonce);
  return Date.now() - timestamp < 5 * 60 * 1000;
}

// ── Types ────────────────────────────────────────────────────────────

interface FileModification {
  path: string;
  baselineHash: string;
  currentHash: string;
  baselineSize: number;
  currentSize: number;
}

interface IntegrityReport {
  isIntact: boolean;
  version: string;
  baselineCreatedAt: string;
  checkedAt: string;
  totalFiles: number;
  modifiedFiles: FileModification[];
  deletedFiles: string[];
  addedFiles: FileModification[];
  riskLevel: "none" | "warning" | "critical";
}

interface BuildCheck {
  name: string;
  path: string;
  required: boolean;
}

interface BuildCheckResult {
  name: string;
  exists: boolean;
  type: string;
}

interface BuildVerification {
  passed: boolean;
  checks: BuildCheckResult[];
  timestamp: string;
}

export type {
  IntegrityReport,
  BuildVerification,
  BuildCheckResult,
  FileModification,
};
