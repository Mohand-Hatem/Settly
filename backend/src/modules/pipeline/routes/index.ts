import { Router } from "express";

export const pipelineRouter: Router = Router();

pipelineRouter.get("/health", (_req, res) => {
  res.json({ module: "pipeline", status: "ok" });
});
