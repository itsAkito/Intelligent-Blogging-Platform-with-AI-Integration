import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAuthUserId } from '@/lib/auth-helpers';

// GET comments for a specific post
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const communityPostId = searchParams.get('communityPostId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = await createClient();
    let query = supabase
      .from('comments')
      .select('*, profiles(id, name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If neither postId nor communityPostId provided, return all recent comments
    if (postId) {
      query = query.eq('post_id', postId);
    } else if (communityPostId) {
      query = query.eq('community_post_id', communityPostId);
    }
    // If neither provided, just return paginated results (for dashboard/analytics)

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new comment (authenticated or guest)
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      // Use arrayBuffer to read body – more reliable than text()/clone() with Clerk middleware.
      const arrayBuffer = await request.arrayBuffer();
      const rawText = Buffer.from(arrayBuffer).toString('utf8');
      if (!rawText || rawText.trim() === '') {
        return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
      }
      body = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { postId, communityPostId, content, guestName, guestEmail } = body;

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required and must be a non-empty string' }, { status: 400 });
    }

    if (!postId && !communityPostId) {
      return NextResponse.json({ error: 'Either postId or communityPostId is required' }, { status: 400 });
    }

    if (postId && typeof postId !== 'string') {
      return NextResponse.json({ error: 'postId must be a string' }, { status: 400 });
    }

    if (communityPostId && typeof communityPostId !== 'string') {
      return NextResponse.json({ error: 'communityPostId must be a string' }, { status: 400 });
    }

    // Sanitize content
    const sanitizedContent = content.trim().substring(0, 5000);

    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError) {
      const errorMsg = clientError instanceof Error ? clientError.message : String(clientError);
      console.error('Failed to create Supabase client:', errorMsg);
      return NextResponse.json({ error: 'Database connection failed', details: errorMsg }, { status: 500 });
    }

    const userId = await getAuthUserId(request);

    // If not authenticated, require guest name and email
    if (!userId) {
      if (!guestName || typeof guestName !== 'string' || guestName.trim().length === 0) {
        return NextResponse.json({ error: 'Name is required for guest comments' }, { status: 400 });
      }
      if (!guestEmail || typeof guestEmail !== 'string' || guestEmail.trim().length === 0) {
        return NextResponse.json({ error: 'Email is required for guest comments' }, { status: 400 });
      }
    }

    const commentData: Record<string, unknown> = {
      content: sanitizedContent,
      user_id: userId || null,
      guest_name: userId ? null : guestName?.trim().substring(0, 100),
      guest_email: userId ? null : guestEmail?.trim().substring(0, 200),
    };

    if (postId) {
      commentData.post_id = postId;
    }

    if (communityPostId) {
      commentData.community_post_id = communityPostId;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select('*, profiles(id, name, avatar_url)')
      .single();

    if (error) {
      console.error('Comment insert error:', error);
      return NextResponse.json({
        error: error.message || 'Failed to create comment',
        details: error.details || null,
        code: error.code || null,
      }, { status: 400 });
    }

    // Update comment count on the post
    if (postId) {
      try {
        await supabase.rpc('increment_comment_count', { p_post_id: postId });
      } catch (rpcError) {
        console.warn('RPC increment_comment_count failed, using fallback:', rpcError);
        // Fallback: manual increment if RPC doesn't exist
        try {
          const { data: postData } = await supabase
            .from('posts')
            .select('comments_count')
            .eq('id', postId)
            .single();

          if (postData) {
            await supabase
              .from('posts')
              .update({ comments_count: (postData.comments_count || 0) + 1 })
              .eq('id', postId);
          }
        } catch (fallbackError) {
          console.error('Fallback comment count update failed:', fallbackError);
          // Don't fail the comment creation for this
        }
      }
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
