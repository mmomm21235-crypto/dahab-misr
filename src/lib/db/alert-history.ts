import { prisma } from "./prisma";

export interface LogAlertTriggerData {
  userId?: string;
  karat: string;
  targetPrice: number;
  currentPrice: number;
  condition: string;
}

export async function logAlertTrigger(data: LogAlertTriggerData) {
  return prisma.alertHistory.create({
    data: {
      userId: data.userId ?? null,
      karat: data.karat,
      targetPrice: data.targetPrice,
      currentPrice: data.currentPrice,
      condition: data.condition,
    },
  });
}

export async function getAlertHistory(userId?: string, limit = 50) {
  const where = userId ? { userId } : {};
  return prisma.alertHistory.findMany({
    where,
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });
}
