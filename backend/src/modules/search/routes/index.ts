import { Router } from "express";

export const searchRouter: Router = Router();

searchRouter.get("/health", (_req, res) => {
  res.json({ module: "search", status: "ok" });
});
