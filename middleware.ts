import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/editor(.*)",
  "/admin(.*)",
  "/api/posts(.*)",
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

  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    
    // Protect with Clerk
    if (!userId) {
      await auth.protect();
      return;
    }

    // Try to get user profile for role checking
    try {
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
