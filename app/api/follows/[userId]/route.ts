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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const currentUserId = await getAuthUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = await params;

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data: alreadyFollowing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single();

    if (alreadyFollowing) {
      return NextResponse.json({ success: true, status: 'accepted', message: 'Already following' });
    }

    let requestId: string | undefined;
    let status: 'pending' | 'accepted' = 'pending';

    try {
      const { data: existingRequest, error: existingRequestError } = await supabase
        .from('follow_requests')
        .select('id,status')
        .eq('from_user_id', currentUserId)
        .eq('to_user_id', targetUserId)
        .single();

      if (existingRequestError && existingRequestError.code !== 'PGRST116') {
        throw existingRequestError;
      }

      requestId = existingRequest?.id;

      if (existingRequest?.status === 'pending') {
        return NextResponse.json({ success: true, status: 'pending', requestId, message: 'Request already pending' });
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
            from_user_id: currentUserId,
            to_user_id: targetUserId,
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
          { follower_id: currentUserId, following_id: targetUserId },
          { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
        );

      if (directFollowError) throw directFollowError;
      status = 'accepted';
    }

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      related_user_id: currentUserId,
      type: status === 'pending' ? 'follow_request' : 'follow',
      title: status === 'pending' ? 'Follow Request' : 'New Follower',
      message: status === 'pending' ? 'Someone wants to follow you' : 'Someone started following you',
      action_url: status === 'pending' && requestId ? `follow_request:${requestId}` : null,
      icon: 'person_add',
      is_read: false,
    });

    return NextResponse.json({ success: true, status, requestId });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const currentUserId = await getAuthUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = await params;

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
