import { Router } from "express";

export const analyticsRouter: Router = Router();

analyticsRouter.get("/health", (_req, res) => {
  res.json({ module: "analytics", status: "ok" });
});
