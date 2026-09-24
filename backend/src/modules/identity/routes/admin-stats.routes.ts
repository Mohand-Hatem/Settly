import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "../../../shared/openapi/zod.js";
import { requireRole } from "../middleware/auth.middleware.js";
import * as propertyService from "../../catalog/service/property.service.js";
import * as agentService from "../service/agent.service.js";
import { offerService } from "../../pipeline/service/offer.service.js";
import { paymentService } from "../../payments/service/payment.service.js";
import {
  registry,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
} from "../../../shared/openapi/registry.js";

export const adminStatsRouter = Router();

adminStatsRouter.use(requireRole("ADMIN"));

export const AdminStatsResponseSchema = registry.register(
  "AdminStatsResponse",
  z.object({
    pendingListings: z.number().int().openapi({ description: "Number of listings waiting for moderation review" }),
    pendingAgentApplications: z.number().int().openapi({ description: "Number of agent verification applications pending" }),
    salesNearDeadline: z.number().int().openapi({ description: "Number of conveyance cases requiring admin action or overdue" }),
    failedRefundAlerts: z.number().int().openapi({ description: "Number of failed deposit refunds requiring manual resolution" }),
  })
);

export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/stats",
  summary: "Get admin operational dashboard counts (Admin only)",
  description: "Returns essential operational queue counts per Decision #28.",
  tags: ["Admin"],
  security: [{ sessionAuth: [] }],
  responses: {
    200: {
      description: "Admin operational stats",
      content: {
        "application/json": {
          schema: AdminStatsResponseSchema,
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
  },
});

adminStatsRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [pendingListings, pendingAgentApplications, salesNearDeadline, failedRefundAlerts] =
        await Promise.all([
          propertyService.countPendingProperties(),
          agentService.countPendingAgentVerifications(),
          offerService.countActionRequiredSales(),
          paymentService.countFailedRefunds(),
        ]);

      res.status(200).json({
        pendingListings,
        pendingAgentApplications,
        salesNearDeadline,
        failedRefundAlerts,
      });
    } catch (err) {
      next(err);
    }
  }
);
