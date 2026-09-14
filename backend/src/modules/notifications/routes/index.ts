import { Router } from "express";

export const notificationsRouter: Router = Router();

notificationsRouter.get("/health", (_req, res) => {
  res.json({ module: "notifications", status: "ok" });
});
