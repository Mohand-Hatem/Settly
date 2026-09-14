import { Router } from "express";

export const aiRouter: Router = Router();

aiRouter.get("/health", (_req, res) => {
  res.json({ module: "ai", status: "ok" });
});
