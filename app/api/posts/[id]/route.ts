import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { logActivity } from '@/lib/activity-log';

function isMissingCategoryColumn(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;
  const message = typeof error === 'object' && error !== null ? (error as { message?: string }).message : undefined;
  if (code !== 'PGRST204' && code !== '42703') return false;
  return typeof message === 'string' && message.toLowerCase().includes('category');
}

async function tryReadJsonBody(request: NextRequest): Promise<Record<string, any>> {
  const contentLength = request.headers.get('content-length');
  if (contentLength === '0') return {};

  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    
    // Check if id looks like a UUID (36 chars with dashes) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const query = supabase
      .from('posts')
      .select('*, profiles(id, name, avatar_url)');
    
    if (isUUID) {
      query.eq('id', id);
    } else {
      query.eq('slug', id);
    }
    
    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment views via RPC (fire-and-forget, don't block response)
    try {
      await supabase.rpc('increment_post_views', { post_id: data.id });
    } catch (rpcError) {
      console.warn(`Failed to increment views for post ${data.id}:`, rpcError);
    }

    const currentUserId = await getAuthUserId(request);

    const [{ count: likesCount }, { count: commentsCount }, likedRow] = await Promise.all([
      supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', data.id),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', data.id),
      currentUserId
        ? supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', data.id)
            .eq('user_id', currentUserId)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    const postWithLiveCounts = {
      ...data,
      likes_count: likesCount || 0,
      comments_count: commentsCount || 0,
      liked_by_current_user: !!likedRow?.data,
    };

    return NextResponse.json(postWithLiveCounts);
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await _request.json();
    let userId = body.userId;
    
    const clerkAuth = await auth();
    if (clerkAuth.userId) {
      userId = clerkAuth.userId;
    } else {
      const otpSession = _request.cookies.get("otp_session");
      if (!otpSession?.value && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const { title, content, excerpt, image_url, cover_image_url, published, status, topic, category } = body;

    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('id,author_id,status')
      .eq('id', id)
      .single();

    if (existingPostError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isOwner = existingPost.author_id === userId;
    if (!isOwner) {
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('post_collaborators')
        .select('id,permission,status')
        .eq('post_id', id)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single();

      if (collaboratorError || !collaborator || collaborator.permission !== 'editor') {
        return NextResponse.json({ error: 'Forbidden: no edit permission for this draft' }, { status: 403 });
      }

      if ((status === 'published' || published === true) && existingPost.status !== 'published') {
        return NextResponse.json({ error: 'Only owner can publish this post' }, { status: 403 });
      }
    }

    const updateData: Record<string, any> = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (cover_image_url !== undefined || image_url !== undefined) updateData.cover_image_url = cover_image_url || image_url;
    if (published !== undefined) updateData.status = published ? 'published' : 'draft';
    if (status !== undefined) updateData.status = status;
    if (topic !== undefined) updateData.topic = topic;
    if (category !== undefined) updateData.category = category;

    let updateResult = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateResult.error && isMissingCategoryColumn(updateResult.error)) {
      const fallbackData = { ...updateData };
      delete (fallbackData as Record<string, any>).category;

      updateResult = await supabase
        .from('posts')
        .update(fallbackData)
        .eq('id', id)
        .select()
        .single();
    }

    const data = updateResult.data;
    const error = updateResult.error;

    if (error) {
      console.error('Update post error:', error);
      return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 });
    }

    await logActivity({
      userId,
      activityType: 'post_updated',
      entityType: 'post',
      entityId: id,
      metadata: {
        updatedFields: Object.keys(updateData),
        status: updateData.status || existingPost.status,
      },
    });

    return NextResponse.json({ message: 'Post updated successfully', post: data });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await tryReadJsonBody(_request);
    let userId = body.userId || (await getAuthUserId(_request));

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    let isAdmin = false;
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (requesterProfile?.role === 'admin') {
      isAdmin = true;
    }

    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (existingPostError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.author_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Only the owner or an admin can delete this post' }, { status: 403 });
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      console.error('Delete post error:', error);
      return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 });
    }

    await logActivity({
      userId,
      activityType: isAdmin ? 'admin_post_deleted' : 'post_deleted',
      entityType: 'post',
      entityId: id,
      metadata: {
        title: existingPost.title || null,
        deletedByAdmin: isAdmin,
      },
    });

    return NextResponse.json({ message: isAdmin ? 'Post deleted by admin' : 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
