import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SessionData {
  session?: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    role?: "USER" | "AGENT" | "ADMIN";
    banned?: boolean;
    banReason?: string;
  };
}

/**
 * Authoritative Route Protection & Role-Based Access Control Middleware
 * Governed by Step 2.7, docs/architecture/AUTH.md, and docs/SETTLY_ARCHITECTURE.md
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify Target Route Category
  const isBuyerRoute = pathname.startsWith("/buyer");
  const isAgentRoute = pathname.startsWith("/agent");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password";

  const isProtectedRoute = isBuyerRoute || isAgentRoute || isAdminRoute;

  // If route is public and not an auth page, allow immediately
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // 2. Extract Session Cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("settly_session")?.value;

  // Fast path: Unauthenticated access to protected route -> redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Introspect Session from Backend Server
  let sessionData: SessionData | null = null;
  if (sessionCookie) {
    try {
      const authRes = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      });

      if (authRes.ok) {
        sessionData = await authRes.json();
      }
    } catch {
      // If backend is momentarily unreachable, proceed with caution or reject
      sessionData = null;
    }
  }

  const user = sessionData?.user;
  const isAuthenticated = Boolean(user && sessionData?.session);

  // 4. Guard Protected Routes against Invalid / Expired Sessions
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Guard Against Banned Accounts
  if (isAuthenticated && user?.banned) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "banned");
    return NextResponse.redirect(loginUrl);
  }

  // 6. Redirect Authenticated Users Away from Auth Pages (/login, /register, etc.)
  if (isAuthRoute && isAuthenticated && user) {
    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/verification", request.url));
    }
    if (user.role === "AGENT") {
      return NextResponse.redirect(new URL("/agent/overview", request.url));
    }
    return NextResponse.redirect(new URL("/buyer/overview", request.url));
  }

  // 7. Role-Based Authorization Checks
  if (isAuthenticated && user) {
    const role = user.role || "USER";

    // Admin Routes: Strict ADMIN Only
    if (isAdminRoute && role !== "ADMIN") {
      const fallbackUrl = role === "AGENT" ? "/agent/overview" : "/buyer/overview";
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    // Agent Routes: AGENT or ADMIN Only
    if (isAgentRoute && role !== "AGENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/buyer/overview", request.url));
    }

    // Buyer Routes: Prevent Agents from confusing portals
    if (isBuyerRoute && role === "AGENT") {
      return NextResponse.redirect(new URL("/agent/overview", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - images/ (public images)
     * - api/ (direct API calls)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};
