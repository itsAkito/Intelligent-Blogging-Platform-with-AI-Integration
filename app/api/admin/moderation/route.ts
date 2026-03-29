import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Admin moderation endpoints for managing posts and comments
 * POST /api/admin/moderation - Perform moderation action (approve/reject/flag)
 * GET /api/admin/moderation - Get pending items for moderation
 */

// GET pending items requiring moderation
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'posts'; // 'posts' or 'comments'

    if (type === 'posts') {
      // Get pending posts
      const { data: pendingPosts, error } = await supabase
        .from('posts_pending_approval')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        type: 'posts',
        items: pendingPosts || [],
        count: pendingPosts?.length || 0 
      });
    } else if (type === 'comments') {
      // Get pending comments
      const { data: pendingComments, error } = await supabase
        .from('comments_pending_approval')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        type: 'comments',
        items: pendingComments || [],
        count: pendingComments?.length || 0 
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Get moderation items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST moderation actions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { action, itemType, itemId, reason } = body;

    if (!action || !itemType || !itemId) {
      return NextResponse.json({ 
        error: 'action, itemType, and itemId are required' 
      }, { status: 400 });
    }

    if (itemType === 'post') {
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_post', {
          p_post_id: itemId,
          p_approved_by: userId,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
          message: 'Post approved successfully',
          success: true 
        }, { status: 200 });
      } else if (action === 'reject') {
        const { error } = await supabase.rpc('reject_post', {
          p_post_id: itemId,
          p_approved_by: userId,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
          message: 'Post rejected successfully',
          success: true 
        }, { status: 200 });
      }
    } else if (itemType === 'comment') {
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_comment', {
          p_comment_id: itemId,
          p_approved_by: userId,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
          message: 'Comment approved successfully',
          success: true 
        }, { status: 200 });
      } else if (action === 'reject') {
        const { error } = await supabase.rpc('reject_comment', {
          p_comment_id: itemId,
          p_approved_by: userId,
          p_reason: reason || 'Rejected by moderator',
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
          message: 'Comment rejected and deleted',
          success: true 
        }, { status: 200 });
      } else if (action === 'flag') {
        const { error } = await supabase.rpc('flag_comment_as_spam', {
          p_comment_id: itemId,
          p_reason: reason || 'Flagged by moderator',
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
          message: 'Comment flagged as spam',
          success: true 
        }, { status: 200 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
