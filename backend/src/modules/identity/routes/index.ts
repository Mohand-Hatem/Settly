import { Router } from "express";
import { profileRouter } from "./profile.routes.js";

export const identityRouter: Router = Router();

identityRouter.get("/health", (_req, res) => {
  res.json({ module: "identity", status: "ok" });
});

import { agentDirectoryRouter } from "./agent-directory.routes.js";

identityRouter.use("/", agentDirectoryRouter);

export { profileRouter, agentDirectoryRouter };
