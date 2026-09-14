import { Router } from "express";

export const knowledgeRouter: Router = Router();

knowledgeRouter.get("/health", (_req, res) => {
  res.json({ module: "knowledge", status: "ok" });
});
