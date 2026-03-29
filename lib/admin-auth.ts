import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to verify admin access
 * Use this in admin API routes to verify the user is an admin
 */

export function verifyAdminStatus(user: any): boolean {
  if (!user) return false;
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com';
  return user.email?.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Verify admin token/session
 */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  
  // Check if token matches admin token in environment
  const expectedToken = process.env.ADMIN_TOKEN;
  if (expectedToken) {
    return token === expectedToken;
  }
  
  return false;
}

/**
 * Extract user info from request headers or cookies
 */
export function getAdminFromRequest(request: NextRequest): {
  email?: string;
  role?: string;
  isAdmin?: boolean;
} | null {
  // Method 1: Check authorization header (JWT or bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (verifyAdminToken(token)) {
      return { 
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        isAdmin: true
      };
    }
  }

  // Method 2: Check admin token in headers
  const adminToken = request.headers.get('x-admin-token');
  if (adminToken && verifyAdminToken(adminToken)) {
    return {
      email: process.env.ADMIN_EMAIL,
      role: 'admin',
      isAdmin: true
    };
  }

  // Method 3: Check localStorage data passed in request body (if applicable)
  // This would need to be handled in individual routes

  return null;
}

/**
 * Middleware function to protect admin routes
 */
export function requireAdmin(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      // Verify admin token/session
      const admin = getAdminFromRequest(request);
      
      if (!admin || !admin.isAdmin) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Admin access required'
          },
          { status: 403 }
        );
      }

      return await handler(request);
    } catch (error) {
      console.error('Admin verification error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
