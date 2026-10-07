import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.middleware.js";
import * as agentService from "../service/agent.service.js";
import {
  AgentApplicationListResponseSchema,
  AgentApplicationDetailSchema,
  AgentApplicationItemSchema,
  AgentApplicationReviewSchema,
  AgentApplicationStatusEnum,
} from "../schema/agent.schema.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
  ConflictProblemSchema,
} from "../../../shared/openapi/registry.js";
import {
  validationError,
  notFoundError,
} from "../../../shared/errors/problem-details.js";

export const adminAgentApplicationRouter = Router();

// Require ADMIN role for all routes in this router
adminAgentApplicationRouter.use(requireRole("ADMIN"));

const AdminApplicationQuerySchema = z.object({
  status: AgentApplicationStatusEnum.optional(),
});

/**
 * GET /api/v1/admin/agent-applications
 */
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/agent-applications",
  summary: "List agent verification applications (Admin only, ADM-04)",
  description:
    "Returns agent verification applications with optional status filtering for administrative queue review.",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    query: AdminApplicationQuerySchema,
  },
  responses: {
    200: {
      description: "List of agent applications",
      content: {
        "application/json": {
          schema: AgentApplicationListResponseSchema,
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

adminAgentApplicationRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AdminApplicationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const items = await agentService.listAgentApplications({
        status: parsed.data.status,
      });

      res.status(200).json({ items });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/agent-applications/:id
 */
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/agent-applications/{id}",
  summary: "Get agent application details for visual verification (Admin only, ADM-04)",
  description:
    "Retrieves full application details including National ID, verification selfie, and professional proof URLs for side-by-side inspection (Decisions #56, #57).",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Full application details with identity document references",
      content: {
        "application/json": {
          schema: AgentApplicationDetailSchema,
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
      description: "Application not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
  },
});

adminAgentApplicationRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const application = await agentService.getAgentApplicationDetails(
        id as string,
        req.user!.id
      );

      if (!application) {
        return next(
          notFoundError("AgentApplication not found", `/api/v1/admin/agent-applications/${id}`)
        );
      }

      res.status(200).json(application);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/agent-applications/:id/review
 */
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/agent-applications/{id}/review",
  summary: "Approve or reject agent application (Admin only, ADM-04)",
  description:
    "Submits an administrative review decision. Approving elevates user to AGENT and creates verified AgentProfile. Rejecting requires a mandatory reason shown to applicant (Decision #57). Enforces Conflict of Interest guards (Decisions #67, #71).",
  tags: ["Admin", "Identity"],
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: AgentApplicationReviewSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Application review processed successfully",
      content: {
        "application/json": {
          schema: AgentApplicationItemSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    403: {
      description: "Forbidden (Conflict of interest: admin is personally involved per Decisions #67, #71)",
      content: { "application/problem+json": { schema: ForbiddenProblemSchema } },
    },
    404: {
      description: "Application not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
    409: {
      description: "Conflict (Application already reviewed)",
      content: { "application/problem+json": { schema: ConflictProblemSchema } },
    },
    422: {
      description: "Validation error (e.g. rejection without reason)",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

adminAgentApplicationRouter.post(
  "/:id/review",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = AgentApplicationReviewSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return next(validationError(parsedBody.error, req.originalUrl));
      }

      const adminUserId = req.user!.id;
      const updated = await agentService.reviewAgentApplication({
        id: id as string,
        input: parsedBody.data,
        adminUserId,
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);
