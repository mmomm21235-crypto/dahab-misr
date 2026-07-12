import { getSession } from "./auth";

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL environment variable is required in production");
    }
    return "mmomm21235@gmail.com"; // Dev only
  }
  return email;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.email) return false;
  return session.user.email === getAdminEmail();
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED");
  }
}

export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}
