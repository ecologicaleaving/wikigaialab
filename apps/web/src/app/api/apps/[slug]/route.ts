import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { slug } = params;

    // Get app details with related data
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select(`
        *,
        problems(
          id,
          title,
          description,
          status,
          vote_count,
          created_at
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: 'App non trovata' },
        { status: 404 }
      );
    }

    // Check user authentication for personalized data
    const { data: { user } } = await supabase.auth.getUser();
    
    let userAccess = null;
    let userUsage = null;

    if (user) {
      // Get user access information
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, total_votes_cast')
        .eq('id', user.id)
        .single();

      if (userData) {
        // Determine user access level based on votes
        const hasVotedEnough = (userData.total_votes_cast || 0) >= 5; // Configurable threshold
        const hasActiveSubscription = userData.subscription_status === 'active';
        
        userAccess = {
          canAccessPremium: hasVotedEnough || hasActiveSubscription,
          votesNeeded: Math.max(0, 5 - (userData.total_votes_cast || 0)),
          subscriptionStatus: userData.subscription_status
        };
      }

      // TODO: Implement user usage tracking when app_usage table is created
      userUsage = null;
    }

    // TODO: Implement view count tracking when analytics functions are created

    return NextResponse.json({
      app,
      userAccess,
      userUsage
    });

  } catch (error) {
    console.error('Unexpected error in app detail API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}