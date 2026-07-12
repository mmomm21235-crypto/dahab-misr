import { prisma } from "./prisma";
import type { PriceAlert } from "@/types";

const karatMap: Record<string, "K24" | "K21" | "K18" | "POUND"> = {
  "24": "K24",
  "21": "K21",
  "18": "K18",
  pound: "POUND",
};

const reverseKaratMap: Record<string, 24 | 21 | 18 | "pound"> = {
  K24: 24,
  K21: 21,
  K18: 18,
  POUND: "pound",
};

const conditionMap: Record<string, "ABOVE" | "BELOW"> = {
  above: "ABOVE",
  below: "BELOW",
};

const reverseConditionMap: Record<string, "above" | "below"> = {
  ABOVE: "above",
  BELOW: "below",
};

export async function getUserAlerts(userId: string): Promise<PriceAlert[]> {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return alerts.map((a) => ({
      id: a.id,
      karat: reverseKaratMap[a.karat],
      targetPrice: a.targetPrice,
      condition: reverseConditionMap[a.condition],
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      triggeredAt: a.triggeredAt?.toISOString(),
      notified: a.notified,
    }));
  } catch {
    return [];
  }
}

export async function createAlert(
  userId: string,
  data: { karat: 24 | 21 | 18 | "pound"; targetPrice: number; condition: "above" | "below" }
) {
  return prisma.alert.create({
    data: {
      userId,
      karat: karatMap[String(data.karat)],
      targetPrice: data.targetPrice,
      condition: conditionMap[data.condition],
    },
  });
}

export async function updateAlert(
  id: string,
  userId: string,
  data: { isActive?: boolean }
) {
  return prisma.alert.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteAlert(id: string, userId: string) {
  return prisma.alert.deleteMany({
    where: { id, userId },
  });
}
