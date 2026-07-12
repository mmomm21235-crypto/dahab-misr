import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";
import { prisma } from "@/lib/db/prisma";

export const POST = withSecurity(async () => {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.userSettings.update({
      where: { userId },
      data: { pushSubscription: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}, { rateLimit: "push", requireAuth: true });
