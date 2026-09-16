import { Router } from "express";
import { marketRouter } from "./market.routes.js";

export const analyticsRouter: Router = Router();

analyticsRouter.get("/health", (_req, res) => {
  res.json({ module: "analytics", status: "ok" });
});

analyticsRouter.use("/", marketRouter);

export { marketRouter };
