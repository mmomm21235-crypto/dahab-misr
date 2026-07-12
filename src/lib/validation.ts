export function sanitizeString(input: string, maxLength: number = 500): string {
  return input.trim().slice(0, maxLength).replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    };
    return entities[match] || match;
  });
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validatePhone(phone: string): boolean {
  return /^\+?[0-9\s\-()]{7,20}$/.test(phone);
}

export function validateWeight(weight: unknown): weight is number {
  const w = Number(weight);
  return !isNaN(w) && w > 0 && w <= 10000;
}

export function validatePrice(price: unknown): price is number {
  const p = Number(price);
  return !isNaN(p) && p > 0 && p <= 10000000;
}

export function validateKarat(karat: unknown): karat is number {
  return [14, 18, 21, 24].includes(Number(karat));
}

export function validateId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function sanitizeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
