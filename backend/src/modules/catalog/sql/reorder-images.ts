/**
 * Raw SQL for batch reordering property images in a single statement.
 * Uses PostgreSQL unnest($1::text[]) WITH ORDINALITY to map image IDs to 0-based indices.
 */
export const REORDER_PROPERTY_IMAGES_SQL = `
UPDATE "PropertyImage" p
SET "order" = v.ord - 1
FROM unnest($1::text[]) WITH ORDINALITY AS v(id, ord)
WHERE p.id = v.id AND p."propertyId" = $2;
`;

export async function reorderPropertyImagesSql(
  client: { $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> },
  propertyId: string,
  imageIds: string[]
): Promise<number> {
  return client.$executeRawUnsafe(REORDER_PROPERTY_IMAGES_SQL, imageIds, propertyId);
}
