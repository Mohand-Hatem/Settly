import type { z } from "zod";
import type {
  ListingIntentEnum,
  PropertyTypeEnum,
} from "../../catalog/schema/property.schema.js";
import { areaService } from "../../catalog/service/area.service.js";

type ListingIntent = z.infer<typeof ListingIntentEnum>;
type PropertyType = z.infer<typeof PropertyTypeEnum>;

export interface ParsedFilterChip {
  kind: "intent" | "type" | "area" | "bedrooms" | "minPrice" | "maxPrice" | "amenity";
  value: string;
  label: string;
}

export interface ParsedQuery {
  rawQuery: string;
  residualText: string;
  chips: ParsedFilterChip[];
  filters: {
    intent?: ListingIntent;
    propertyType?: PropertyType;
    areaId?: string;
    areaName?: string;
    bedrooms?: number;
    minPrice?: bigint;
    maxPrice?: bigint;
    amenities?: string[];
  };
}

interface AreaGazetteerEntry {
  id: string;
  slug: string;
  nameEn: string;
  aliases: string[];
}

let gazetteerCache: AreaGazetteerEntry[] | null = null;
let lastGazetteerFetch = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getAreaGazetteer(): Promise<AreaGazetteerEntry[]> {
  const now = Date.now();
  if (gazetteerCache && now - lastGazetteerFetch < CACHE_TTL_MS) {
    return gazetteerCache;
  }

  try {
    const res = await areaService.listAreas({});
    const areas = res.items.map((a) => ({
      id: a.id,
      slug: a.slug,
      nameEn: a.nameEn,
      aliases: a.aliases,
    }));
    gazetteerCache = areas;
    lastGazetteerFetch = now;
    return areas;
  } catch {
    return gazetteerCache || [];
  }
}

function parseNumberWithMultiplier(numStr: string, multStr?: string): number {
  const val = parseFloat(numStr);
  if (isNaN(val)) return 0;
  if (!multStr) return val;

  const m = multStr.toLowerCase().trim();
  if (m === "m" || m === "million" || m === "m." || m === "mn") {
    return Math.round(val * 1_000_000);
  }
  if (m === "k" || m === "thousand") {
    return Math.round(val * 1_000);
  }
  if (m === "b" || m === "billion") {
    return Math.round(val * 1_000_000_000);
  }
  return val;
}

const WORD_BEDROOMS: Record<string, number> = {
  studio: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};

const AMENITY_KEYWORDS: Record<string, string> = {
  pool: "Private Pool",
  "swimming pool": "Private Pool",
  "private pool": "Private Pool",
  garden: "Private Garden",
  "private garden": "Private Garden",
  terrace: "Private Terrace",
  "smart home": "Smart Home",
  gym: "Gym / Fitness",
  "maid's room": "Maid's Room",
  "maid room": "Maid's Room",
  "golf view": "Golf Frontage",
  golf: "Golf Frontage",
  "sea view": "Sea View",
};

