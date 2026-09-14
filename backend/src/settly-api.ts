import http from "node:http";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { uuidv7 } from "uuidv7";
import { env } from "./config/index.js";

// Import module routers
import { identityRouter } from "./modules/identity/index.js";
import { catalogRouter } from "./modules/catalog/index.js";
import { engagementRouter } from "./modules/engagement/index.js";
import { pipelineRouter } from "./modules/pipeline/index.js";
import { paymentsRouter } from "./modules/payments/index.js";
import { messagingRouter } from "./modules/messaging/index.js";
import { notificationsRouter } from "./modules/notifications/index.js";
import { knowledgeRouter } from "./modules/knowledge/index.js";
import { aiRouter } from "./modules/ai/index.js";
import { searchRouter } from "./modules/search/index.js";
import { analyticsRouter } from "./modules/analytics/index.js";

import { requestContext, getRequestId, type RequestContext } from "./shared/context/request-context.js";
export { requestContext, getRequestId, type RequestContext };
import { toNodeHandler } from "better-auth/node";
import { auth } from "./modules/identity/auth.js";
import { profileRouter } from "./modules/identity/routes/profile.routes.js";
import { adminAgentRouter } from "./modules/identity/routes/admin-agent.routes.js";
import { deviceRouter } from "./modules/identity/routes/device.routes.js";
import {
  areaRouter,
  propertyRouter,
  adminPropertyRouter,
  myPropertyRouter,
  amenityRouter,
  uploadRouter,
} from "./modules/catalog/routes/index.js";
import { problemDetailsMiddleware, notFoundHandler } from "./shared/errors/problem-details.js";

import { logger } from "./shared/logger/index.js";
export { logger };

const app = express();

// 1. Inbound Request Correlation ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const headerId = req.headers["x-request-id"];
  const requestId = typeof headerId === "string" && headerId.length > 0 ? headerId : uuidv7();
  res.setHeader("X-Request-Id", requestId);

  requestContext.run({ requestId }, () => {
    next();
  });
});

// 2. CORS (Decision #18, #33)
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  })
);

// 3. Better Auth Mounting (Decision #40, API.md §2 — Library-owned, OUTSIDE /api/v1)
app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());

// 4. Healthcheck Endpoints (LOCKED: /health and /api/v1/health)
const healthHandler = (_req: Request, res: Response) => {
  const ctx = requestContext.getStore();
  res.status(200).json({
    status: "ok",
    service: "settly-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId: ctx?.requestId,
  });
};

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// 5. REST Resource Routers (Decision #40, API.md)
app.use("/api/v1/areas", areaRouter);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/amenities", amenityRouter);
app.use("/api/v1/uploads", uploadRouter);
app.use("/api/v1/admin/agents", adminAgentRouter);
app.use("/api/v1/admin/properties", adminPropertyRouter);
app.use("/api/v1/me", profileRouter);
app.use("/api/v1/me/properties", myPropertyRouter);
app.use("/api/v1/me/devices", deviceRouter);

// Module Routers
app.use("/api/v1/identity", identityRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/engagement", engagementRouter);
app.use("/api/v1/pipeline", pipelineRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/messaging", messagingRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/knowledge", knowledgeRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/analytics", analyticsRouter);

// 5. RFC 9457 Problem Details Error Handling (Decision #40, API.md §5)
app.use(notFoundHandler);
app.use(problemDetailsMiddleware);

// 6. Native HTTP Server & WebSocket for 1-on-1 Chat (Decision #43)
export const server = http.createServer(app);

export const wss = new WebSocketServer({
  server,
  path: "/ws/chat",
});

wss.on("connection", (ws, req) => {
  logger.info({ path: req.url }, "WebSocket client connected on /ws/chat");

  ws.on("message", (message) => {
    logger.debug({ messageLength: message.toString().length }, "Received WebSocket message");
  });

  ws.on("close", () => {
    logger.info("WebSocket client disconnected");
  });
});

export function startServer(port: number = env.PORT) {
  return server.listen(port, () => {
    logger.info({ port, env: env.NODE_ENV }, "Settly API started successfully");
  });
}

// Start Server if executed directly
const scriptPath = process.argv[1]?.replace(/\\/g, "/") || "";
if (scriptPath.endsWith("settly-api.js") || scriptPath.endsWith("settly-api.ts")) {
  startServer();
}

export default app;

