"use server";

import { cookies } from "next/headers";

export async function getCsrfToken() {
  try {
    const base = process.env.NEXTAUTH_URL || "https://dahab-misr.vercel.app";
    const res = await fetch(`${base}/api/auth/csrf`, { cache: "no-store" });

    const data = await res.json();
    const token = data.csrfToken || "";

    const setCookie = res.headers.get("set-cookie");
    if (setCookie && token) {
      const match = setCookie.match(/next-auth\.csrf-token=([^;]+)/);
      if (match) {
        const c = await cookies();
        c.set("next-auth.csrf-token", decodeURIComponent(match[1]), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        });
      }
    }

    return token;
  } catch {
    return "";
  }
}
