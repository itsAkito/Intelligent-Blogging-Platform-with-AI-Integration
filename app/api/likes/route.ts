import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const postId = request.nextUrl.searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('post_likes')
      .select('user_id, profiles(name, email, avatar_url)')
      .eq('post_id', postId);

    if (error) throw error;

    return NextResponse.json({
      likes: data?.map(like => ({ ...like.profiles, likedAt: like.user_id })) || [],
      count: data?.length || 0,
      likedByCurrentUser: false // Will be set by client if needed
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id || request.headers.get('app-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // First, get the post to find the author
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Insert like
    const { data, error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId })
      .select()
      .single();

    if (error && error.code !== '23505') {
      throw error;
    }

    // Get updated like count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    // Create notification if the post author is different from the liker
    try {
      if (userId !== postData.author_id) {
        await supabase.from('notifications').insert({
          user_id: postData.author_id,
          triggered_by_user_id: userId,
          type: 'like',
          post_id: postId,
          title: 'New Like',
          message: 'Someone liked your post',
        });
      }
    } catch (notificationError) {
      console.warn('Failed to create like notification:', notificationError);
    }

    return NextResponse.json({ success: true, like: data, count: count || 0 });
  } catch (error) {
    console.error('Error creating like:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to like post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id || request.headers.get('app-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = request.nextUrl.searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    // Get updated like count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('Error deleting like:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unlike post' },
      { status: 500 }
    );
  }
}
