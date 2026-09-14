import { Router } from "express";

export const engagementRouter: Router = Router();

engagementRouter.get("/health", (_req, res) => {
  res.json({ module: "engagement", status: "ok" });
});
