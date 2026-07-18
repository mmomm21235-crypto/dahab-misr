import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { logAlertTrigger } from "@/lib/db/alert-history";
import type { GoldPrices } from "@/types";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:dahab-misr@example.com";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushNotification(
  subscriptionJson: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureConfigured()) return { success: false, error: "VAPID not configured" };

  let subscription: PushSubscription;
  try {
    subscription = JSON.parse(subscriptionJson);
  } catch {
    return { success: false, error: "Invalid subscription JSON" };
  }

  try {
    const result = await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/",
        dir: "rtl",
        lang: "ar",
      })
    );
    return { success: true, statusCode: result.statusCode };
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, error: "subscription_expired", statusCode: err.statusCode };
    }
    return { success: false, error: "send_failed", statusCode: err.statusCode };
  }
}

function getKaratLabel(karat: string): string {
  const labels: Record<string, string> = {
    "24": "عيار 24",
    "21": "عيار 21",
    "18": "عيار 18",
    pound: "الجنيه الذهب",
  };
  return labels[karat] ?? karat;
}

function getCurrentPrice(prices: GoldPrices, karat: string): number {
  if (karat === "24") return prices.karat24.buyPrice;
  if (karat === "21") return prices.karat21.buyPrice;
  if (karat === "18") return prices.karat18.buyPrice;
  if (karat === "pound") return prices.pound.buyPrice;
  return 0;
}

export async function checkAlertsAndNotify(prices: GoldPrices) {
  const BATCH_SIZE = 50;

  for (let offset = 0; ; offset += BATCH_SIZE) {
    const alerts = await prisma.alert.findMany({
      where: { isActive: true, notified: false },
      include: { user: { include: { settings: true } } },
      take: BATCH_SIZE,
      skip: offset,
    });

    if (alerts.length === 0) break;

    const triggeredAlerts = alerts.filter((alert) => {
      const currentPrice = getCurrentPrice(prices, alert.karat);
      if (currentPrice <= 0) return false;
      return (
        (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice <= alert.targetPrice)
      );
    });

    if (triggeredAlerts.length > 0) {
      await prisma.alert.updateMany({
        where: { id: { in: triggeredAlerts.map((a) => a.id) } },
        data: { notified: true, triggeredAt: new Date() },
      });

      await Promise.allSettled(
        triggeredAlerts.map(async (alert) => {
          const currentPrice = getCurrentPrice(prices, alert.karat);

          await logAlertTrigger({
            userId: alert.userId,
            karat: alert.karat,
            targetPrice: alert.targetPrice,
            currentPrice,
            condition: alert.condition,
          });

          if (!alert.user.settings?.pushSubscription) return;
          const karatLabel = getKaratLabel(alert.karat);
          const direction = alert.condition === "above" ? "ارتفع" : "انخفض";
          await sendPushNotification(alert.user.settings.pushSubscription, {
            title: "تنبيه أسعار الذهب",
            body: `${karatLabel} ${direction} إلى ${currentPrice.toLocaleString("ar-EG")} ج.م`,
            url: "/alerts",
          });
        })
      );
    }

    if (alerts.length < BATCH_SIZE) break;
  }
}
