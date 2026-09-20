import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Role = "USER" | "AGENT" | "ADMIN";

interface SessionData {
  session?: { id: string; userId: string; expiresAt: string };
  user?: {
    id: string;
    role?: Role;
    banned?: boolean;
    phone?: string | null;
  };
}

/** Dashboard of each role (#100, #106). */
export const ROLE_HOME: Record<Role, string> = { USER: "/buyer", AGENT: "/agent", ADMIN: "/admin" };

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Fast UX redirects only. The middleware is NOT the authorization boundary — the API is
 * (FRONTEND.md §10, AUTH.md §7).
 *
 * - Portals (#97, #100): /buyer for every role; /agent for AGENT only; /admin for ADMIN only.
 *   Agents and admins are never redirected away from /buyer.
 * - Signed-in users without a phone (Google sign-up) must complete it first (#60, #106).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isBuyerRoute = under(pathname, "/buyer");
  const isAgentRoute = under(pathname, "/agent");
  const isAdminRoute = under(pathname, "/admin");
  const isPortalRoute = isBuyerRoute || isAgentRoute || isAdminRoute;
  const isCompleteProfile = pathname === "/complete-profile";
  // Signed-in users are sent away from these; /verify-email stays reachable while signed in.
  const isGuestOnlyRoute = ["/login", "/register", "/forgot-password"].includes(pathname);

  if (!isPortalRoute && !isGuestOnlyRoute && !isCompleteProfile) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(
    request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value
  );

  const toLogin = () => {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  };

  if ((isPortalRoute || isCompleteProfile) && !hasSessionCookie) return toLogin();
  if (!hasSessionCookie) return NextResponse.next();

  let sessionData: SessionData | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
    });
    if (res.ok) sessionData = await res.json();
  } catch {
    sessionData = null;
  }

  const user = sessionData?.session ? sessionData.user : undefined;
  if (!user) {
    return isPortalRoute || isCompleteProfile ? toLogin() : NextResponse.next();
  }

  if (user.banned) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "banned");
    return NextResponse.redirect(url);
  }

  const role: Role = user.role ?? "USER";
  const home = ROLE_HOME[role];

  if (isGuestOnlyRoute) return NextResponse.redirect(new URL(home, request.url));

  if (!user.phone && !isCompleteProfile) {
    const url = new URL("/complete-profile", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (user.phone && isCompleteProfile) return NextResponse.redirect(new URL(home, request.url));

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/buyer?notice=no-access", request.url));
  }
  // In portfolio demo mode, authenticated clients may freely explore both /buyer and /agent portals.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|fonts/|api/).*)"],
};
