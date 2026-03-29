import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = await createClient();

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .single();

    if (fetchError || !otpRecord) {
      // Log failed attempt
      await supabase.from('otp_login_audit').insert({
        email,
        status: 'wrong_code',
        device_info: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from('otp_login_audit').insert({
        email,
        status: 'code_expired',
        device_info: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 401 });
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('email', email)
      .eq('code', code);

    // Upsert user profile so they exist in the database
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com';
    const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'user';
    const profileId = `otp_${email.replace(/[^a-z0-9]/gi, '_')}`;
    const userName = email.split('@')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .upsert(
        [{
          id: profileId,
          email,
          name: userName,
          role,
          updated_at: new Date().toISOString(),
        }],
        { onConflict: 'id' }
      )
      .select()
      .single();

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create OTP session in database
    const { data: _session, error: sessionError } = await supabase
      .from('otp_sessions')
      .insert({
        user_id: profileId,
        email,
        session_token: sessionToken,
        device_info: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create user session. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful login
    await supabase.from('otp_login_audit').insert({
      email,
      user_id: profileId,
      status: 'success',
      device_info: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Prepare user object to send to client
    const userData = {
      id: profile?.id || profileId,
      email,
      name: profile?.name || userName,
      avatar_url: profile?.profile_image_url || null,
      role: profile?.role || role,
    };

    // Set both session cookie AND httpOnly cookie for enhanced security
    const response = NextResponse.json(
      {
        message: 'OTP verified successfully',
        user: userData,
        session_token: sessionToken, // Return token for client-side use
      },
      { status: 200 }
    );

    // Set httpOnly cookie with session token
    response.cookies.set('otp_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Also set the old otp_session cookie for backward compatibility
    response.cookies.set('otp_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
