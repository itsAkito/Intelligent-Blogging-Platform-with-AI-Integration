import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = id;
    const { coverLetter, fullName, email, phone } = await request.json();

    // Validate required fields
    if (!coverLetter || !fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify job exists
    const { data: jobData, error: jobError } = await supabase
      .from('job_listings')
      .select('id, title, company_name, author_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Create application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        user_id: userId,
        status: 'applied',
        cover_letter: coverLetter,
        resume_url: null, // TODO: Handle resume upload
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) throw appError;

    // Update job application count
    await supabase.rpc('increment_job_applications', { job_id: jobId });

    // Create notification for recruiter
    try {
      await supabase.from('notifications').insert({
        user_id: jobData.author_id,
        triggered_by_user_id: userId,
        type: 'job_application',
        post_id: null,
        title: 'New Job Application',
        message: `${fullName} applied for ${jobData.title} at ${jobData.company_name}`,
      });
    } catch (notificationError) {
      console.warn('Failed to create job application notification:', notificationError);
    }

    // Log analytics event
    try {
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: 'job_apply',
        event_data: {
          job_id: jobId,
          company: jobData.company_name,
          position: jobData.title,
        },
      });
    } catch (analyticsError) {
      console.warn('Failed to log job application analytics event:', analyticsError);
    }

    return NextResponse.json(
      {
        success: true,
        application,
        message: 'Application submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting job application:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = id;

    // Check if user has already applied
    const { data: application, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      hasApplied: !!application,
      application: application || null,
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    );
  }
}
