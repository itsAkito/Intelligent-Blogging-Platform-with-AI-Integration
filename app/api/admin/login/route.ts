import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Simple credential check (for development)
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      return NextResponse.json(
        {
          message: 'Admin login successful',
          admin: {
            email: adminEmail,
            role: 'admin',
          },
          token: Buffer.from(`${email}:${Date.now()}`).toString('base64'),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
