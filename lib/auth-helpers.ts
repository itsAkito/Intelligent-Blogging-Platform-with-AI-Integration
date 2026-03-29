import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Get authenticated user ID from either Clerk or OTP session
 */
export async function getAuthUserId(request?: NextRequest): Promise<string | null> {
  try {
    // First try Clerk
    const { userId } = await auth();
    if (userId) return userId;
  } catch {}

  // Fall back to OTP session from database
  if (request) {
    try {
      const supabase = await createClient();
      const otpSessionToken = request.cookies.get("otp_session_token")?.value;
      const otpSession = request.cookies.get("otp_session")?.value;
      
      if (otpSessionToken || otpSession) {
        // Get user from OTP session (via the session endpoint)
        // This assumes there's a way to retrieve the authenticated user
        const response = await fetch(new URL("/api/auth/otp/session", request.url).toString(), {
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        }).catch(() => null);
        
        if (response?.ok) {
          const data = await response.json();
          return data.user?.id || null;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Verify if user is admin (checks Clerk or OTP auth)
 */
export async function verifyAdminWithOTP(request?: NextRequest): Promise<string | null> {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return null;

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'admin') {
      return userId;
    }
  } catch {}

  return null;
}
