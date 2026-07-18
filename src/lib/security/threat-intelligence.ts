export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

export interface ThreatIntelEntry {
  ip: string;
  reason: string;
  addedAt: number;
  expiresAt?: number;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface BotSignature {
  pattern: RegExp;
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "scanner" | "crawler" | "exploit" | "ddos";
}

export interface GeoThreatData {
  country: string;
  threatLevel: ThreatLevel;
  commonAttacks: string[];
  notes: string;
}

declare global {
  var __ipBlocklist: Map<string, ThreatIntelEntry> | undefined;
  var __botSignatures: BotSignature[] | undefined;
  var __geoThreatData: Map<string, GeoThreatData> | undefined;
  var __lastIntelUpdate: number | undefined;
  var __intelUpdateInterval: ReturnType<typeof setInterval> | undefined;
}

const ipBlocklist: Map<string, ThreatIntelEntry> =
  globalThis.__ipBlocklist ??= new Map();

const botSignatures: BotSignature[] =
  globalThis.__botSignatures ??= [
    { pattern: /sqlmap/i, name: "SQLMap", severity: "critical", category: "exploit" },
    { pattern: /nikto/i, name: "Nikto Scanner", severity: "high", category: "scanner" },
    { pattern: /nessus/i, name: "Nessus", severity: "high", category: "scanner" },
    { pattern: /openvas/i, name: "OpenVAS", severity: "high", category: "scanner" },
    { pattern: /acunetix/i, name: "Acunetix", severity: "high", category: "scanner" },
    { pattern: /burp(?:\s+suite)?/i, name: "Burp Suite", severity: "medium", category: "scanner" },
    { pattern: /owasp\s*(?:zaproxy|zap)/i, name: "OWASP ZAP", severity: "medium", category: "scanner" },
    { pattern: /masscan/i, name: "Masscan", severity: "high", category: "scanner" },
    { pattern: /zmeu/i, name: "ZmEu Exploit", severity: "critical", category: "exploit" },
    { pattern: /wpscan/i, name: "WPScan", severity: "medium", category: "scanner" },
    { pattern: /havij/i, name: "Havij", severity: "critical", category: "exploit" },
    { pattern: /appscan/i, name: "AppScan", severity: "medium", category: "scanner" },
    { pattern: /webinspect/i, name: "WebInspect", severity: "medium", category: "scanner" },
    { pattern: /gobuster/i, name: "Gobuster", severity: "medium", category: "scanner" },
    { pattern: /ffuf/i, name: "FFUF Fuzzer", severity: "medium", category: "scanner" },
    { pattern: /nuclei/i, name: "Nuclei", severity: "high", category: "scanner" },
    { pattern: /semrush|ahrefs|moz/i, name: "SEO Bot", severity: "low", category: "crawler" },
    { pattern: /python-requests/i, name: "Python Bot", severity: "low", category: "crawler" },
    { pattern: /go-http-client/i, name: "Go HTTP Client", severity: "low", category: "crawler" },
    { pattern: /java\/?\d/i, name: "Java Client", severity: "low", category: "crawler" },
    { pattern: /curl\/\d/i, name: "cURL", severity: "low", category: "crawler" },
  ];

const geoThreatData: Map<string, GeoThreatData> =
  globalThis.__geoThreatData ??= new Map([
    ["CN", { country: "China", threatLevel: "medium", commonAttacks: ["scanning", "exploitation"], notes: "High volume of automated scanning" }],
    ["RU", { country: "Russia", threatLevel: "medium", commonAttacks: ["brute_force", "exploitation"], notes: "Known for credential attacks" }],
    ["US", { country: "United States", threatLevel: "low", commonAttacks: ["scanner"], notes: "Various security research" }],
    ["BR", { country: "Brazil", threatLevel: "low", commonAttacks: ["phishing"], notes: "Financial fraud attempts" }],
    ["IN", { country: "India", threatLevel: "low", commonAttacks: ["scanning"], notes: "Automated scanning activity" }],
    ["DE", { country: "Germany", threatLevel: "low", commonAttacks: ["scanner"], notes: "Security research" }],
    ["NL", { country: "Netherlands", threatLevel: "low", commonAttacks: ["scanner"], notes: "Hosting provider scanning" }],
    ["VN", { country: "Vietnam", threatLevel: "medium", commonAttacks: ["brute_force", "exploitation"], notes: "Increasing threat activity" }],
    ["ID", { country: "Indonesia", threatLevel: "low", commonAttacks: ["scanner"], notes: "Automated scanning" }],
    ["KR", { country: "South Korea", threatLevel: "low", commonAttacks: ["scanner"], notes: "Automated scanning" }],
  ]);

const BLOCK_DURATION = 60 * 60 * 1000;
const UPDATE_INTERVAL = 60 * 60 * 1000;

function initializeThreatIntel(): void {
  if (globalThis.__lastIntelUpdate) return;
  globalThis.__lastIntelUpdate = Date.now();

  if (!globalThis.__intelUpdateInterval) {
    globalThis.__intelUpdateInterval = setInterval(() => {
      updateThreatIntelligence();
    }, UPDATE_INTERVAL);
  }
}

function updateThreatIntelligence(): void {
  const now = Date.now();
  for (const [ip, entry] of ipBlocklist) {
    if (entry.expiresAt && now > entry.expiresAt) {
      ipBlocklist.delete(ip);
    }
  }
  globalThis.__lastIntelUpdate = now;
}

initializeThreatIntel();

export function addIPToBlocklist(params: {
  ip: string;
  reason: string;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
  durationMs?: number;
}): void {
  const entry: ThreatIntelEntry = {
    ip: params.ip,
    reason: params.reason,
    addedAt: Date.now(),
    expiresAt: params.durationMs ? Date.now() + params.durationMs : undefined,
    source: params.source,
    severity: params.severity,
  };
  ipBlocklist.set(params.ip, entry);
}

export function removeIPFromBlocklist(ip: string): boolean {
  return ipBlocklist.delete(ip);
}

export function isIPThreat(ip: string): {
  blocked: boolean;
  entry?: ThreatIntelEntry;
} {
  const entry = ipBlocklist.get(ip);
  if (entry) {
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      ipBlocklist.delete(ip);
      return { blocked: false };
    }
    return { blocked: true, entry };
  }
  return { blocked: false };
}

