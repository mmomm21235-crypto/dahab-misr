import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const url =
    process.env.NODE_ENV === "production"
      ? datasourceUrl + (datasourceUrl.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=5"
      : datasourceUrl;

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
