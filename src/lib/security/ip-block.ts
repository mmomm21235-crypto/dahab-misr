const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, { count: number; firstSeen: number }>();

const SUSPICIOUS_THRESHOLD = 100;
const BLOCK_DURATION = 60 * 60 * 1000;

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function trackSuspiciousActivity(ip: string): boolean {
  const now = Date.now();
  const entry = suspiciousActivity.get(ip);

  if (!entry || now - entry.firstSeen > 60000) {
    suspiciousActivity.set(ip, { count: 1, firstSeen: now });
    return false;
  }

  entry.count++;
  if (entry.count >= SUSPICIOUS_THRESHOLD) {
    blockedIPs.add(ip);
    setTimeout(() => blockedIPs.delete(ip), BLOCK_DURATION);
    return true;
  }
  return false;
}

export function blockIP(ip: string, durationMs?: number): void {
  blockedIPs.add(ip);
  if (durationMs) {
    setTimeout(() => blockedIPs.delete(ip), durationMs);
  } else {
    setTimeout(() => blockedIPs.delete(ip), BLOCK_DURATION);
  }
}

export function unblockIP(ip: string): boolean {
  return blockedIPs.delete(ip);
}

export function getSecurityStats() {
  return {
    blockedIPs: blockedIPs.size,
    suspiciousIPs: suspiciousActivity.size,
  };
}
