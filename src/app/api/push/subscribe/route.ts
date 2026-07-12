import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";
import { prisma } from "@/lib/db/prisma";

export const POST = withSecurity(async (req) => {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.subscription) {
      return NextResponse.json({ success: false, error: "Missing subscription" }, { status: 400 });
    }

    const subscriptionJson = JSON.stringify(body.subscription);

    await prisma.userSettings.upsert({
      where: { userId },
      update: { pushSubscription: subscriptionJson },
      create: {
        userId,
        pushSubscription: subscriptionJson,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}, { rateLimit: "push", requireAuth: true });
