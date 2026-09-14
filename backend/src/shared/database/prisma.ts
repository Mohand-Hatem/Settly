import { PrismaClient } from "@prisma/client";

declare global {
  var __settly_prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__settly_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__settly_prisma = prisma;
}

export default prisma;
