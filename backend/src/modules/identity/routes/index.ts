import { Router } from "express";
import { profileRouter } from "./profile.routes.js";
import { identityService } from "../service/identity.service.js";

export const identityRouter: Router = Router();

identityRouter.get("/health", (_req, res) => {
  res.json({ module: "identity", status: "ok" });
});

/**
 * Direct 6-Digit Cryptographic OTP Verification Endpoint
 */
identityRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and 6-digit code are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

    const verified = await identityService.verifyEmailOtp(normalizedEmail, normalizedCode);
    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired verification code. Please check your email." });
    }

    return res.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
});

import { agentDirectoryRouter } from "./agent-directory.routes.js";

identityRouter.use("/", agentDirectoryRouter);

export { profileRouter, agentDirectoryRouter };
