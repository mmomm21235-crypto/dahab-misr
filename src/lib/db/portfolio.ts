import { prisma } from "./prisma";

export interface PortfolioHolding {
  id: string;
  name: string;
  karat: number;
  weight: number;
  buyPrice: number;
  buyDate: string;
  notes: string | null;
}

export async function getPortfolioHoldings(userId: string): Promise<PortfolioHolding[]> {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    orderBy: { buyDate: "desc" },
    select: {
      id: true,
      name: true,
      karat: true,
      weight: true,
      buyPrice: true,
      buyDate: true,
      notes: true,
    },
  });

  return holdings.map((h) => ({
    id: h.id,
    name: h.name,
    karat: h.karat,
    weight: h.weight,
    buyPrice: h.buyPrice,
    buyDate: h.buyDate.toISOString(),
    notes: h.notes,
  }));
}

export async function createPortfolioHolding(
  userId: string,
  data: { name: string; karat: number; weight: number; buyPrice: number; buyDate?: string; notes?: string }
): Promise<PortfolioHolding> {
  const holding = await prisma.portfolioHolding.create({
    data: {
      userId,
      name: data.name,
      karat: data.karat,
      weight: data.weight,
      buyPrice: data.buyPrice,
      buyDate: data.buyDate ? new Date(data.buyDate) : new Date(),
      notes: data.notes ?? null,
    },
    select: {
      id: true,
      name: true,
      karat: true,
      weight: true,
      buyPrice: true,
      buyDate: true,
      notes: true,
    },
  });

  return {
    id: holding.id,
    name: holding.name,
    karat: holding.karat,
    weight: holding.weight,
    buyPrice: holding.buyPrice,
    buyDate: holding.buyDate.toISOString(),
    notes: holding.notes,
  };
}

export async function updatePortfolioHolding(
  id: string,
  userId: string,
  data: Partial<{ name: string; karat: number; weight: number; buyPrice: number; buyDate: string; notes: string }>
): Promise<PortfolioHolding | null> {
  const existing = await prisma.portfolioHolding.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const holding = await prisma.portfolioHolding.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.karat !== undefined && { karat: data.karat }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.buyPrice !== undefined && { buyPrice: data.buyPrice }),
      ...(data.buyDate !== undefined && { buyDate: new Date(data.buyDate) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    select: {
      id: true,
      name: true,
      karat: true,
      weight: true,
      buyPrice: true,
      buyDate: true,
      notes: true,
    },
  });

  return {
    id: holding.id,
    name: holding.name,
    karat: holding.karat,
    weight: holding.weight,
    buyPrice: holding.buyPrice,
    buyDate: holding.buyDate.toISOString(),
    notes: holding.notes,
  };
}

export async function deletePortfolioHolding(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.portfolioHolding.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.portfolioHolding.delete({ where: { id } });
  return true;
}
