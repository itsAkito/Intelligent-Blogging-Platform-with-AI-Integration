import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAuthUserId } from '@/lib/auth-helpers';

function isFollowRequestSchemaError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes('follow_requests') ||
    message.includes('responded_at') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = request.nextUrl.searchParams.get('user_id');
    const type = request.nextUrl.searchParams.get('type') || 'followers';

    if (type === 'requests') {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('id, from_user_id, to_user_id, status, created_at')
        .eq('to_user_id', targetUserId || userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const requesterIds = [...new Set((data || []).map((r) => r.from_user_id))];
      let profilesById: Record<string, { name?: string; email?: string; avatar_url?: string }> = {};

      if (requesterIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id,name,email,avatar_url')
          .in('id', requesterIds);

        profilesById = Object.fromEntries((profileRows || []).map((p) => [p.id, p]));
      }

      const requests = (data || []).map((r) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        status: r.status,
        created_at: r.created_at,
        profile: profilesById[r.from_user_id] || null,
      }));

      return NextResponse.json({ requests, count: requests.length });
    }

    let query = supabase
      .from('user_follows')
      .select('follower_id, following_id, created_at')
      .limit(100);

    if (type === 'followers') {
      query = query.eq('following_id', targetUserId || userId);
    } else if (type === 'following') {
      query = query.eq('follower_id', targetUserId || userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const ids = [...new Set((data || []).map((f) => (type === 'followers' ? f.follower_id : f.following_id)))];
    let profilesById: Record<string, { name?: string; email?: string; avatar_url?: string }> = {};

    if (ids.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id,name,email,avatar_url')
        .in('id', ids);

      profilesById = Object.fromEntries((profileRows || []).map((p) => [p.id, p]));
    }

    const follows = (data || []).map((f) => {
      const id = type === 'followers' ? f.follower_id : f.following_id;
      return {
        id,
        ...profilesById[id],
        followedAt: f.created_at,
      };
    });

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
    const followerUserId = await getAuthUserId(request);

    if (!followerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followingUserId } = await request.json();

    if (!followingUserId) {
      return NextResponse.json({ error: 'followingUserId is required' }, { status: 400 });
    }

    if (followerUserId === followingUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data: alreadyFollowing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerUserId)
      .eq('following_id', followingUserId)
      .single();

    if (alreadyFollowing) {
      return NextResponse.json({ success: true, message: 'Already following', status: 'accepted' });
    }

    let requestId: string | undefined;
    let status: 'pending' | 'accepted' = 'pending';
    let message = 'Follow request sent';

    try {
      const { data: existingRequest, error: existingRequestError } = await supabase
        .from('follow_requests')
        .select('id,status')
        .eq('from_user_id', followerUserId)
        .eq('to_user_id', followingUserId)
        .single();

      if (existingRequestError && existingRequestError.code !== 'PGRST116') {
        throw existingRequestError;
      }

      requestId = existingRequest?.id;

      if (existingRequest?.status === 'pending') {
        return NextResponse.json({ success: true, message: 'Follow request already pending', status: 'pending', requestId });
      }

      if (existingRequest) {
        const { data: updatedRequest, error: updateError } = await supabase
          .from('follow_requests')
          .update({ status: 'pending', responded_at: null })
          .eq('id', existingRequest.id)
          .select('id')
          .single();

        if (updateError) throw updateError;
        requestId = updatedRequest.id;
      } else {
        const { data: newRequest, error: requestError } = await supabase
          .from('follow_requests')
          .insert({
            from_user_id: followerUserId,
            to_user_id: followingUserId,
            status: 'pending',
          })
          .select('id')
          .single();

        if (requestError) throw requestError;
        requestId = newRequest.id;
      }
    } catch (followRequestError) {
      if (!isFollowRequestSchemaError(followRequestError)) {
        throw followRequestError;
      }

      const { error: directFollowError } = await supabase
        .from('user_follows')
        .upsert(
          { follower_id: followerUserId, following_id: followingUserId },
          { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
        );

      if (directFollowError) {
        throw directFollowError;
      }

      status = 'accepted';
      message = 'Following';
    }

    try {
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', followerUserId)
        .single();

      const followerName = followerProfile?.name || 'A user';

      await supabase.from('notifications').insert({
        user_id: followingUserId,
        related_user_id: followerUserId,
        type: status === 'pending' ? 'follow_request' : 'follow',
        title: status === 'pending' ? 'Follow Request' : 'New Follower',
        message:
          status === 'pending'
            ? `${followerName} wants to follow you`
            : `${followerName} started following you`,
        action_url: status === 'pending' && requestId ? `follow_request:${requestId}` : null,
        icon: 'person_add',
      });
    } catch (notificationError) {
      console.warn('Failed to create follow request notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      status,
      requestId,
      message,
    });
  } catch (error) {
    console.error('Error creating follow request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send follow request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const followerUserId = await getAuthUserId(request);

    if (!followerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followingUserId = request.nextUrl.searchParams.get('following_id');

    if (!followingUserId) {
      return NextResponse.json({ error: 'following_id is required' }, { status: 400 });
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
