import { PrismaClient, type Prisma } from "@prisma/client";
import { requestContext } from "../context/request-context.js";

declare global {
  var __settly_prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const isDev = process.env.NODE_ENV === "development";
  const slowThreshold = Number(process.env.DATABASE_SLOW_QUERY_THRESHOLD_MS || 300);
  const debugSql = process.env.DEBUG_SQL === "true";

  const client = new PrismaClient({
    log: isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "warn" },
          { emit: "stdout", level: "error" },
        ]
      : [{ emit: "stdout", level: "error" }],
  });

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).$on("query", (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      const store = requestContext.getStore();
      if (store) {
        store.dbQueryCount = (store.dbQueryCount ?? 0) + 1;
        store.dbTimeMs = (store.dbTimeMs ?? 0) + duration;
      }
      const isSlow = duration >= slowThreshold;

      if (isSlow || debugSql) {
        const color = isSlow ? "\x1b[33m" : "\x1b[36m"; // Yellow if slow, Cyan if debug
        const reset = "\x1b[0m";
        const tag = isSlow ? "[DB SLOW]" : "[DB]";
        const cleanQuery = e.query.replace(/\s+/g, " ").trim();
        const snippet = cleanQuery.length > 140 ? `${cleanQuery.slice(0, 140)}...` : cleanQuery;
        console.log(`${color}${tag} (${duration}ms)${reset} ${snippet}`);
      }
    });
  }

  return client;
}

export const prisma = globalThis.__settly_prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__settly_prisma = prisma;
}

/**
 * Pre-warms the PostgreSQL connection pool on startup
 * to eliminate initial cold connection delays.
 */
export async function warmupDatabase(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (error) {
    console.error("Database connection warmup notice:", error);
  }
}

/**
 * Disconnects the PostgreSQL connection pool gracefully during shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Database disconnect notice:", error);
  }
}

export default prisma;

