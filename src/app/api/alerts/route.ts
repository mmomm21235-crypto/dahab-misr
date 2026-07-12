import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserAlerts, createAlert, deleteAlert } from "@/lib/db/alerts";
import { withSecurity } from "@/lib/api-security";

const VALID_KARATS = [24, 21, 18, "pound"] as const;
const VALID_CONDITIONS = ["above", "below"] as const;

export const GET = withSecurity(async () => {
  try {
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const alerts = await getUserAlerts(userId);
    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}, { rateLimit: "api" });

export const POST = withSecurity(async (req) => {
  try {
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body || !VALID_KARATS.includes(body.karat) || !VALID_CONDITIONS.includes(body.condition) || typeof body.targetPrice !== "number" || body.targetPrice <= 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const alert = await createAlert(userId, body);
    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (error) {
    console.error("POST alert error:", error);
    return NextResponse.json({ success: false, error: "Failed to create alert" }, { status: 500 });
  }
}, { rateLimit: "api" });

export const DELETE = withSecurity(async (req) => {
  try {
    const session = await getSession();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Invalid alert ID" }, { status: 400 });
    }
    await deleteAlert(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE alert error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete alert" }, { status: 500 });
  }
}, { rateLimit: "api" });
