import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.middleware.js";
import * as agentService from "../service/agent.service.js";
import {
  AgentVerificationSchema,
  AgentListResponseSchema,
  AgentListItemSchema,
} from "../schema/agent.schema.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
} from "../../../shared/openapi/registry.js";
import {
  validationError,
  notFoundError,
} from "../../../shared/errors/problem-details.js";

export const adminAgentRouter = Router();

// Require ADMIN role for all routes in this router (AUTH.md §7)
adminAgentRouter.use(requireRole("ADMIN"));

const AdminAgentQuerySchema = z.object({
  verified: z.enum(["true", "false"]).optional(),
});

/**
 * GET /api/v1/admin/agents
 */
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/agents",
  summary: "List agent verification queue (Admin only)",
  description: "Returns registered agent profiles for moderation and verification review.",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    query: AdminAgentQuerySchema,
  },
  responses: {
    200: {
      description: "List of agent profiles",
      content: {
        "application/json": {
          schema: AgentListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    403: {
      description: "Forbidden (Admin role required)",
      content: { "application/problem+json": { schema: ForbiddenProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

adminAgentRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AdminAgentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const isVerified =
        parsed.data.verified === "true" ? true : parsed.data.verified === "false" ? false : undefined;

      const items = await agentService.getAgentsList({ isVerified });
      res.status(200).json({ items });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/agents/:id
 */
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/agents/{id}",
  summary: "Get agent profile details for review (Admin only)",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Agent profile details",
      content: {
        "application/json": {
          schema: AgentListItemSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/problem+json": { schema: ForbiddenProblemSchema } },
    },
    404: {
      description: "Agent profile not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
  },
});

adminAgentRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agent = await agentService.getAgentDetails(id as string);
      if (!agent) {
        return next(notFoundError("Agent profile not found", `/api/v1/admin/agents/${id}`));
      }
      res.status(200).json(agent);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/agents/:id/verify
 */
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/agents/{id}/verify",
  summary: "Approve or revoke agent verification (Admin only)",
  description: "Updates agent verification status and records an immutable AuditLog entry.",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: AgentVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Agent verification updated successfully",
      content: {
        "application/json": {
          schema: AgentListItemSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/problem+json": { schema: ForbiddenProblemSchema } },
    },
    404: {
      description: "Agent profile not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

adminAgentRouter.post(
  "/:id/verify",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = AgentVerificationSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return next(validationError(parsedBody.error, req.originalUrl));
      }

      const adminUserId = req.user!.id;
      const updated = await agentService.processAgentVerification({
        agentProfileId: id as string,
        verification: parsedBody.data,
        adminUserId,
      });

      if (!updated) {
        return next(notFoundError("Agent profile not found", `/api/v1/admin/agents/${id}/verify`));
      }

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);