export function getBlockedIPs(): ThreatIntelEntry[] {
  const now = Date.now();
  const entries: ThreatIntelEntry[] = [];

  for (const [ip, entry] of ipBlocklist) {
    if (entry.expiresAt && now > entry.expiresAt) {
      ipBlocklist.delete(ip);
      continue;
    }
    entries.push(entry);
  }

  return entries.sort((a, b) => b.addedAt - a.addedAt);
}

export function matchBotSignature(userAgent: string): {
  detected: boolean;
  signature?: BotSignature;
  threatLevel: "none" | "low" | "medium" | "high";
} {
  for (const sig of botSignatures) {
    if (sig.pattern.test(userAgent)) {
      const threatLevel =
        sig.severity === "critical" ? "high" :
        sig.severity === "high" ? "high" :
        sig.severity === "medium" ? "medium" : "low";
      return { detected: true, signature: sig, threatLevel };
    }
  }
  return { detected: false, threatLevel: "none" };
}

export function addBotSignature(signature: BotSignature): void {
  botSignatures.push(signature);
}

export function getGeoThreatData(countryCode: string): GeoThreatData | undefined {
  return geoThreatData.get(countryCode.toUpperCase());
}

export function setGeoThreatData(data: GeoThreatData): void {
  geoThreatData.set(data.country.toUpperCase(), data);
}

export function getThreatLevelScore(level: ThreatLevel): number {
  const scores: Record<ThreatLevel, number> = {
    none: 0,
    low: 25,
    medium: 50,
    high: 75,
    critical: 100,
  };
  return scores[level];
}

export function calculateCompositeThreatScore(params: {
  ip?: string;
  userAgent?: string;
  requestCount?: number;
  failedAttempts?: number;
  suspiciousPatterns?: number;
}): {
  score: number;
  level: ThreatLevel;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  if (params.ip) {
    const { blocked, entry } = isIPThreat(params.ip);
    if (blocked && entry) {
      score += getThreatLevelScore(entry.severity);
      factors.push(`IP in blocklist: ${entry.reason}`);
    }

    const geoData = getGeoThreatData(params.ip);
    if (geoData) {
      const geoScore = getThreatLevelScore(geoData.threatLevel) * 0.3;
      score += geoScore;
      factors.push(`Geo threat: ${geoData.country}`);
    }
  }

  if (params.userAgent) {
    const botResult = matchBotSignature(params.userAgent);
    if (botResult.detected && botResult.signature) {
      score += getThreatLevelScore(botResult.signature.severity) * 0.5;
      factors.push(`Bot detected: ${botResult.signature.name}`);
    }
  }

  if (params.requestCount && params.requestCount > 100) {
    score += 15;
    factors.push(`High request volume: ${params.requestCount}`);
  }

  if (params.failedAttempts && params.failedAttempts > 5) {
    score += 20;
    factors.push(`Multiple failed attempts: ${params.failedAttempts}`);
  }

  if (params.suspiciousPatterns && params.suspiciousPatterns > 0) {
    score += params.suspiciousPatterns * 10;
    factors.push(`Suspicious patterns: ${params.suspiciousPatterns}`);
  }

  const finalScore = Math.min(100, score);
  let level: ThreatLevel = "none";
  if (finalScore >= 90) level = "critical";
  else if (finalScore >= 70) level = "high";
  else if (finalScore >= 40) level = "medium";
  else if (finalScore > 0) level = "low";

  return { score: finalScore, level, factors };
}

export function getThreatIntelligenceStats() {
  return {
    blockedIPs: ipBlocklist.size,
    permanentBlocks: Array.from(ipBlocklist.values()).filter((e) => !e.expiresAt).length,
    temporaryBlocks: Array.from(ipBlocklist.values()).filter((e) => e.expiresAt).length,
    botSignatures: botSignatures.length,
    geoThreatEntries: geoThreatData.size,
    lastUpdate: globalThis.__lastIntelUpdate,
  };
}
