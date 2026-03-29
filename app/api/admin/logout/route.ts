import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Logout Endpoint
 * POST /api/admin/logout
 * 
 * Clears admin session and redirects to home or login
 */

export async function POST() {
  try {
    // Frontend should clear localStorage:
    // localStorage.removeItem('adminToken');
    // localStorage.removeItem('adminEmail');

    // Return response indicating logout success
    return NextResponse.json(
      {
        success: true,
        message: 'Admin logout successful'
      },
      { 
        status: 200,
        // Clear any server-side cookies if used
        headers: {
          'Set-Cookie': 'adminToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
        }
      }
    );
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
