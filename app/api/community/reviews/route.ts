import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET reviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const limit = request.nextUrl.searchParams.get('limit') || '20';

    const { data, error } = await supabase
      .from('post_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        post_id,
        profiles(id, name, email, avatar_url),
        posts(id, title, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const reviews = (data || []).map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      author: {
        id: r.profiles?.[0]?.id || r.user_id,
        name: r.profiles?.[0]?.name || 'Unknown',
        email: r.profiles?.[0]?.email || '',
        avatar_url: r.profiles?.[0]?.avatar_url,
      },
      postTitle: r.posts?.[0]?.title || 'Untitled',
      postSlug: r.posts?.[0]?.slug || '',
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST a new review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postSlug, rating, comment } = await request.json();

    if (!postSlug || !rating || !comment) {
      return NextResponse.json(
        { error: 'postSlug, rating, and comment are required' },
        { status: 400 }
      );
    }

    // Find the post by slug
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', postSlug)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Insert review
    const { data, error } = await supabase
      .from('post_reviews')
      .insert({
        user_id: userId,
        post_id: post.id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data, success: true });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
