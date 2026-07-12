import { getSession } from "./auth";

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL environment variable is required in production");
    }
    throw new Error("ADMIN_EMAIL environment variable is not set. Set it in .env.local");
  }
  return email;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.email) return false;
  try {
    return session.user.email === getAdminEmail();
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED");
  }
}

export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength).replace(/[<>"'&]/g, "");
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}