export class QueryUnderstandingService {
  /**
   * Deterministically extracts structured filter constraints and residual intent text
   * from free-form user query strings per SEARCH.md §4.
   */
  async parseQuery(rawQuery: string): Promise<ParsedQuery> {
    const query = rawQuery.trim();
    if (!query) {
      return {
        rawQuery: "",
        residualText: "",
        chips: [],
        filters: {},
      };
    }

    let workingText = query;
    const chips: ParsedFilterChip[] = [];
    const filters: ParsedQuery["filters"] = {};

    // 1. Intent Extraction
    const saleMatch = /\b(?:for\s+sale|to\s+buy|buy)\b/i;
    const rentMatch = /\b(?:for\s+rent|to\s+rent|rent)\b/i;
    if (saleMatch.test(workingText)) {
      filters.intent = "SALE";
      chips.push({ kind: "intent", value: "SALE", label: "For Sale" });
      workingText = workingText.replace(saleMatch, " ");
    } else if (rentMatch.test(workingText)) {
      filters.intent = "RENT";
      chips.push({ kind: "intent", value: "RENT", label: "For Rent" });
      workingText = workingText.replace(rentMatch, " ");
    }

    // 2. Property Type Extraction
    const typePatterns: [RegExp, PropertyType, string][] = [
      [/\bpenthouses?\b/i, "PENTHOUSE", "Penthouse"],
      [/\bduplex(?:es)?\b/i, "DUPLEX", "Duplex"],
      [/\btownhouses?\b/i, "TOWNHOUSE", "Townhouse"],
      [/\bchalets?\b/i, "CHALET", "Chalet"],
      [/\bvillas?\b/i, "VILLA", "Villa"],
      [/\bapartments?\b/i, "APARTMENT", "Apartment"],
    ];

    for (const [regex, typeVal, label] of typePatterns) {
      if (regex.test(workingText)) {
        filters.propertyType = typeVal;
        chips.push({ kind: "type", value: typeVal, label });
        workingText = workingText.replace(regex, " ");
        break;
      }
    }

    // 3. Bedrooms Extraction
    const bedsRegex = /\b(\d+)\s*(?:beds?|bedrooms?|bdr|bd)\b/i;
    const bedsMatch = workingText.match(bedsRegex);
    if (bedsMatch && bedsMatch[1]) {
      const count = parseInt(bedsMatch[1], 10);
      filters.bedrooms = count;
      chips.push({ kind: "bedrooms", value: count.toString(), label: `${count} Bedrooms` });
      workingText = workingText.replace(bedsRegex, " ");
    } else {
      const wordBedsRegex = /\b(studio|one|two|three|four|five|six|seven)\s*(?:beds?|bedrooms?|bdr)?\b/i;
      const wordMatch = workingText.match(wordBedsRegex);
      if (wordMatch && wordMatch[1]) {
        const count = WORD_BEDROOMS[wordMatch[1].toLowerCase()];
        if (count !== undefined) {
          filters.bedrooms = count;
          chips.push({
            kind: "bedrooms",
            value: count.toString(),
            label: count === 0 ? "Studio" : `${count} Bedrooms`,
          });
          workingText = workingText.replace(wordBedsRegex, " ");
        }
      }
    }

    // 4. Price Extraction (Values extracted in EGP, converted to piastres for DB comparison: 1 EGP = 100 piastres)
    // Price range: "between 10M and 25M"
    const betweenRegex = /\b(?:between)\s*(\d+(?:\.\d+)?)\s*(m|million|k)?\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\s*(m|million|k)?(?:\s*egp)?\b/i;
    const betweenMatch = workingText.match(betweenRegex);
    if (betweenMatch && betweenMatch[1] && betweenMatch[3]) {
      const minMult = betweenMatch[2] || betweenMatch[4];
      const minVal = parseNumberWithMultiplier(betweenMatch[1], minMult);
      const maxVal = parseNumberWithMultiplier(betweenMatch[3], betweenMatch[4]);
      if (minVal > 0) {
        const minPiastres = BigInt(minVal) * 100n;
        filters.minPrice = minPiastres;
        chips.push({ kind: "minPrice", value: minPiastres.toString(), label: `Min: ${(minVal / 1e6).toFixed(1)}M EGP` });
      }
      if (maxVal > 0) {
        const maxPiastres = BigInt(maxVal) * 100n;
        filters.maxPrice = maxPiastres;
        chips.push({ kind: "maxPrice", value: maxPiastres.toString(), label: `Max: ${(maxVal / 1e6).toFixed(1)}M EGP` });
      }
      workingText = workingText.replace(betweenRegex, " ");
    } else {
      // Max price: "under 35M", "below 30 million", "max 20M"
      const maxRegex = /\b(?:under|below|max|up to|less than)\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?(?:\s*egp)?\b/i;
      const maxMatch = workingText.match(maxRegex);
      if (maxMatch && maxMatch[1]) {
        const val = parseNumberWithMultiplier(maxMatch[1], maxMatch[2]);
        if (val > 0) {
          const maxPiastres = BigInt(val) * 100n;
          filters.maxPrice = maxPiastres;
          chips.push({ kind: "maxPrice", value: maxPiastres.toString(), label: `Max: ${(val / 1e6).toFixed(1)}M EGP` });
          workingText = workingText.replace(maxRegex, " ");
        }
      }

      // Min price: "above 15M", "over 20 million", "min 10M"
      const minRegex = /\b(?:above|over|min|at least|starting from)\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?(?:\s*egp)?\b/i;
      const minMatch = workingText.match(minRegex);
      if (minMatch && minMatch[1]) {
        const val = parseNumberWithMultiplier(minMatch[1], minMatch[2]);
        if (val > 0) {
          const minPiastres = BigInt(val) * 100n;
          filters.minPrice = minPiastres;
          chips.push({ kind: "minPrice", value: minPiastres.toString(), label: `Min: ${(val / 1e6).toFixed(1)}M EGP` });
          workingText = workingText.replace(minRegex, " ");
        }
      }
    }

    // 5. Area Gazetteer Match
    const gazetteer = await getAreaGazetteer();
    for (const area of gazetteer) {
      const candidates = [area.nameEn, ...area.aliases];
      for (const name of candidates) {
        if (!name || name.length < 3) continue;
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const areaRegex = new RegExp(`(?:in|at|around)?\\s*\\b${escaped}\\b`, "i");
        if (areaRegex.test(workingText)) {
          filters.areaId = area.id;
          filters.areaName = area.nameEn;
          chips.push({ kind: "area", value: area.id, label: area.nameEn });
          workingText = workingText.replace(areaRegex, " ");
          break;
        }
      }
      if (filters.areaId) break;
    }

    // 6. Amenities Match
    for (const [kw, standardName] of Object.entries(AMENITY_KEYWORDS)) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const kwRegex = new RegExp(`(?:with(?: a)?|having)?\\s*\\b${escaped}\\b`, "i");
      if (kwRegex.test(workingText)) {
        filters.amenities = filters.amenities || [];
        if (!filters.amenities.includes(standardName)) {
          filters.amenities.push(standardName);
          chips.push({ kind: "amenity", value: standardName, label: standardName });
        }
        workingText = workingText.replace(kwRegex, " ");
      }
    }

    // Clean up residual intent text (remove prepositions, extra whitespaces)
    const cleanedResidual = workingText
      .replace(/\b(in|at|with|for|near|around|of|and|or)\b/gi, " ")
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      rawQuery: query,
      residualText: cleanedResidual,
      chips,
      filters,
    };
  }
}

export const queryUnderstandingService = new QueryUnderstandingService();
