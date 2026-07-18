import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { sendPushNotification } from "@/lib/push-service";
import { withSecurity } from "@/lib/api-security";

const ALLOWED_URLS = [/^\/$/, /^\/calculator/, /^\/charts/, /^\/news/, /^\/alerts/, /^\/shops/];

function isSafeUrl(url: string | undefined): boolean {
  if (!url) return true;
  if (url.startsWith("http://") || url.startsWith("https://")) return false;
  return ALLOWED_URLS.some((re) => re.test(url));
}

export const POST = withSecurity(async (req) => {
  try {
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, body: messageBody, url } = body;

    if (!isSafeUrl(url)) {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings?.pushSubscription) {
      return NextResponse.json({ success: false, error: "No subscription" }, { status: 400 });
    }

    const result = await sendPushNotification(settings.pushSubscription, {
      title: String(title || "ذهب مصر").slice(0, 200),
      body: String(messageBody || "").slice(0, 500),
      url: url || "/",
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    }
    if (result.error === "subscription_expired") {
      await prisma.userSettings.update({
        where: { userId },
        data: { pushSubscription: null },
      });
      return NextResponse.json({ success: false, error: "subscription_expired" }, { status: 410 });
    }
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}, { rateLimit: "push", requireAuth: true, requireAdmin: true });
