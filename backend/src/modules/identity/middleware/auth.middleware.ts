import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, SESSION_ABSOLUTE_MAX_MS, type UserSession } from "../auth.js";
import { identityRepository } from "../repository/identity.repository.js";
import { requestContext } from "../../../shared/context/request-context.js";
import {
  unauthenticatedError,
  forbiddenError,
  ProblemError,
} from "../../../shared/errors/problem-details.js";

export interface SettlyUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string | null;
  image?: string | null;
  role: "USER" | "AGENT" | "ADMIN" | string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  preferredLocale?: string | null;
  anonymizedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SettlyUser;
      session?: UserSession;
    }
  }
}

/**
 * Ambient session extraction middleware.
 * Inspects incoming cookies/headers, verifies session against PostgreSQL, and populates requestContext.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // Absolute 30-day session cap (V12, #106): the sliding expiry alone would let a session live forever.
    if (
      sessionData?.session &&
      Date.now() - new Date(sessionData.session.createdAt).getTime() > SESSION_ABSOLUTE_MAX_MS
    ) {
      await identityRepository.deleteSession(sessionData.session.id);
      return next();
    }

    if (sessionData?.user && sessionData?.session) {
      req.user = sessionData.user as unknown as SettlyUser;
      req.session = sessionData.session as unknown as UserSession;

      // Populate async local storage request context with authenticated actor ID
      const store = requestContext.getStore();
      if (store) {
        store.userId = sessionData.user.id;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Guard requiring a valid authenticated session.
 * Throws RFC 9457 401 (/errors/unauthenticated) if unauthenticated.
 * Throws RFC 9457 403 (/errors/account-suspended) if user is banned (AUTH.md Section 2).
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.session) {
    await authenticate(req, res, (err) => {
      if (err) return next(err);
      if (!req.user) {
        return next(unauthenticatedError("Authentication required to access this resource."));
      }
      checkBanAndProceed(req, next);
    });
    return;
  }

  checkBanAndProceed(req, next);
}

function checkBanAndProceed(req: Request, next: NextFunction): void {
  if (req.user?.banned) {
    return next(
      new ProblemError({
        type: "/errors/account-suspended",
        title: "Account Suspended",
        status: 403,
        detail: req.user.banReason
          ? `Your account has been suspended: ${req.user.banReason}`
          : "Your account has been suspended by an administrator.",
        params: {
          banned: true,
          banReason: req.user.banReason,
          banExpires: req.user.banExpires,
        },
      })
    );
  }
  next();
}

/**
 * Coarse role guard middleware (USER | AGENT | ADMIN).
 * Governed by AUTH.md Section 7.
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
        return next(
          forbiddenError(
            `Access restricted to roles: [${allowedRoles.join(", ")}]. Current role: '${req.user?.role}'.`
          )
        );
      }
      next();
    });
  };
}

/**
 * Verification Boundary Guard (Decision #38)
 * "Email verification is required for any buyer transition that creates or advances a financial
 * obligation or a scheduled commitment. It is never required to withdraw, cancel, or read."
 */
export async function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user?.emailVerified) {
      return next(
        new ProblemError({
          type: "/errors/email-not-verified",
          title: "Email Verification Required",
          status: 403,
          detail:
            "You must verify your email address before advancing a financial commitment or booking viewings.",
          params: {
            emailVerified: false,
          },
        })
      );
    }
    next();
  });
}
