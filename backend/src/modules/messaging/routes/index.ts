import { Router } from "express";

export const messagingRouter: Router = Router();

messagingRouter.get("/health", (_req, res) => {
  res.json({ module: "messaging", status: "ok" });
});
