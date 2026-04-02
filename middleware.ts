import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
  "/admin(.*)",
  "/api/posts(.*)",
]);

const isAuthEntryRoute = createRouteMatcher([
  "/auth(.*)",
  "/admin/login(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip redirects for API routes and static assets
  if (req.nextUrl.pathname.startsWith("/api") || req.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Keep auth entry pages accessible to OTP and Clerk users without forced redirects.
  if (isAuthEntryRoute(req)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    const otpSessionToken = req.cookies.get("otp_session_token")?.value;
    const adminSessionToken = req.cookies.get("admin_session_token")?.value;

    // Admin cookie: grant access to admin routes only — block non-admin routes.
    // This prevents admin-only sessions from accessing /dashboard, /editor, etc.
    if (adminSessionToken && !otpSessionToken) {
      if (isAdminRoute(req)) {
        return NextResponse.next();
      }
      // Admin cookie holder trying to access a non-admin protected route without Clerk/OTP auth
      const { userId } = await auth();
      if (!userId) {
        // Not a Clerk user — redirect to admin panel
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      // If they also have a Clerk session, let them through (dual auth)
    } else if (adminSessionToken && isAdminRoute(req)) {
      return NextResponse.next();
    }

    // OTP session: grant access immediately for non-admin protected routes
    if (otpSessionToken && !isAdminRoute(req)) {
      return NextResponse.next();
    }

    // For Clerk-based users, check Clerk auth state
    const { userId } = await auth();

    if (!userId && !otpSessionToken && !adminSessionToken) {
      if (isAdminRoute(req)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      const authUrl = new URL("/auth", req.url);
      authUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(authUrl);
    }

    // Check user role for admin routes (Clerk users only at this point)
    let userRole = "user";
    let isAuthenticated = !!userId;

    try {
      if (userId) {
        const response = await fetch(new URL("/api/user/profile", req.url), {
          headers: {
            cookie: req.headers.get("cookie") || "",
          },
        });

        if (response.ok) {
          const profilePayload = await response.json();
          const resolvedProfile = profilePayload?.profile || profilePayload;
          userRole = resolvedProfile?.role || "user";
          isAuthenticated = true;
        }
      }

      if (!isAuthenticated) {
        if (isAdminRoute(req)) {
          return NextResponse.redirect(new URL("/admin/login", req.url));
        }
        const authUrl = new URL("/auth", req.url);
        authUrl.searchParams.set("next", req.nextUrl.pathname);
        return NextResponse.redirect(authUrl);
      }

      // Role-based route protection: Clerk users trying to access admin routes
      if (isAdminRoute(req) && userRole !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch (error) {
      console.error("Profile check failed:", error);
      if (isAdminRoute(req)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
