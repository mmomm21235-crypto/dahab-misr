import { NextResponse } from "next/server";
import { logAlertTrigger, getAlertHistory } from "@/lib/db/alert-history";
import { withSecurity } from "@/lib/api-security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const VALID_KARATS = ["24", "21", "18", "pound"] as const;
const VALID_CONDITIONS = ["above", "below"] as const;

export const GET = withSecurity(async () => {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const history = await getAlertHistory(userId, 50);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true });

export const POST = withSecurity(async (req) => {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (
      !body ||
      !VALID_KARATS.includes(body.karat) ||
      !VALID_CONDITIONS.includes(body.condition) ||
      typeof body.targetPrice !== "number" ||
      typeof body.currentPrice !== "number"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const entry = await logAlertTrigger({
      karat: body.karat,
      targetPrice: body.targetPrice,
      currentPrice: body.currentPrice,
      condition: body.condition,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to log alert" },
      { status: 500 }
    );
  }
}, { rateLimit: "api", requireAuth: true });
