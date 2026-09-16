import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "../../../shared/openapi/zod.js";
import { registry, NotFoundProblemSchema, ValidationProblemSchema } from "../../../shared/openapi/registry.js";
import { prisma } from "../../../shared/database/prisma.js";

export const agentDirectoryRouter = Router();

// ==============================================================================
// 1. Zod Schemas for Public Agent Directory
// ==============================================================================

export const AgentDirectoryQuerySchema = z
  .object({
    search: z.string().optional().openapi({ description: "Search by agent name or license number" }),
    brokerage: z.string().optional().openapi({ description: "Filter by brokerage firm name" }),
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(50).default(12).openapi({ example: 12 }),
  })
  .openapi("AgentDirectoryQuery");

export const AgentDirectoryItemSchema = z
  .object({
    id: z.string().openapi({ description: "AgentProfile UUID" }),
    userId: z.string().openapi({ description: "User ID" }),
    name: z.string().openapi({ example: "Hana K." }),
    image: z.string().nullable().openapi({ example: "/images/hana.jpg" }),
    licenseNumber: z.string().openapi({ example: "CAI-2024-8841" }),
    brokerageName: z.string().nullable().openapi({ example: "Sotheby's International Realty Egypt" }),
    bioEn: z.string().nullable().openapi({ example: "Prime Cairo & Katameya advisory specialist." }),
    bioAr: z.string().nullable().openapi({ example: "مستشارة عقارية متخصصة في عقارات التجمع الخامس والقطامية." }),
    isVerified: z.boolean().openapi({ example: true }),
    verifiedAt: z.string().datetime().nullable(),
    activeListingsCount: z.number().openapi({ example: 6 }),
    primaryCorridors: z.array(z.string()).openapi({ example: ["New Cairo", "Katameya Dunes"] }),
  })
  .openapi("AgentDirectoryItem");

export const AgentDirectoryResponseSchema = z
  .object({
    items: z.array(AgentDirectoryItemSchema),
    total: z.number().openapi({ example: 1 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 12 }),
  })
  .openapi("AgentDirectoryResponse");

export const AgentPublicPropertySchema = z.object({
  id: z.string(),
  slug: z.string(),
  titleEn: z.string().nullable(),
  titleAr: z.string().nullable(),
  propertyType: z.string(),
  price: z.string(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  areaSqm: z.number(),
  coverImage: z.string().nullable(),
  area: z.object({
    nameEn: z.string(),
    nameAr: z.string(),
    slug: z.string(),
  }),
});

export const AgentProfileDetailResponseSchema = z
  .object({
    agent: AgentDirectoryItemSchema,
    listings: z.array(AgentPublicPropertySchema),
  })
  .openapi("AgentProfileDetailResponse");

// ==============================================================================
// 2. Register OpenAPI Paths
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/identity/agents",
  tags: ["Identity"],
  summary: "List verified certified advisors and brokers",
  description:
    "Retrieve the public directory of certified real estate advisors with licensing transparency and active listing counts.",
  request: {
    query: AgentDirectoryQuerySchema,
  },
  responses: {
    200: {
      description: "Collection of certified advisors",
      content: {
        "application/json": {
          schema: AgentDirectoryResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/identity/agents/{id}",
  tags: ["Identity"],
  summary: "Get public profile and active exclusive listings for an advisor",
  description:
    "Retrieve verified broker profile, FRA/REA registration badges, biography, and active published residences.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Agent Profile ID or User ID" }),
    }),
  },
  responses: {
    200: {
      description: "Advisor public profile and published listings",
      content: {
        "application/json": {
          schema: AgentProfileDetailResponseSchema,
        },
      },
    },
    404: {
      description: "Advisor not found",
      content: {
        "application/problem+json": {
          schema: NotFoundProblemSchema,
        },
      },
    },
  },
});

// ==============================================================================
// 3. Express Route Handlers
// ==============================================================================

agentDirectoryRouter.get("/agents", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = AgentDirectoryQuerySchema.parse(req.query);
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isVerified: true,
      user: {
        banned: false,
      },
    };

    if (query.search) {
      whereClause.OR = [
        { user: { name: { contains: query.search, mode: "insensitive" } } },
        { licenseNumber: { contains: query.search, mode: "insensitive" } },
        { brokerageName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.brokerage) {
      whereClause.brokerageName = { contains: query.brokerage, mode: "insensitive" };
    }

    const [total, profiles] = await Promise.all([
      prisma.agentProfile.count({ where: whereClause }),
      prisma.agentProfile.findMany({
        relationLoadStrategy: "join",
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
              _count: {
                select: {
                  properties: {
                    where: { status: "PUBLISHED" },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const userIds = profiles.map((p) => p.userId);
    const corridorsByAgent = new Map<string, string[]>();

    if (userIds.length > 0) {
      const agentAreas = await prisma.property.findMany({
        where: {
          agentId: { in: userIds },
          status: "PUBLISHED",
        },
        select: {
          agentId: true,
          area: {
            select: { nameEn: true },
          },
        },
        distinct: ["agentId", "areaId"],
      });

      for (const row of agentAreas) {
        const areaName = row.area?.nameEn;
        if (!areaName) continue;
        const existing = corridorsByAgent.get(row.agentId) || [];
        if (!existing.includes(areaName)) {
          existing.push(areaName);
        }
        corridorsByAgent.set(row.agentId, existing);
      }
    }

    const items = profiles.map((p) => {
      const corridors = corridorsByAgent.get(p.userId) || [];

      return {
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        image: p.user.image,
        licenseNumber: p.licenseNumber,
        brokerageName: p.brokerageName,
        bioEn: p.bioEn,
        bioAr: p.bioAr,
        isVerified: p.isVerified,
        verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
        activeListingsCount: p.user._count.properties,
        primaryCorridors: corridors.length > 0 ? corridors : ["New Cairo", "East Cairo"],
      };
    });

    res.json({
      items,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

agentDirectoryRouter.get("/agents/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const profile = await prisma.agentProfile.findFirst({
      relationLoadStrategy: "join",
      where: {
        OR: [{ id }, { userId: id }],
        isVerified: true,
      },
      include: {
        user: {
          include: {
            properties: {
              where: { status: "PUBLISHED" },
              include: {
                area: true,
                images: {
                  where: { isCover: true },
                  take: 1,
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({
        type: "/errors/not-found",
        title: "Advisor Not Found",
        status: 404,
        detail: `No verified advisor was found with identifier '${id}'.`,
        instance: req.originalUrl,
      });
      return;
    }

    const corridors = Array.from(
      new Set(profile.user.properties.map((prop) => prop.area.nameEn))
    );

    const agentItem = {
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      image: profile.user.image,
      licenseNumber: profile.licenseNumber,
      brokerageName: profile.brokerageName,
      bioEn: profile.bioEn,
      bioAr: profile.bioAr,
      isVerified: profile.isVerified,
      verifiedAt: profile.verifiedAt ? profile.verifiedAt.toISOString() : null,
      activeListingsCount: profile.user.properties.length,
      primaryCorridors: corridors.length > 0 ? corridors : ["New Cairo", "East Cairo"],
    };

    const listings = profile.user.properties.map((p) => ({
      id: p.id,
      slug: p.slug,
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      propertyType: p.propertyType,
      price: p.price.toString(),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqm: Number(p.areaSqm),
      coverImage: p.images[0]?.url || null,
      area: {
        nameEn: p.area.nameEn,
        nameAr: p.area.nameAr,
        slug: p.area.slug,
      },
    }));

    res.json({
      agent: agentItem,
      listings,
    });
  } catch (error) {
    next(error);
  }
});
