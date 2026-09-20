/**
 * Raw SQL for the pipeline module (CLAUDE.md: raw SQL lives only in sql/).
 *
 * Per-user transaction-scoped advisory lock — the one shared namespace for the per-user count
 * invariants I9 / I11 / I12 / I13 (CONCURRENCY_AND_IDEMPOTENCY.md §4). Released automatically at
 * COMMIT or ROLLBACK.
 */
type RawQueryClient = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

export async function lockUser(tx: RawQueryClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
}

/** Name of the database exclusion constraint that forbids overlapping CONFIRMED viewings (R4). */
export const VIEWING_OVERLAP_CONSTRAINT = "viewing_agent_overlap_excl";
