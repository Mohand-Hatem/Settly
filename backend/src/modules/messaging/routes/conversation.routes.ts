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
import { validationError } from "../../../shared/errors/problem-details.js";
import { requireAuth } from "../../identity/middleware/auth.middleware.js";
import { messagingService } from "../service/index.js";

export const conversationRouter: Router = Router();
export const myConversationsRouter: Router = Router();

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

// Schemas for OpenAPI
const MessageDtoSchema = z
  .object({
    id: z.string().openapi({ description: "Message ID", example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8" }),
    conversationId: z.string().openapi({ description: "Conversation ID" }),
    senderId: z.string().openapi({ description: "Sender User ID" }),
    body: z.string().openapi({ description: "Message content", example: "Is this villa still available for viewing?" }),
    attachments: z.record(z.unknown()).nullable().optional(),
    isRead: z.boolean().openapi({ description: "Whether the message has been read" }),
    readAt: z.string().nullable().optional(),
    createdAt: z.string().openapi({ description: "Message creation timestamp" }),
  })
  .openapi("MessageDto");

const ConversationParticipantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    image: z.string().nullable().optional(),
  })
  .openapi("ConversationParticipant");

const ConversationPropertySchema = z
  .object({
    id: z.string(),
    titleEn: z.string(),
    slug: z.string(),
    price: z.number(),
    currency: z.string(),
    imageUrl: z.string().nullable().optional(),
    areaName: z.string().nullable().optional(),
  })
  .openapi("ConversationProperty");

const ConversationDtoSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    buyerId: z.string(),
    agentId: z.string(),
    property: ConversationPropertySchema,
    counterparty: ConversationParticipantSchema,
    unreadCount: z.number(),
    latestMessage: MessageDtoSchema.nullable().optional(),
    lastMessageAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ConversationDto");

const ConversationListResponseSchema = z
  .object({
    items: z.array(ConversationDtoSchema),
  })
  .openapi("ConversationListResponse");

const MessagesPageSchema = z
  .object({
    items: z.array(MessageDtoSchema),
    pageInfo: z.object({
      nextCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  })
  .openapi("MessagesPage");

const CreateConversationBodySchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  initialMessage: z.string().max(2000).optional(),
});

const SendMessageBodySchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(2000),
});

const problems = {
  401: { description: "Not signed in", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
  403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
  404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
  409: { description: "State conflict", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation error", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};

// ==============================================================================
// 1. GET /api/v1/me/conversations — List current user's conversations
// ==============================================================================
registry.registerPath({
  method: "get",
  path: "/api/v1/me/conversations",
  tags: ["Messaging"],
  summary: "List all active conversations for the authenticated user",
  security: [{ sessionCookie: [] }],
  responses: {
    200: {
      description: "Collection of user conversations",
      content: { "application/json": { schema: ConversationListResponseSchema } },
    },
    ...problems,
  },
});

myConversationsRouter.get(
  "/",
  requireAuth,
  handle(async (req) => {
    return messagingService.listUserConversations(req.user!.id);
  })
);

// ==============================================================================
// 2. POST /api/v1/conversations — Start or retrieve a conversation
// ==============================================================================
registry.registerPath({
  method: "post",
  path: "/api/v1/conversations",
  tags: ["Messaging"],
  summary: "Initiate or get conversation with an agent for a property",
  security: [{ sessionCookie: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateConversationBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Conversation retrieved or created",
      content: { "application/json": { schema: ConversationDtoSchema } },
    },
    ...problems,
  },
});

conversationRouter.post(
  "/",
  requireAuth,
  handle(async (req, res) => {
    const parseResult = CreateConversationBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw validationError(parseResult.error, req.originalUrl);
    }
    const result = await messagingService.startConversation(req.user!.id, parseResult.data);
    res.status(200);
    return result;
  })
);

// ==============================================================================
// 3. GET /api/v1/conversations/:id/messages — Get paginated message history
// ==============================================================================
registry.registerPath({
  method: "get",
  path: "/api/v1/conversations/{id}/messages",
  tags: ["Messaging"],
  summary: "Get cursor-paginated messages for a conversation",
  security: [{ sessionCookie: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(50).optional(),
    }),
  },
  responses: {
    200: {
      description: "Page of messages in chronological order",
      content: { "application/json": { schema: MessagesPageSchema } },
    },
    ...problems,
  },
});

conversationRouter.get(
  "/:id/messages",
  requireAuth,
  handle(async (req) => {
    const conversationId = req.params.id as string;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    return messagingService.getConversationMessages(conversationId, req.user!.id, cursor, limit);
  })
);

// ==============================================================================
// 4. POST /api/v1/conversations/:id/messages — Send a new message
// ==============================================================================
registry.registerPath({
  method: "post",
  path: "/api/v1/conversations/{id}/messages",
  tags: ["Messaging"],
  summary: "Send a message within a conversation",
  security: [{ sessionCookie: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { "application/json": { schema: SendMessageBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Message sent successfully",
      content: { "application/json": { schema: MessageDtoSchema } },
    },
    ...problems,
  },
});

conversationRouter.post(
  "/:id/messages",
  requireAuth,
  handle(async (req, res) => {
    const conversationId = req.params.id as string;
    const parseResult = SendMessageBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw validationError(parseResult.error, req.originalUrl);
    }
    const message = await messagingService.sendMessage(conversationId, req.user!.id, parseResult.data);
    res.status(201);
    return message;
  })
);

// ==============================================================================
// 5. POST /api/v1/conversations/:id/read — Mark conversation as read
// ==============================================================================
registry.registerPath({
  method: "post",
  path: "/api/v1/conversations/{id}/read",
  tags: ["Messaging"],
  summary: "Mark all counterparty messages in conversation as read",
  security: [{ sessionCookie: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Conversation marked as read",
      content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
    },
    ...problems,
  },
});

conversationRouter.post(
  "/:id/read",
  requireAuth,
  handle(async (req) => {
    const conversationId = req.params.id as string;
    return messagingService.markAsRead(conversationId, req.user!.id);
  })
);
