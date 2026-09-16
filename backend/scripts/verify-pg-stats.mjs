import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL,
      },
    },
  });

  try {
    const statsCount = await prisma.$queryRawUnsafe("SELECT count(*) as count FROM pg_stat_statements");
    console.log("pg_stat_statements query count:", statsCount);

    console.log("Running ANALYZE on database...");
    await prisma.$executeRawUnsafe("ANALYZE");
    console.log("ANALYZE completed successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(console.error);
