/**
 * Raw SQL to calculate average price per square meter across properties in an area.
 * Computes price::numeric / NULLIF(areaSqm, 0) directly inside PostgreSQL.
 */
export const AREA_AVG_PRICE_PER_SQM_SQL = `
SELECT COALESCE(ROUND(AVG(p.price::numeric / NULLIF(p."areaSqm", 0))), 0)::bigint AS "avgPricePerSqm"
FROM "Property" p
WHERE p."areaId" = ANY($1::text[]) AND p.status = 'PUBLISHED';
`;

export async function getAreaAvgPricePerSqmSql(
  client: { $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> },
  areaIds: string[]
): Promise<number> {
  if (areaIds.length === 0) return 0;
  const rows = await client.$queryRawUnsafe<Array<{ avgPricePerSqm: bigint }>>(
    AREA_AVG_PRICE_PER_SQM_SQL,
    areaIds
  );
  return rows[0] ? Number(rows[0].avgPricePerSqm) : 0;
}
