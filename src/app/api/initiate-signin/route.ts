import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";

function parseCookies(setCookie: string): string {
  return setCookie
    .split(",")
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

const ALLOWED_HOSTS = ["dahab-misr.vercel.app", "localhost"];

async function handleSignin() {
  const base = process.env.NEXTAUTH_URL || "https://dahab-misr.vercel.app";

  try {
    const csrfRes = await fetch(`${base}/api/auth/csrf`, {
      cache: "no-store",
    });
    const { csrfToken } = await csrfRes.json();
    const csrfSetCookie = csrfRes.headers.get("set-cookie") || "";
    const cookieHeader = parseCookies(csrfSetCookie);

    const signinRes = await fetch(`${base}/api/auth/signin/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: new URLSearchParams({ csrfToken, callbackUrl: "/", json: "true" }),
      redirect: "manual",
    });

    const data = await signinRes.json();
    const redirectUrl = data.url;

    if (!redirectUrl || redirectUrl.includes("csrf=true")) {
      return NextResponse.redirect(new URL("/auth/signin?error=AuthFailed", base), { status: 303 });
    }

    // Validate redirect URL to prevent open redirect
    try {
      const url = new URL(redirectUrl);
      if (!ALLOWED_HOSTS.includes(url.hostname)) {
        return NextResponse.redirect(new URL("/auth/signin?error=InvalidRedirect", base), { status: 303 });
      }
    } catch {
      return NextResponse.redirect(new URL("/auth/signin?error=InvalidRedirect", base), { status: 303 });
    }

    const response = NextResponse.redirect(redirectUrl, { status: 303 });
    const setCookie = signinRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("Set-Cookie", setCookie);
    }

    return response;
  } catch (err) {
    return NextResponse.redirect(new URL("/auth/signin?error=ServerError", base), { status: 303 });
  }
}

export const GET = withSecurity(async () => {
  return handleSignin();
}, { rateLimit: "auth" });

export const POST = withSecurity(async () => {
  return handleSignin();
}, { rateLimit: "auth" });
