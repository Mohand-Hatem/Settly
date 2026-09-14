class RollbackSentinel extends Error {
  constructor() {
    super("__ROLLBACK_TRANSACTION_SENTINEL__");
  }
}

/**
 * Runs a test block inside an isolated Prisma interactive transaction that ALWAYS rolls back.
 * Guarantees zero pollution across parallel test suites (TESTING.md Section 2).
 */
export async function withRollback(prisma, testFn) {
  try {
    await prisma.$transaction(async (tx) => {
      await testFn(tx);
      // Force rollback by throwing sentinel error
      throw new RollbackSentinel();
    });
  } catch (err) {
    if (err instanceof RollbackSentinel || err.message === "__ROLLBACK_TRANSACTION_SENTINEL__") {
      // Clean rollback successful
      return;
    }
    throw err;
  }
}

/**
 * Serial table truncation helper for Layer 4 concurrency tests.
 * Never runs inside a transaction because concurrency races require committed concurrent transactions.
 */
export async function truncateAllTables(prisma) {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations';
  `);

  if (!tables || tables.length === 0) return;

  const tableNames = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
}
