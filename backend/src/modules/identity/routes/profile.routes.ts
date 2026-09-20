import { Router, type Request, type Response, type NextFunction } from "express";
import {
  UserProfileResponseSchema,
  UpdateUserProfileSchema,
  AgentProfileResponseSchema,
  CreateOrUpdateAgentProfileSchema,
} from "../schema/profile.schema.js";
import { identityService } from "../service/identity.service.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  registry,
  UnauthenticatedProblemSchema,
  ForbiddenProblemSchema,
  NotFoundProblemSchema,
  ValidationProblemSchema,
} from "../../../shared/openapi/registry.js";

export const profileRouter = Router();

// ==============================================================================
// 1. OpenAPI Specifications for /api/v1/me
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/me",
  tags: ["Identity"],
  summary: "Get current user profile",
  description:
    "Retrieve the authenticated user's profile, role, verification status, and settings.",
  security: [{ SessionCookie: [] }],
  responses: {
    200: {
      description: "Authenticated user profile data",
      content: {
        "application/json": {
          schema: UserProfileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated request (missing or invalid session cookie)",
      content: {
        "application/problem+json": {
          schema: UnauthenticatedProblemSchema,
        },
      },
    },
    403: {
      description: "Forbidden (account suspended or banned)",
      content: {
        "application/problem+json": {
          schema: ForbiddenProblemSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/me",
  tags: ["Identity"],
  summary: "Update current user profile",
  description:
    "Update display name or language preference (en / ar) for the current user.",
  security: [{ SessionCookie: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateUserProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated user profile data",
      content: {
        "application/json": {
          schema: UserProfileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated request",
      content: {
        "application/problem+json": {
          schema: UnauthenticatedProblemSchema,
        },
      },
    },
    422: {
      description: "Validation error in request payload",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/me/agent-profile",
  tags: ["Identity"],
  summary: "Get agent profile for current user",
  description:
    "Retrieve broker license, brokerage affiliation, and biographies. Requires AGENT or ADMIN role.",
  security: [{ SessionCookie: [] }],
  responses: {
    200: {
      description: "Agent profile details",
      content: {
        "application/json": {
          schema: AgentProfileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated request",
      content: {
        "application/problem+json": {
          schema: UnauthenticatedProblemSchema,
        },
      },
    },
    403: {
      description: "Forbidden: user does not hold AGENT or ADMIN role",
      content: {
        "application/problem+json": {
          schema: ForbiddenProblemSchema,
        },
      },
    },
    404: {
      description: "Agent profile record not yet created",
      content: {
        "application/problem+json": {
          schema: NotFoundProblemSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/me/agent-profile",
  tags: ["Identity"],
  summary: "Create or update agent profile",
  description:
    "Register or update real estate license and brokerage profile details. Requires AGENT or ADMIN role.",
  security: [{ SessionCookie: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrUpdateAgentProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Saved agent profile details",
      content: {
        "application/json": {
          schema: AgentProfileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated request",
      content: {
        "application/problem+json": {
          schema: UnauthenticatedProblemSchema,
        },
      },
    },
    403: {
      description: "Forbidden: user does not hold AGENT or ADMIN role",
      content: {
        "application/problem+json": {
          schema: ForbiddenProblemSchema,
        },
      },
    },
    422: {
      description: "Validation error in request payload",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

// ==============================================================================
// 2. Express Route Handlers
// ==============================================================================

profileRouter.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await identityService.getUserProfile(req.user!.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedBody = UpdateUserProfileSchema.parse(req.body);
    const updated = await identityService.updateUserProfile(req.user!.id, validatedBody);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

profileRouter.get(
  "/agent-profile",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await identityService.getAgentProfile(req.user!.id);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

profileRouter.post(
  "/agent-profile",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = CreateOrUpdateAgentProfileSchema.parse(req.body);
      const saved = await identityService.upsertAgentProfile(req.user!.id, validatedBody);
      res.json(saved);
    } catch (error) {
      next(error);
    }
  }
);

profileRouter.post(
  "/switch-role",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.body;
      if (role !== "USER" && role !== "AGENT") {
        return res.status(400).json({ error: "Role must be USER or AGENT." });
      }
      const updated = await identityService.updateUserRole(req.user!.id, role);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

