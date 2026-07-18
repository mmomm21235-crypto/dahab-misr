import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

export const POST = withSecurity(async () => {
  const base = process.env.NEXTAUTH_URL || "https://dahab-misr.vercel.app";
  const response = NextResponse.redirect(new URL("/", base), { status: 303 });

  const cookieBase = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth."
    : "next-auth.";

  // Clear all NextAuth cookies
  const cookies = [
    `${cookieBase}session-token`,
    `${cookieBase}csrf-token`,
    `${cookieBase}callback-url`,
  ];

  for (const name of cookies) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: name.startsWith("__Secure"),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}, { rateLimit: "auth" });
