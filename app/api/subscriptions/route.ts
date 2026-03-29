import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET all subscription plans or user's subscription
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const plansOnly = searchParams.get('plansOnly') === 'true';

    const supabase = await createClient();
    
    // Get all plans (public - no auth required)
    if (plansOnly) {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        // If table doesn't exist, return empty plans
        return NextResponse.json({ plans: [] });
      }

      return NextResponse.json({ plans: data || [] });
    }

    // For non-plansOnly requests, get user's subscription (may require auth)
    let targetUserId = userId;
    
    if (!targetUserId) {
      // Try Clerk first
      const clerkAuth = await auth();
      targetUserId = clerkAuth.userId || null;
      
      // Fall back to OTP session
      if (!targetUserId) {
        const otpToken = request.cookies.get("otp_session_token")?.value;
        if (otpToken) {
          const { data: sessions } = await supabase
            .from('otp_sessions')
            .select('user_id')
            .eq('session_token', otpToken)
            .eq('is_active', true)
            .single();
          
          if (sessions?.user_id) {
            targetUserId = sessions.user_id;
          }
        }
      }
    }
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', targetUserId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      return NextResponse.json({ error: subError.message }, { status: 400 });
    }

    // Get all plans for comparison
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    // If user has no subscription, return free plan
    if (!subscription) {
      const freePlan = plans?.find((p) => p.price_monthly === 0);
      return NextResponse.json({
        subscription: null,
        currentPlan: freePlan,
        availablePlans: plans || [],
      });
    }

    return NextResponse.json({
      subscription,
      currentPlan: subscription.subscription_plans,
      availablePlans: plans || [],
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Get subscriptions error:', errorMsg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create or update subscription
export async function POST(request: NextRequest) {
  try {
    const clerkAuth = await auth();
    if (!clerkAuth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle } = body; // billingCycle: 'monthly' or 'annual'

    const supabase = await createClient();

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check for existing subscription
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', clerkAuth.userId)
      .single();

    const price = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + (billingCycle === 'annual' ? 12 : 1));

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          ends_at: endsAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, subscription_plans(*)')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data);
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert([
        {
          user_id: clerkAuth.userId,
          plan_id: planId,
          status: 'active',
          ends_at: endsAt.toISOString(),
          started_at: new Date().toISOString(),
        },
      ])
      .select('*, subscription_plans(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Create subscription error:', errorMsg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT cancel subscription
export async function PUT(request: NextRequest) {
  try {
    const clerkAuth = await auth();
    if (!clerkAuth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', clerkAuth.userId)
      .select('*, subscription_plans(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Cancel subscription error:', errorMsg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
