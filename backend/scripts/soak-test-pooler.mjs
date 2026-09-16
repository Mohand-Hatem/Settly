import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Construct candidate pooled URL WITHOUT pgbouncer=true
const originalUrl = process.env.DATABASE_URL || "";
const testUrl = originalUrl
  .replace("&pgbouncer=true", "")
  .replace("pgbouncer=true&", "")
  .replace("pgbouncer=true", "") + "&application_name=settly-soak-test";

console.log("===============================================================================");
console.log("Settly Backend: Concurrency Soak Test (Step 2 — Pooler without pgbouncer=true)");
console.log("===============================================================================\n");
console.log("Target connection URL (pgbouncer removed):");
console.log(testUrl.replace(/:[^:@]+@/, ":***@"), "\n");

const client = new PrismaClient({
  datasources: {
    db: {
      url: testUrl,
    },
  },
  log: [{ emit: "event", level: "error" }],
});

const CONCURRENCY = 20;
const DURATION_SECONDS = 30;

let totalOperations = 0;
let totalErrors = 0;
const preparedStatementErrors = [];
const otherErrors = [];

async function worker(workerId, stopAt) {
  let ops = 0;
  while (Date.now() < stopAt) {
    try {
      const choice = Math.floor(Math.random() * 4);
      if (choice === 0) {
        // findMany with relationJoins
        await client.property.findMany({
          relationLoadStrategy: "join",
          take: 5,
          where: { status: "PUBLISHED" },
          include: { area: true, images: true },
        });
      } else if (choice === 1) {
        // findFirst / findUnique
        await client.property.findFirst({
          where: { status: { in: ["PUBLISHED", "DRAFT"] } },
          select: { id: true, slug: true, price: true },
        });
      } else if (choice === 2) {
        // $queryRaw parameterized
        const minPrice = 1000000;
        await client.$queryRaw`SELECT id, slug, price FROM "Property" WHERE price >= ${minPrice} LIMIT 5`;
      } else {
        // Interactive transaction with read-only operations
        await client.$transaction(async (tx) => {
          const p = await tx.property.findFirst({ select: { id: true, areaId: true } });
          if (p?.areaId) {
            await tx.area.findUnique({ where: { id: p.areaId }, select: { id: true, nameEn: true } });
          }
        });
      }
      ops++;
      totalOperations++;
    } catch (err) {
      totalErrors++;
      const errMsg = String(err?.message || err);
      if (
        errMsg.toLowerCase().includes("prepared statement") ||
        errMsg.toLowerCase().includes("s0") ||
        errMsg.toLowerCase().includes("s1")
      ) {
        preparedStatementErrors.push({ workerId, err: errMsg });
      } else {
        otherErrors.push({ workerId, err: errMsg });
      }
    }
  }
}

async function run() {
  console.log(`Starting ${CONCURRENCY} concurrent workers for ${DURATION_SECONDS} seconds...\n`);
  const stopAt = Date.now() + DURATION_SECONDS * 1000;

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i, stopAt));
  }

  // Progress heartbeat every 5s
  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.round((stopAt - Date.now()) / 1000));
    console.log(`  [Progress] ${remaining}s remaining... Ops completed: ${totalOperations}, Errors: ${totalErrors}`);
  }, 5000);

  await Promise.all(workers);
  clearInterval(interval);

  console.log("\n===============================================================================");
  console.log("Soak Test Summary:");
  console.log(`  Total operations completed: ${totalOperations}`);
  console.log(`  Throughput: ${(totalOperations / DURATION_SECONDS).toFixed(1)} ops/sec`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log(`  Prepared statement errors: ${preparedStatementErrors.length}`);
  console.log(`  Other errors: ${otherErrors.length}`);
  console.log("===============================================================================\n");

  await client.$disconnect();

  if (preparedStatementErrors.length > 0) {
    console.error("❌ FAILED: Detected prepared statement collision errors under connection multiplexing!");
    console.error(preparedStatementErrors.slice(0, 5));
    process.exit(1);
  }

  if (otherErrors.length > 0) {
    console.warn("⚠️ Warning: Non-prepared-statement errors encountered:", otherErrors.slice(0, 5));
  }

  console.log("✅ PASSED: 0 prepared statement errors detected. Neon pooler cleanly supports protocol prepared statements.");
}

run().catch(err => {
  console.error("Soak test crashed:", err);
  process.exit(1);
});
