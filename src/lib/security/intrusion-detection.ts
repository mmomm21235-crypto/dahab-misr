export type ThreatCategory =
  | "sql_injection"
  | "xss"
  | "path_traversal"
  | "brute_force"
  | "credential_stuffing"
  | "command_injection"
  | "directory_listing"
  | "scanner_detected"
  | "anomaly";

export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

export interface ThreatDetection {
  id: string;
  category: ThreatCategory;
  level: ThreatLevel;
  score: number;
  ip: string;
  path: string;
  method: string;
  matchedPattern: string;
  rawInput: string;
  timestamp: number;
  details: string;
}

export interface ThreatAssessment {
  ip: string;
  totalThreats: number;
  maxLevel: ThreatLevel;
  categories: ThreatCategory[];
  averageScore: number;
  lastSeen: number;
  riskScore: number;
}

declare global {
  var __threatDetections: ThreatDetection[] | undefined;
  var __ipThreatProfiles: Map<string, ThreatAssessment> | undefined;
}

const MAX_DETECTIONS = 2000;

const detections: ThreatDetection[] = globalThis.__threatDetections ??= [];
const ipProfiles: Map<string, ThreatAssessment> =
  globalThis.__ipThreatProfiles ??= new Map();

const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b\s)/i,
  /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
  /('\s*(or|and)\s+')/i,
  /(--|\/\*|\*\/|;)/,
  /(\bwaitfor\b\s+delay)/i,
  /(\bsleep\s*\()/i,
  /(\bbenchmark\s*\()/i,
  /(\bload_file\s*\()/i,
  /(\binto\s+(out|dump)file)/i,
  /(0x[0-9a-f]+)/i,
  /(\bchar\s*\()/i,
  /(\bconcat\s*\()/i,
  /(\bgroup_concat\s*\()/i,
  /(information_schema|sysobjects|syscolumns)/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /on(error|load|click|mouseover|focus|blur|submit|change|input|keyup|keydown)\s*=/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<applet[\s>]/i,
  /<form[\s>]/i,
  /eval\s*\(/i,
  /document\s*\.\s*(cookie|write|location)/i,
  /window\s*\.\s*(location|open)/i,
  /(\balert\s*\(|confirm\s*\(|prompt\s*\()/i,
  /<img[^>]+onerror/i,
  /<svg[^>]+onload/i,
  /expression\s*\(/i,
  /(\bdocument\.cookie\b)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e/i,
  /%252e%252e/i,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\/etc\/hosts/,
  /\/proc\/self/,
  /\/windows\/system32/i,
  /\/c:\//i,
  /\/d:\//i,
  /(\/|\\)bin(\/|\\)/i,
  /(\/|\\)boot\.ini/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /[|;&`$]/,
  /\$\(/,
  /\b(cat|ls|dir|type|echo|ping|curl|wget|nc|netcat|bash|sh|cmd|powershell)\b/i,
  />\s*\/dev\/null/,
  /2>&1/,
  /\bchmod\s/,
  /\bchown\s/,
  /\bkill\s/,
  /\bwget\s+http/,
  /\bcurl\s+http/,
];

const SCANNER_SIGNATURES = [
  /nikto/i,
  /sqlmap/i,
  /nessus/i,
  /openvas/i,
  /burp/i,
  /owasp/i,
  /acunetix/i,
  /w3af/i,
  /havij/i,
  /appscan/i,
  /webinspect/i,
  /masscan/i,
  /zmeu/i,
  /morfeus/i,
  /wpscan/i,
  /joomscan/i,
];

const BRUTE_FORCE_PATHS = ["/api/auth", "/api/auth/signin", "/api/auth/callback"];

const CREDENTIAL_STUFFING_INDICATORS = [
  { path: "/api/auth/callback", method: "POST" },
  { path: "/api/auth/signin", method: "POST" },
  { path: "/login", method: "POST" },
];

const SCORE_WEIGHTS: Record<ThreatCategory, number> = {
  sql_injection: 90,
  xss: 70,
  path_traversal: 85,
  brute_force: 50,
  credential_stuffing: 75,
  command_injection: 95,
  directory_listing: 40,
  scanner_detected: 60,
  anomaly: 30,
};

function generateDetectionId(): string {
  return `det_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function determineThreatLevel(score: number): ThreatLevel {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score > 0) return "low";
  return "none";
}

function detectPatterns(input: string, patterns: RegExp[]): RegExp | null {
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return pattern;
    }
  }
  return null;
}

function updateIPProfile(detection: ThreatDetection): void {
  const existing = ipProfiles.get(detection.ip);

  if (existing) {
    existing.totalThreats++;
    existing.lastSeen = detection.timestamp;
    if (!existing.categories.includes(detection.category)) {
      existing.categories.push(detection.category);
    }
    existing.averageScore =
      (existing.averageScore * (existing.totalThreats - 1) + detection.score) /
      existing.totalThreats;
    const newLevel = determineThreatLevel(existing.averageScore);
    const levelOrder: ThreatLevel[] = ["none", "low", "medium", "high", "critical"];
    if (levelOrder.indexOf(newLevel) > levelOrder.indexOf(existing.maxLevel)) {
      existing.maxLevel = newLevel;
    }
    existing.riskScore = Math.min(
      100,
      existing.averageScore * (1 + Math.log2(existing.totalThreats))
    );
  } else {
    ipProfiles.set(detection.ip, {
      ip: detection.ip,
      totalThreats: 1,
      maxLevel: detection.level,
      categories: [detection.category],
      averageScore: detection.score,
      lastSeen: detection.timestamp,
      riskScore: detection.score,
    });
  }
}

export function analyzeRequest(params: {
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  query?: string;
  body?: string;
}): ThreatDetection[] {
  const found: ThreatDetection[] = [];
  const timestamp = Date.now();
  const combinedInput = [params.path, params.query, params.body].filter(Boolean).join(" ");

  const sqlMatch = detectPatterns(combinedInput, SQL_INJECTION_PATTERNS);
  if (sqlMatch) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "sql_injection",
      level: "critical",
      score: SCORE_WEIGHTS.sql_injection,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: sqlMatch.source.slice(0, 100),
      rawInput: combinedInput.slice(0, 200),
      timestamp,
      details: `SQL injection pattern detected: ${sqlMatch.source.slice(0, 50)}`,
    };
    found.push(detection);
    updateIPProfile(detection);
  }

  const xssMatch = detectPatterns(combinedInput, XSS_PATTERNS);
  if (xssMatch) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "xss",
      level: "high",
      score: SCORE_WEIGHTS.xss,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: xssMatch.source.slice(0, 100),
      rawInput: combinedInput.slice(0, 200),
      timestamp,
      details: `XSS pattern detected: ${xssMatch.source.slice(0, 50)}`,
    };
    found.push(detection);
    updateIPProfile(detection);
  }

  const traversalMatch = detectPatterns(combinedInput, PATH_TRAVERSAL_PATTERNS);
  if (traversalMatch) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "path_traversal",
      level: "high",
      score: SCORE_WEIGHTS.path_traversal,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: traversalMatch.source.slice(0, 100),
      rawInput: combinedInput.slice(0, 200),
      timestamp,
      details: `Path traversal attempt detected: ${traversalMatch.source.slice(0, 50)}`,
    };
    found.push(detection);
    updateIPProfile(detection);
  }

  const cmdMatch = detectPatterns(combinedInput, COMMAND_INJECTION_PATTERNS);
  if (cmdMatch) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "command_injection",
      level: "critical",
      score: SCORE_WEIGHTS.command_injection,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: cmdMatch.source.slice(0, 100),
      rawInput: combinedInput.slice(0, 200),
      timestamp,
      details: `Command injection attempt detected: ${cmdMatch.source.slice(0, 50)}`,
    };
    found.push(detection);
    updateIPProfile(detection);
  }

  const scannerMatch = detectPatterns(params.userAgent, SCANNER_SIGNATURES);
  if (scannerMatch) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "scanner_detected",
      level: "medium",
      score: SCORE_WEIGHTS.scanner_detected,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: scannerMatch.source.slice(0, 100),
      rawInput: params.userAgent.slice(0, 200),
      timestamp,
      details: `Scanner/bot detected: ${scannerMatch.source.slice(0, 50)}`,
    };
    found.push(detection);
    updateIPProfile(detection);
  }

  if (found.length > 0) {
    detections.push(...found);
    if (detections.length > MAX_DETECTIONS) {
      detections.splice(0, detections.length - MAX_DETECTIONS);
    }
  }

  return found;
}

