import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as agentService from "../service/agent.service.js";
import {
  UserDeviceRegistrationSchema,
  UserDeviceResponseSchema,
} from "../schema/agent.schema.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  UnauthenticatedProblemSchema,
} from "../../../shared/openapi/registry.js";
import {
  validationError,
  notFoundError,
} from "../../../shared/errors/problem-details.js";

export const deviceRouter = Router();

deviceRouter.use(requireAuth);

/**
 * POST /api/v1/me/devices
 */
registry.registerPath({
  method: "post",
  path: "/api/v1/me/devices",
  summary: "Register or update FCM device token for push notifications",
  description: "Associates a Web Push or Mobile FCM token with the authenticated user.",
  tags: ["Identity", "Notifications"],
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserDeviceRegistrationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Device registered successfully",
      content: {
        "application/json": {
          schema: UserDeviceResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

deviceRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = UserDeviceRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const result = await agentService.registerDeviceToken({
        userId: req.user!.id,
        input: parsed.data,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/me/devices/:token
 */
registry.registerPath({
  method: "delete",
  path: "/api/v1/me/devices/{token}",
  summary: "Deregister FCM device token",
  description: "Removes push notification token upon user logout or notification revocation.",
  tags: ["Identity", "Notifications"],
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      token: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Device deregistered successfully (no content)",
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    404: {
      description: "Device token not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
  },
});

deviceRouter.delete(
  "/:token",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      const removed = await agentService.removeDeviceToken(req.user!.id, token as string);
      if (!removed) {
        return next(notFoundError("Device token not found", `/api/v1/me/devices/${token}`));
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
