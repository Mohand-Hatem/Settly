import { Router, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { z } from "../../../shared/openapi/zod.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
  ConflictProblemSchema,
} from "../../../shared/openapi/registry.js";
import { requireAuth } from "../../identity/middleware/auth.middleware.js";
import { notificationService } from "../service/index.js";

export const notificationsRouter: Router = Router();

function handle(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = await fn(req, res);
      if (!res.headersSent) res.status(res.statusCode === 201 ? 201 : 200).json(body);
    } catch (err) {
      next(err);
    }
  };
}

// ==============================================================================
// OpenAPI Schemas
// ==============================================================================

const NotificationDtoSchema = z
  .object({
    id: z.string().openapi({ description: "Notification ID", example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8" }),
    type: z.string().openapi({ description: "Notification type identifier", example: "OFFER_ACCEPTED" }),
    category: z.enum(["DEALS", "VIEWINGS", "MESSAGES", "SYSTEM"]).openapi({ description: "High-level classification" }),
    title: z.string().openapi({ description: "Computed alert headline", example: "Offer Accepted! 72h Deposit Window Active" }),
    body: z.string().openapi({ description: "Descriptive notification content" }),
    actionUrl: z.string().openapi({ description: "Direct portal link to relevant record", example: "/buyer/offers/0191eb45/deposit" }),
    isRead: z.boolean().openapi({ description: "Whether this notification has been read" }),
    readAt: z.string().nullable().optional(),
    createdAt: z.string().openapi({ description: "Notification creation ISO timestamp" }),
    params: z.record(z.unknown()).openapi({ description: "Dynamic event parameters" }),
  })
  .openapi("NotificationDto");

const NotificationListResponseSchema = z
  .object({
    items: z.array(NotificationDtoSchema),
    unreadCount: z.number(),
    totalCount: z.number(),
    nextCursor: z.string().nullable(),
  })
  .openapi("NotificationListResponse");

const UnreadCountResponseSchema = z
  .object({
    unreadCount: z.number().openapi({ description: "Count of unread notifications", example: 3 }),
  })
  .openapi("UnreadCountResponse");

const NotificationActionSuccessSchema = z
  .object({
    success: z.boolean(),
    count: z.number().optional(),
  })
  .openapi("NotificationActionSuccess");

const problems = {
  401: { description: "Not signed in", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
  403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
  404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
  409: { description: "State conflict", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation error", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};

// ==============================================================================
// 1. GET /api/v1/notifications — List notifications
// ==============================================================================
registry.registerPath({
  method: "get",
  path: "/api/v1/notifications",
  tags: ["Notifications"],
  summary: "List notifications for authenticated user",
  security: [{ sessionCookie: [] }],
  parameters: [
    {
      name: "unreadOnly",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter only unread notifications (true/false)",
    },
    {
      name: "cursor",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Pagination cursor (ID of last item)",
    },
    {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50 },
      description: "Page size (default 20)",
    },
  ],
  responses: {
    200: {
      description: "Notification feed with unread counts and pagination cursor",
      content: { "application/json": { schema: NotificationListResponseSchema } },
    },
    ...problems,
  },
});

notificationsRouter.get(
  "/",
  requireAuth,
  handle(async (req) => {
    const unreadOnly = req.query.unreadOnly === "true";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    return notificationService.listUserNotifications(req.user!.id, {
      unreadOnly,
      cursor,
      limit,
    });
  })
);

// ==============================================================================
// 2. GET /api/v1/notifications/unread-count — Fast badge counter
// ==============================================================================
registry.registerPath({
  method: "get",
  path: "/api/v1/notifications/unread-count",
  tags: ["Notifications"],
  summary: "Get unread notification count for authenticated user",
  security: [{ sessionCookie: [] }],
  responses: {
    200: {
      description: "Unread notifications count",
      content: { "application/json": { schema: UnreadCountResponseSchema } },
    },
    ...problems,
  },
});

notificationsRouter.get(
  "/unread-count",
  requireAuth,
  handle(async (req) => {
    return notificationService.getUnreadCount(req.user!.id);
  })
);

// ==============================================================================
// 3. PATCH /api/v1/notifications/:id/read — Mark single notification read
// ==============================================================================
registry.registerPath({
  method: "patch",
  path: "/api/v1/notifications/{id}/read",
  tags: ["Notifications"],
  summary: "Mark notification as read",
  security: [{ sessionCookie: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Notification ID",
    },
  ],
  responses: {
    200: {
      description: "Notification marked read",
      content: { "application/json": { schema: NotificationActionSuccessSchema } },
    },
    ...problems,
  },
});

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  handle(async (req) => {
    return notificationService.markAsRead(req.params.id as string, req.user!.id);
  })
);

// ==============================================================================
// 4. POST /api/v1/notifications/mark-all-read — Mark all notifications read
// ==============================================================================
registry.registerPath({
  method: "post",
  path: "/api/v1/notifications/mark-all-read",
  tags: ["Notifications"],
  summary: "Mark all notifications as read for authenticated user",
  security: [{ sessionCookie: [] }],
  responses: {
    200: {
      description: "All notifications marked read",
      content: { "application/json": { schema: NotificationActionSuccessSchema } },
    },
    ...problems,
  },
});

notificationsRouter.post(
  "/mark-all-read",
  requireAuth,
  handle(async (req) => {
    return notificationService.markAllAsRead(req.user!.id);
  })
);

// ==============================================================================
// 5. DELETE /api/v1/notifications/:id — Delete notification
// ==============================================================================
registry.registerPath({
  method: "delete",
  path: "/api/v1/notifications/{id}",
  tags: ["Notifications"],
  summary: "Delete / dismiss a notification",
  security: [{ sessionCookie: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Notification ID",
    },
  ],
  responses: {
    200: {
      description: "Notification deleted",
      content: { "application/json": { schema: NotificationActionSuccessSchema } },
    },
    ...problems,
  },
});

notificationsRouter.delete(
  "/:id",
  requireAuth,
  handle(async (req) => {
    return notificationService.deleteNotification(req.params.id as string, req.user!.id);
  })
);