declare global {
  var __bruteForceTrackers: Map<string, { count: number; windowStart: number }> | undefined;
}

const bruteForceTrackers: Map<string, { count: number; windowStart: number }> =
  globalThis.__bruteForceTrackers ??= new Map();

const BRUTE_FORCE_THRESHOLD = 10;
const BRUTE_FORCE_WINDOW = 15 * 60 * 1000;

export function trackFailedAuth(params: {
  ip: string;
  path: string;
  method: string;
  userAgent: string;
}): ThreatDetection | null {
  const key = `bf:${params.ip}`;
  const now = Date.now();
  const tracker = bruteForceTrackers.get(key);

  if (!tracker || now - tracker.windowStart > BRUTE_FORCE_WINDOW) {
    bruteForceTrackers.set(key, { count: 1, windowStart: now });
    return null;
  }

  tracker.count++;

  if (tracker.count >= BRUTE_FORCE_THRESHOLD) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "brute_force",
      level: "high",
      score: SCORE_WEIGHTS.brute_force,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: "repeated_auth_failure",
      rawInput: `${tracker.count} failures in window`,
      timestamp: now,
      details: `Brute force detected: ${tracker.count} failed auth attempts from ${params.ip}`,
    };
    detections.push(detection);
    updateIPProfile(detection);
    return detection;
  }

  return null;
}

