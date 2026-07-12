import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
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
}
