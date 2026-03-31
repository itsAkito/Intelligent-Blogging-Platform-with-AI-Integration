import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/signout
 *
 * Unified sign-out for ALL auth types — no Clerk Server Actions involved:
 *   - Clerk sessions  → revoked via Clerk backend SDK + browser cookies cleared
 *   - OTP sessions    → otp_session_token cookie cleared
 *   - Admin sessions  → admin_session_token cookie cleared
 *
 * Clearing Clerk's __session cookie immediately terminates browser state
 * without waiting for the short-lived JWT to expire.
 */
export async function POST(_request: Request) {
  const response = NextResponse.json({ success: true }, { status: 200 });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  const cookieOptsPublic = { ...cookieOpts, httpOnly: false };

  // 1. Revoke the Clerk session server-side (so long-lived token is invalidated)
  try {
    const { sessionId } = await auth();
    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    }
  } catch {
    // Non-fatal — OTP/admin users have no Clerk session
  }

  // 2. Clear ALL Clerk browser cookies so UI signed-out state is immediate
  //    (Clerk short-lived JWT would otherwise keep user "logged in" for up to 60s)
  response.cookies.set("__session", "", cookieOpts);
  response.cookies.set("__client_uat", "", cookieOptsPublic);
  response.cookies.set("__clerk_db_jwt", "", cookieOptsPublic); // dev mode only

  // 3. Clear custom auth cookies
  response.cookies.set("otp_session_token", "", cookieOpts);
  response.cookies.set("otp_session", "", cookieOpts);
  response.cookies.set("admin_session_token", "", cookieOpts);

  return response;
}

