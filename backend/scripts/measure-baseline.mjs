import { prisma } from "../dist/shared/database/prisma.js";

async function measure() {
  console.log("===============================================================================");
  console.log("Settly Backend: Database Performance Baseline Measurements (Step 1)");
  console.log("===============================================================================\n");

  console.log("Testing direct Prisma query timings (current DATABASE_URL mode)...\n");

  // 1. SELECT 1 Warmup
  const t0 = performance.now();
  await prisma.$queryRawUnsafe("SELECT 1");
  const d0 = Math.round(performance.now() - t0);
  console.log(`Warmup SELECT 1: ${d0}ms`);

  // 2. 5 warm findFirst iterations
  const findTimes = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await prisma.property.findFirst({
      relationLoadStrategy: "join",
      include: { area: true, images: true }
    });
    const dur = Math.round(performance.now() - start);
    findTimes.push(dur);
  }
  const minFind = Math.min(...findTimes);
  const maxFind = Math.max(...findTimes);
  const avgFind = Math.round(findTimes.reduce((a, b) => a + b, 0) / findTimes.length);
  console.log(`findFirst with join (5 runs): min=${minFind}ms, avg=${avgFind}ms, max=${maxFind}ms (runs: ${findTimes.join(", ")}ms)`);

  // 3. Interactive Transaction ($transaction with 1 read)
  const txTimes = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await prisma.$transaction(async (tx) => {
      return await tx.property.findFirst({ select: { id: true, status: true } });
    });
    const dur = Math.round(performance.now() - start);
    txTimes.push(dur);
  }
  console.log(`Interactive tx (BEGIN; 1 read; COMMIT) (3 runs): ${txTimes.join(", ")}ms`);

  // 4. Test running API endpoint if available on port 4000
  try {
    const res = await fetch("http://localhost:4000/api/v1/properties?limit=10");
    if (res.ok) {
      const json = await res.json();
      console.log(`\nLive API GET /api/v1/properties?limit=10 returned 200 OK (${json.items?.length ?? 0} items)`);
    }
  } catch {
    console.log("\nNote: Port 4000 not currently answering HTTP fetch directly from script.");
  }

  await prisma.$disconnect();
  console.log("\nBaseline measurement complete.");
}

measure().catch(err => {
  console.error("Baseline measurement failed:", err);
  process.exit(1);
});
