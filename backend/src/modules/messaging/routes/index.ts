import { Router } from "express";
export { conversationRouter, myConversationsRouter } from "./conversation.routes.js";

export const messagingRouter: Router = Router();

messagingRouter.get("/health", (_req, res) => {
  res.json({ module: "messaging", status: "ok" });
});
