import { prisma } from "../../../shared/database/prisma.js";
import {
  executeHybridSearchSql,
  executeSearchClustersSql,
  type SearchSqlFilters,
  type HybridSearchSqlParams,
  type ClusterRow,
} from "../sql/index.js";

export class SearchRepository {
  /**
   * Executes hybrid search over SQL and hydrates full Property records
   * preserving the exact RRF score rank order.
   */
  async findHybridProperties(params: HybridSearchSqlParams) {
    const { ids, total } = await executeHybridSearchSql(params);

    if (ids.length === 0) {
      return { properties: [], total };
    }

    // Fetch full records with relationships via Prisma
    const properties = await prisma.property.findMany({
      where: { id: { in: ids } },
      include: {
        area: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    // Re-sort to preserve the exact RRF score rank ordering from the SQL query
    const idToProperty = new Map(properties.map((p) => [p.id, p]));
    const orderedProperties = ids
      .map((id) => idToProperty.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    return { properties: orderedProperties, total };
  }

  /**
   * Fetches server-side spatial cluster aggregations.
   */
  async findClusters(filters: SearchSqlFilters, gridSize = 0.05): Promise<ClusterRow[]> {
    return executeSearchClustersSql(filters, gridSize);
  }
}

export const searchRepository = new SearchRepository();
