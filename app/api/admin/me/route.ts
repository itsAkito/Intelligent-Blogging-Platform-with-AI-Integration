import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/me
 * Lightweight endpoint — validates admin_session_token cookie and returns admin profile.
 * Used by AuthContext to detect admin sessions without hitting heavy activity endpoints.
 */
export async function GET(request: NextRequest) {
  const adminSessionToken = request.cookies.get('admin_session_token')?.value;

  if (!adminSessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const decoded = Buffer.from(adminSessionToken, 'base64').toString('utf-8');
    const colonIdx = decoded.lastIndexOf(':');
    const email = decoded.substring(0, colonIdx);
    const timestampStr = decoded.substring(colonIdx + 1);
    const timestamp = parseInt(timestampStr, 10);

    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (!email || isNaN(timestamp) || Date.now() - timestamp > EIGHT_HOURS) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com';
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      admin: {
        id: 'admin-session',
        email: adminEmail,
        name: process.env.ADMIN_DISPLAY_NAME || 'Administrator',
        role: 'admin',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }
}
