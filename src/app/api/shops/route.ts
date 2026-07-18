import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, sanitizeString, validatePhone } from "@/lib/admin";
import { withSecurity } from "@/lib/api-security";

export const GET = withSecurity(async () => {
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        whatsapp: true,
        address: true,
        location: true,
      },
    });
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch shops" }, { status: 500 });
  }
}, { rateLimit: "shops" });

export const POST = withSecurity(async (req) => {
  try {
    await requireAdmin();

    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const phone = sanitizeString(body.phone, 20);
    const whatsapp = sanitizeString(body.whatsapp, 20);
    const address = sanitizeString(body.address, 300);
    const location = sanitizeString(body.location, 500);

    if (!name || !phone || !address) {
      return NextResponse.json(
        { success: false, error: "الاسم والتليفون والعنوان مطلوبين" },
        { status: 400 }
      );
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: "رقم التليفون غير صحيح" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        phone,
        whatsapp: whatsapp || phone,
        address,
        location: location || null,
      },
    });
    return NextResponse.json({
      success: true,
      data: {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        whatsapp: shop.whatsapp,
        address: shop.address,
        location: shop.location,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Failed to create shop" }, { status: 500 });
  }
}, { rateLimit: "shops" });
