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

const isUserRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
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
    
    // Allow either Clerk-authenticated sessions or OTP sessions.
    if (!userId && !otpSessionToken) {
      if (isAdminRoute(req)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      const authUrl = new URL("/auth", req.url);
      authUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(authUrl);
    }

    // Try to get user profile for role checking
    try {
      if (userId) {
        const response = await fetch(new URL("/api/user/profile", req.url), {
          headers: {
            cookie: req.headers.get("cookie") || "",
            authorization: `Bearer ${req.headers.get("authorization") || ""}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          const userRole = profile.role || "user";

          // Admin trying to access user-only route - redirect to admin
          if (userRole === "admin" && isUserRoute(req)) {
            return NextResponse.redirect(new URL("/admin", req.url));
          }
          // Regular user trying to access admin route - redirect to dashboard
          if (userRole !== "admin" && isAdminRoute(req)) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        }
      }
    } catch (error) {
      // Continue normally if profile check fails
      console.error("Profile check failed:", error);
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
