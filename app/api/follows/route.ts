import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const userId = user?.id || request.headers.get('app-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const targetUserId = request.nextUrl.searchParams.get('user_id');
    const type = request.nextUrl.searchParams.get('type') || 'followers'; // followers, following, requests

    let query = supabase.from('user_follows').select('follower_id, following_id, created_at, profiles(name, email, avatar_url)');

    if (type === 'followers') {
      query = query.eq('following_id', targetUserId || userId);
    } else if (type === 'following') {
      query = query.eq('follower_id', targetUserId || userId);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    const follows = data?.map(f => ({
      id: type === 'followers' ? f.follower_id : f.following_id,
      ...f.profiles,
      followedAt: f.created_at
    })) || [];

    return NextResponse.json({ follows, count: follows.length });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const followerUserId = user?.id || request.headers.get('app-user-id');
    if (!followerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followingUserId } = await request.json();

    if (!followingUserId) {
      return NextResponse.json(
        { error: 'followingUserId is required' },
        { status: 400 }
      );
    }

    if (followerUserId === followingUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerUserId,
        following_id: followingUserId,
      })
      .select()
      .single();

    if (error && error.code !== '23505') { // 23505 is unique constraint violation
      throw error;
    }

    // Create notification
    try {
      // Get follower's profile for notification
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', followerUserId)
        .single();

      const followerName = followerProfile?.name || 'A user';

      await supabase.from('notifications').insert({
        user_id: followingUserId,
        related_user_id: followerUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${followerName} started following you`,
        icon: 'person_add',
        action_url: `/profile/${followerUserId}`,
      });
    } catch (notificationError) {
      console.warn('Failed to create follow notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      follow: data || { follower_id: followerUserId, following_id: followingUserId }
    });
  } catch (error) {
    console.error('Error creating follow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create follow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const followerUserId = user?.id || request.headers.get('app-user-id');
    if (!followerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followingUserId = request.nextUrl.searchParams.get('following_id');

    if (!followingUserId) {
      return NextResponse.json(
        { error: 'following_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerUserId)
      .eq('following_id', followingUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting follow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unfollow' },
      { status: 500 }
    );
  }
}
