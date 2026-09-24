import { env, BUSINESS_CONSTANTS } from "../../../config/index.js";
import { logger } from "../../../shared/logger/index.js";

export interface PropertyEmbeddingContext {
  titleEn?: string | null;
  descriptionEn?: string | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaNameEn?: string | null;
  amenities?: string[];
}

/**
 * Normalizes a vector to unit length (L2 norm = 1.0).
 * Governed by AI.md §2: Truncated MRL vectors have norm ~0.701, requiring
 * mandatory manual L2 re-normalization before storage in pgvector.
 */
export function l2Normalize(vector: number[]): number[] {
  let sumSquares = 0;
  for (let i = 0; i < vector.length; i++) {
    const val = vector[i] ?? 0;
    sumSquares += val * val;
  }
  const norm = Math.sqrt(sumSquares);
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
}

/**
 * Convert number of bedrooms to English word representation per SEARCH.md §7.
 */
function bedroomsToWords(num: number): string {
  const words: Record<number, string> = {
    0: "studio",
    1: "one bedroom",
    2: "two bedrooms",
    3: "three bedrooms",
    4: "four bedrooms",
    5: "five bedrooms",
    6: "six bedrooms",
    7: "seven bedrooms",
    8: "eight bedrooms",
  };
  return words[num] || `${num} bedrooms`;
}

/**
 * Compose canonical English text for property embedding per SEARCH.md §7.
 * EXCLUDED: price numerals, coordinates, agent identity, full area guides.
 * INCLUDED: title, description, property type, bedrooms as words, area name, amenities.
 */
export function composePropertyEmbeddingText(prop: PropertyEmbeddingContext): string {
  const parts: string[] = [];

  if (prop.titleEn?.trim()) {
    parts.push(`Title: ${prop.titleEn.trim()}`);
  }

  const typeFormatted = prop.propertyType.toLowerCase().replace(/_/g, " ");
  parts.push(`Type: ${typeFormatted}`);
  parts.push(`Bedrooms: ${bedroomsToWords(prop.bedrooms)}`);

  if (prop.bathrooms > 0) {
    parts.push(`Bathrooms: ${prop.bathrooms}`);
  }

  if (prop.areaNameEn?.trim()) {
    parts.push(`Location: ${prop.areaNameEn.trim()}`);
  }

  if (prop.amenities && prop.amenities.length > 0) {
    parts.push(`Amenities: ${prop.amenities.join(", ")}`);
  }

  if (prop.descriptionEn?.trim()) {
    parts.push(`Description: ${prop.descriptionEn.trim()}`);
  }

  return parts.join(". ");
}

/**
 * Deterministic pseudo-random normalized vector generator for tests & offline fallback.
 * Uses a seed string (e.g. text input) so identical text gets identical vector.
 */
function generateDeterministicFallbackVector(seed: string, dims: number = BUSINESS_CONSTANTS.EMBEDDING_DIMENSIONS): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const vec = new Array<number>(dims);
  for (let i = 0; i < dims; i++) {
    // Xorshift PRNG
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    vec[i] = (h >>> 0) / 4294967296 - 0.5;
  }

  return l2Normalize(vec);
}

export class EmbeddingService {
  private readonly apiKey: string | undefined;
  private readonly modelName: string;
  private readonly dimensions: number;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    this.modelName = BUSINESS_CONSTANTS.EMBEDDING_MODEL; // "gemini-embedding-001"
    this.dimensions = BUSINESS_CONSTANTS.EMBEDDING_DIMENSIONS; // 1536
  }

  /**
   * Generates a 1536-dimensional L2-normalized vector for arbitrary text.
   */
  async embedText(text: string): Promise<number[]> {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(this.dimensions).fill(0);
    }

    if (!this.apiKey || process.env.NODE_ENV === "test") {
      logger.debug({ textLength: cleanText.length }, "Using deterministic fallback embedding (no GEMINI_API_KEY or test env)");
      return generateDeterministicFallbackVector(cleanText, this.dimensions);
    }

    try {
      // Google Gemini REST Embed API endpoint
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:embedContent?key=${this.apiKey}`;
      const payload = {
        model: `models/${this.modelName}`,
        content: {
          parts: [{ text: cleanText }],
        },
        outputDimensionality: this.dimensions,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn({ status: response.status, errorText }, "Gemini embedding API call returned non-200. Falling back to deterministic vector.");
        return generateDeterministicFallbackVector(cleanText, this.dimensions);
      }

      const data = (await response.json()) as {
        embedding?: { values?: number[] };
      };

      const values = data.embedding?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new Error("Invalid response format from Gemini embedding API: missing values array");
      }

      // Mandatory manual L2 re-normalization per AI.md §2
      return l2Normalize(values.slice(0, this.dimensions));
    } catch (err) {
      logger.error({ err }, "Error generating Gemini embedding. Using resilient fallback.");
      return generateDeterministicFallbackVector(cleanText, this.dimensions);
    }
  }

  /**
   * Constructs canonical English text for a property and generates its normalized embedding.
   */
  async embedProperty(context: PropertyEmbeddingContext): Promise<number[]> {
    const text = composePropertyEmbeddingText(context);
    return this.embedText(text);
  }
}

export const embeddingService = new EmbeddingService();
