import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Get user notifications
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, related_user:related_user_id(id,name,email), post:related_post_id(id,title,slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      notifications,
      unreadCount: notifications?.filter((n: any) => !n.is_read).length || 0,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create notification (internal API - requires auth)
export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId, userId, type, title, message, relatedUserId, relatedPostId } = body;

    // Handle mark-read action
    if (action === 'mark-read' && notificationId) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', authUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Notification marked as read',
        success: true 
      }, { status: 200 });
    }

    // Handle mark-all-read action
    if (action === 'mark-all-read') {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', authUserId)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'All notifications marked as read',
        success: true 
      }, { status: 200 });
    }

    // Handle delete action
    if (action === 'delete' && notificationId) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', authUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Notification deleted',
        success: true 
      }, { status: 200 });
    }

    // Default: Create notification (internal API)
    if (!userId || !type || !title) {
      return NextResponse.json({ error: 'userId, type, and title are required' }, { status: 400 });
    }

    const adminClient = await createAdminClient();
    const { data: notification, error } = await adminClient
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        related_user_id: relatedUserId,
        related_post_id: relatedPostId,
        is_read: false,
      }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(notification![0], { status: 201 });
  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
