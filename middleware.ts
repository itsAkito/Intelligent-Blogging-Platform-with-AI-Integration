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
    const { userId } = await auth();
    const otpSessionToken = req.cookies.get("otp_session_token")?.value;
    const adminSessionToken = req.cookies.get("admin_session_token")?.value;
    let isAuthenticated = !!userId;
    
    if (!userId && !otpSessionToken && !adminSessionToken) {
      if (isAdminRoute(req)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      const authUrl = new URL("/auth", req.url);
      authUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(authUrl);
    }

    // Check user role for admin routes
    let userRole = "user";
    const hasAdminCookieForAdminRoute = !!adminSessionToken && isAdminRoute(req);

    try {
      if (hasAdminCookieForAdminRoute) {
        userRole = "admin";
        isAuthenticated = true;
      } else if (userId) {
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
      } else if (otpSessionToken) {
        // For OTP sessions, validate token and resolve role from server session
        try {
          const sessionRes = await fetch(new URL("/api/auth/otp/session", req.url), {
            headers: {
              cookie: req.headers.get("cookie") || `otp_session_token=${otpSessionToken}`,
            },
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            userRole = sessionData.user?.role || "user";
            isAuthenticated = true;
          } else {
            isAuthenticated = false;
          }
        } catch {
          isAuthenticated = false;
          userRole = "user";
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

      // Role-based route protection
      if (isAdminRoute(req)) {
        if (userRole !== "admin") {
          // Non-admin users hitting admin routes should be sent to admin login.
          return NextResponse.redirect(new URL("/admin/login", req.url));
        }
      }
    } catch (error) {
      // Continue normally if profile check fails, but be strict with admin routes
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
