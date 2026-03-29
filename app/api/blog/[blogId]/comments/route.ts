import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/blog/[blogId]/comments
 * Add a comment to a blog post
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentCommentId } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert comment
    const { data: comment, error } = await supabase
      .from('blog_comments')
      .insert([
        {
          blog_draft_id: blogId,
          user_id: userId,
          parent_comment_id: parentCommentId || null,
          content: content.trim(),
          is_approved: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        user,
      },
    });
  } catch (error: any) {
    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blog/[blogId]/comments
 * Get all comments for a blog post
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const supabase = await createClient();

    // Get comments with user info
    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select(
        `
        id,
        content,
        likes_count,
        created_at,
        user_id,
        users!inner(id, name, email)
      `
      )
      .eq('blog_draft_id', blogId)
      .eq('is_approved', true)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comments: comments || [],
      count: comments?.length || 0,
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
