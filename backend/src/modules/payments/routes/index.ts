import { Router } from "express";

export const paymentsRouter: Router = Router();

paymentsRouter.get("/health", (_req, res) => {
  res.json({ module: "payments", status: "ok" });
});
