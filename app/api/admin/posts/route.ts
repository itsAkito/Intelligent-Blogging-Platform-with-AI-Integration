import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';

async function verifyAdmin(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'admin') {
        return userId;
      }
    }
  } catch {
    // Continue to cookie fallback.
  }

  try {
    const adminSessionToken = request.cookies.get('admin_session_token')?.value;
    if (!adminSessionToken) return null;

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
    const decoded = Buffer.from(adminSessionToken, 'base64').toString('utf8');
    const [email] = decoded.split(':');

    if (email?.toLowerCase() === adminEmail) {
      return email;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adminUserId = await verifyAdmin(request);
    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, status, author_id, created_at, views, ai_generated, topic, category, profiles(id, name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%,topic.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load posts' }, { status: 500 });
    }

    return NextResponse.json({
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}