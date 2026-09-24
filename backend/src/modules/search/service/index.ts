import { searchRepository } from "../repository/search.repository.js";
import { queryUnderstandingService } from "../../ai/service/query-understanding.service.js";
import { embeddingService } from "../../ai/service/embedding.service.js";
import { logger } from "../../../shared/logger/index.js";
import type {
  SearchPropertiesResponseDto,
  SearchClustersResponseDto,
  SearchPropertyItemDto,
  SearchFilterChipDto,
  ListingIntent,
  PropertyType,
} from "../types/index.js";

export interface SearchPropertiesParams {
  q?: string;
  intent?: ListingIntent;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  areaId?: string;
  amenities?: string | string[];
  bounds?: string;
  cursor?: string;
  limit?: number;
}

export class SearchService {
  /**
   * Orchestrates the 4-arm hybrid search:
   * Query Understanding -> Structured Filters + Spatial PostGIS + Lexical FTS + Semantic pgvector -> RRF
   * Governed by SEARCH.md §2-6.
   */
  async searchProperties(params: SearchPropertiesParams): Promise<SearchPropertiesResponseDto> {
    const rawQuery = params.q?.trim();
    let textToEmbed = "";
    let lexicalQuery = "";
    let chips: SearchFilterChipDto[] = [];
    let degraded = false;

    // 1. Query Understanding & Extraction
    let mergedIntent = params.intent;
    let mergedType = params.propertyType;
    let mergedMinPrice = params.minPrice !== undefined ? BigInt(params.minPrice) : undefined;
    let mergedMaxPrice = params.maxPrice !== undefined ? BigInt(params.maxPrice) : undefined;
    let mergedBedrooms = params.bedrooms;
    let mergedAreaId = params.areaId;

    if (rawQuery) {
      const parsed = await queryUnderstandingService.parseQuery(rawQuery);
      chips = parsed.chips;

      // Merge: explicit query params override parsed chips if both present
      if (!mergedIntent && parsed.filters.intent) mergedIntent = parsed.filters.intent;
      if (!mergedType && parsed.filters.propertyType) mergedType = parsed.filters.propertyType;
      if (mergedMinPrice === undefined && parsed.filters.minPrice !== undefined) mergedMinPrice = parsed.filters.minPrice;
      if (mergedMaxPrice === undefined && parsed.filters.maxPrice !== undefined) mergedMaxPrice = parsed.filters.maxPrice;
      if (mergedBedrooms === undefined && parsed.filters.bedrooms !== undefined) mergedBedrooms = parsed.filters.bedrooms;
      if (!mergedAreaId && parsed.filters.areaId) mergedAreaId = parsed.filters.areaId;

      textToEmbed = parsed.residualText || rawQuery;
      lexicalQuery = parsed.residualText || rawQuery;
    }

    // 2. Vector Generation (with degradation resilience per SEARCH.md §11)
    let vector: number[] | null = null;
    if (textToEmbed) {
      try {
        vector = await embeddingService.embedText(textToEmbed);
      } catch (err) {
        logger.warn({ err }, "Embedding generation failed. Degrading to lexical + structured search.");
        degraded = true;
        vector = null;
      }
    }

    // 3. Parse Spatial Bounding Box
    let boundsParsed: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null = null;
    if (params.bounds) {
      const parts = params.bounds.split(",").map((p) => parseFloat(p.trim()));
      if (
        parts.length === 4 &&
        typeof parts[0] === "number" && !isNaN(parts[0]) &&
        typeof parts[1] === "number" && !isNaN(parts[1]) &&
        typeof parts[2] === "number" && !isNaN(parts[2]) &&
        typeof parts[3] === "number" && !isNaN(parts[3])
      ) {
        boundsParsed = {
          minLng: parts[0],
          minLat: parts[1],
          maxLng: parts[2],
          maxLat: parts[3],
        };
      }
    }

    const limit = Math.min(Math.max(params.limit || 20, 1), 50);
    const offset = 0; // Cursor pagination offset in v1

    // 4. Execute Repository Hybrid Search
    const { properties, total } = await searchRepository.findHybridProperties({
      filters: {
        intent: mergedIntent,
        propertyType: mergedType,
        minPrice: mergedMinPrice,
        maxPrice: mergedMaxPrice,
        bedrooms: mergedBedrooms,
        areaId: mergedAreaId,
        bounds: boundsParsed,
      },
      textQuery: lexicalQuery || null,
      vector,
      limit,
      offset,
    });

    // 5. Map to DTOs
    const items: SearchPropertyItemDto[] = properties.map((p) => {
      const cover = p.images.find((img) => img.isCover) || p.images[0];
      return {
        id: p.id,
        slug: p.slug,
        titleEn: p.titleEn || "Verified Property",
        descriptionEn: p.descriptionEn,
        propertyType: p.propertyType,
        listingIntent: p.listingIntent,
        price: p.price.toString(),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: p.areaSqm.toString(),
        status: p.status,
        featured: p.featured,
        latitude: p.latitude,
        longitude: p.longitude,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        area: {
          id: p.area.id,
          slug: p.area.slug,
          nameEn: p.area.nameEn,
        },
        coverImage: cover?.url,
        images: p.images.map((img) => ({
          id: img.id,
          url: img.url,
          captionEn: img.captionEn,
          isCover: img.isCover,
          order: img.order,
        })),
        amenities: p.amenities.map((a) => a.amenity.nameEn),
      };
    });

    const hasMore = total > offset + limit;
    const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
    const nextCursor = hasMore && lastItem ? lastItem.id : null;

    return {
      items,
      total,
      chips,
      residualQuery: textToEmbed || undefined,
      degraded,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Fetches spatial cluster aggregations for low-zoom map viewports.
   */
  async getClusters(params: SearchPropertiesParams): Promise<SearchClustersResponseDto> {
    let boundsParsed: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null = null;
    if (params.bounds) {
      const parts = params.bounds.split(",").map((p) => parseFloat(p.trim()));
      if (
        parts.length === 4 &&
        typeof parts[0] === "number" && !isNaN(parts[0]) &&
        typeof parts[1] === "number" && !isNaN(parts[1]) &&
        typeof parts[2] === "number" && !isNaN(parts[2]) &&
        typeof parts[3] === "number" && !isNaN(parts[3])
      ) {
        boundsParsed = {
          minLng: parts[0],
          minLat: parts[1],
          maxLng: parts[2],
          maxLat: parts[3],
        };
      }
    }

    const clusters = await searchRepository.findClusters(
      {
        intent: params.intent,
        propertyType: params.propertyType,
        minPrice: params.minPrice !== undefined ? BigInt(params.minPrice) : null,
        maxPrice: params.maxPrice !== undefined ? BigInt(params.maxPrice) : null,
        bedrooms: params.bedrooms,
        areaId: params.areaId,
        bounds: boundsParsed,
      },
      0.05
    );

    const total = clusters.reduce((acc, c) => acc + c.count, 0);

    return {
      clusters,
      total,
    };
  }
}

export const searchService = new SearchService();
