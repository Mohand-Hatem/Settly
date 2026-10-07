// Raw SQL queries for payments module (CLAUDE.md: raw SQL lives only in sql/).

type RawQueryClient = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

export const PAYMENTS_QUERIES = {
  healthCheck: "SELECT 1 AS alive",
};

/**
 * Per-user transaction-scoped advisory lock for count invariants and subscription state.
 * Shared namespace (hashtext(userId)). Released automatically at COMMIT or ROLLBACK.
 */
export async function lockUser(tx: RawQueryClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
}
