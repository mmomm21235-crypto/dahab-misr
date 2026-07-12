import { NextResponse } from "next/server";

export async function POST() {
  const base = process.env.NEXTAUTH_URL || "https://dahab-misr.vercel.app";
  const response = NextResponse.redirect(new URL("/", base), { status: 303 });

  const cookieBase = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth."
    : "next-auth.";

  // Clear all NextAuth cookies
  const cookies = [
    `${cookieBase}session-token`,
    "next-auth.csrf-token",
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
}