export function trackCredentialStuffing(params: {
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  success: boolean;
}): ThreatDetection | null {
  const isCredentialPath = CREDENTIAL_STUFFING_INDICATORS.some(
    (indicator) => params.path.includes(indicator.path) && params.method === indicator.method
  );

  if (!isCredentialPath) return null;

  const key = `cs:${params.ip}`;
  const now = Date.now();
  const tracker = bruteForceTrackers.get(key);

  if (!tracker || now - tracker.windowStart > BRUTE_FORCE_WINDOW) {
    bruteForceTrackers.set(key, { count: params.success ? 0 : 1, windowStart: now });
    return null;
  }

  if (!params.success) {
    tracker.count++;
  }

  if (tracker.count >= 5) {
    const detection: ThreatDetection = {
      id: generateDetectionId(),
      category: "credential_stuffing",
      level: "high",
      score: SCORE_WEIGHTS.credential_stuffing,
      ip: params.ip,
      path: params.path,
      method: params.method,
      matchedPattern: "credential_stuffing_pattern",
      rawInput: `${tracker.count} failed credential attempts`,
      timestamp: now,
      details: `Credential stuffing detected from ${params.ip}: ${tracker.count} failed attempts`,
    };
    detections.push(detection);
    updateIPProfile(detection);
    return detection;
  }

  return null;
}

export function getIPThreatProfile(ip: string): ThreatAssessment | undefined {
  return ipProfiles.get(ip);
}

export function getThreatAssessments(options?: {
  minRiskScore?: number;
  limit?: number;
}): ThreatAssessment[] {
  let profiles = Array.from(ipProfiles.values());

  if (options?.minRiskScore) {
    profiles = profiles.filter((p) => p.riskScore >= options.minRiskScore!);
  }

  profiles.sort((a, b) => b.riskScore - a.riskScore);

  if (options?.limit) {
    profiles = profiles.slice(0, options.limit);
  }

  return profiles;
}

export function getDetections(filters?: {
  category?: ThreatCategory;
  level?: ThreatLevel;
  ip?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): ThreatDetection[] {
  let filtered = [...detections];

  if (filters?.category) {
    filtered = filtered.filter((d) => d.category === filters.category);
  }
  if (filters?.level) {
    filtered = filtered.filter((d) => d.level === filters.level);
  }
  if (filters?.ip) {
    filtered = filtered.filter((d) => d.ip === filters.ip);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((d) => d.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((d) => d.timestamp <= filters.endDate!);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getOverallThreatLevel(): {
  level: ThreatLevel;
  activeIPs: number;
  criticalDetections24h: number;
  topThreats: ThreatAssessment[];
} {
  const now = Date.now();
  const last24h = detections.filter((d) => now - d.timestamp < 24 * 60 * 60 * 1000);
  const criticalCount = last24h.filter((d) => d.level === "critical").length;
  const highCount = last24h.filter((d) => d.level === "high").length;

  let level: ThreatLevel = "none";
  if (criticalCount > 5) level = "critical";
  else if (criticalCount > 0 || highCount > 10) level = "high";
  else if (highCount > 0 || last24h.length > 20) level = "medium";
  else if (last24h.length > 0) level = "low";

  const activeIPs = new Set(last24h.map((d) => d.ip)).size;
  const topThreats = getThreatAssessments({ minRiskScore: 20, limit: 10 });

  return {
    level,
    activeIPs,
    criticalDetections24h: criticalCount,
    topThreats,
  };
}
