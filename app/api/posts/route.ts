import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const published = searchParams.get('published') === 'true';
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const topic = searchParams.get('topic');

    // Validate Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      return NextResponse.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        warning: 'Supabase not configured. Returning empty posts.'
      });
    }

    const supabase = await createClient();
    let query = supabase
      .from('posts')
      .select('*, profiles(id, name, avatar_url)', { count: 'exact' });

    if (published) {
      query = query.eq('status', 'published');
    }

    if (userId) {
      query = query.eq('author_id', userId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (topic) {
      query = query.eq('topic', topic);
    }

    const offset = (page - 1) * limit;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Posts query error:', error.message, error.code);
      
      // If it's a schema error, return empty results instead of 400
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return NextResponse.json({
          posts: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          warning: 'Database schema not initialized. Please run migrations.'
        });
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      posts: data,
      pagination: {
        page, limit, total: count,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { title, content, excerpt, image_url, cover_image_url, published, ai_generated, aiGenerated, topic, status, userId: bodyUserId } = body;

    // Get user ID from either Clerk auth or OTP session
    let userId = bodyUserId;
    
    // Try Clerk auth first
    const clerkAuth = await auth();
    if (clerkAuth.userId) {
      userId = clerkAuth.userId;
    } else {
      // Check for OTP session
      const otpSession = request.cookies.get("otp_session");
      if (!otpSession?.value && !bodyUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For OTP users, userId should be in the bodyUserId or we extract from the profile
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const isAiGenerated = ai_generated || aiGenerated || false;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id: userId,
        title,
        content,
        excerpt: excerpt || content.substring(0, 160),
        cover_image_url: cover_image_url || image_url || null,
        slug,
        status: published ? 'published' : (status || 'draft'),
        ai_generated: isAiGenerated,
        topic: topic || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create post error:', error);
      return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post created successfully', post: data }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
