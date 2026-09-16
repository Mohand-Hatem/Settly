import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "../../../shared/openapi/zod.js";
import { registry, ValidationProblemSchema, NotFoundProblemSchema } from "../../../shared/openapi/registry.js";
import { prisma } from "../../../shared/database/prisma.js";

export const compareRouter = Router();

// ==============================================================================
// 1. Zod Schemas for Multi-Property Compare
// ==============================================================================

export const CompareQuerySchema = z
  .object({
    ids: z
      .string()
      .min(1, "At least two property IDs must be provided")
      .openapi({
        description: "Comma-separated list of 2 to 4 property UUIDs or slugs to compare",
        example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8,0191eb45-9a12-74c1-8eb1-ca124b8d72e9",
      }),
  })
  .openapi("CompareQuery");

export const CompareAmenitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  category: z.string(),
});

export const CompareItemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    titleEn: z.string().nullable(),
    titleAr: z.string().nullable(),
    propertyType: z.string(),
    listingIntent: z.string(),
    price: z.string(),
    rentalPeriod: z.string().nullable(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    areaSqm: z.number(),
    pricePerSqm: z.number(),
    latitude: z.number(),
    longitude: z.number(),
    coverImage: z.string().nullable(),
    images: z.array(z.string()),
    area: z.object({
      id: z.string(),
      slug: z.string(),
      nameEn: z.string(),
      nameAr: z.string(),
    }),
    amenities: z.array(CompareAmenitySchema),
  })
  .openapi("CompareItem");

export const CompareResponseSchema = z
  .object({
    items: z.array(CompareItemSchema).openapi({
      description: "Array of compared residences with aligned specifications",
    }),
    count: z.number().openapi({ description: "Number of properties compared (2 to 4)" }),
  })
  .openapi("CompareResponse");

// ==============================================================================
// 2. Register OpenAPI Path
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/catalog/compare",
  tags: ["Catalog"],
  summary: "Compare multiple properties",
  description:
    "Retrieve side-by-side architectural and financial specifications for between 2 and 4 residences.",
  request: {
    query: CompareQuerySchema,
  },
  responses: {
    200: {
      description: "Comparison specifications matrix",
      content: {
        "application/json": {
          schema: CompareResponseSchema,
        },
      },
    },
    422: {
      description: "Validation failed (e.g. fewer than 2 or more than 4 properties specified)",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

// ==============================================================================
// 3. Express Route Handler
// ==============================================================================

compareRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = CompareQuerySchema.parse(req.query);
    const parsedIds = ids
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedIds.length < 2 || parsedIds.length > 4) {
      res.status(422).json({
        type: "/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Property comparison requires between 2 and 4 property IDs.",
        instance: req.originalUrl,
        errors: [
          {
            path: "ids",
            code: "invalid_count",
            message: "Must provide between 2 and 4 IDs to compare.",
          },
        ],
      });
      return;
    }

    const properties = await prisma.property.findMany({
      relationLoadStrategy: "join",
      where: {
        OR: [{ id: { in: parsedIds } }, { slug: { in: parsedIds } }],
        status: "PUBLISHED",
      },
      include: {
        area: true,
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

    if (properties.length < 2) {
      res.status(422).json({
        type: "/errors/validation-failed",
        title: "Insufficient Properties Found",
        status: 422,
        detail: `Found ${properties.length} published properties matching the provided IDs. At least 2 published properties are required for comparison.`,
        instance: req.originalUrl,
      });
      return;
    }

    const items = properties.map((p) => {
      const areaSqmNum = Number(p.areaSqm);
      const priceNum = Number(p.price);
      const pricePerSqm = areaSqmNum > 0 ? Math.round(priceNum / areaSqmNum) : 0;
      const coverImg = p.images.find((img) => img.isCover)?.url || p.images[0]?.url || null;

      return {
        id: p.id,
        slug: p.slug,
        titleEn: p.titleEn,
        titleAr: p.titleAr,
        propertyType: p.propertyType,
        listingIntent: p.listingIntent,
        price: p.price.toString(),
        rentalPeriod: p.rentalPeriod,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: areaSqmNum,
        pricePerSqm,
        latitude: p.latitude,
        longitude: p.longitude,
        coverImage: coverImg,
        images: p.images.map((img) => img.url),
        area: {
          id: p.area.id,
          slug: p.area.slug,
          nameEn: p.area.nameEn,
          nameAr: p.area.nameAr,
        },
        amenities: p.amenities.map((pa) => ({
          id: pa.amenity.id,
          slug: pa.amenity.slug,
          nameEn: pa.amenity.nameEn,
          nameAr: pa.amenity.nameAr,
          category: pa.amenity.category,
        })),
      };
    });

    res.json({
      items,
      count: items.length,
    });
  } catch (error) {
    next(error);
  }
});
