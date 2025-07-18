/**
 * Activity Feed API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/feed/activity - Get personalized activity feed for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserActivityFeedResponse } from '@wikigaialab/shared/types/social';

// Initialize Supabase client helper
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Initialize social service helper
function getSocialService() {
  return new SocialService({ databaseClient: getSupabaseClient() });
}

/**
 * Helper function to authenticate user
 */
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}

/**
 * GET /api/feed/activity
 * Get personalized activity feed for authenticated user
 * Includes activities from followed users and own activities
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const authUser = await authenticateUser(request);
    const userId = authUser.id;

    const url = new URL(request.url);
    
    // Get query parameters
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const activityType = url.searchParams.get('activity_type');
    const timeframe = url.searchParams.get('timeframe'); // 'day', 'week', 'month', 'all'

    // Get personalized activity feed
    let { activities, total, hasMore } = await socialService.getActivityFeed(
      userId,
      page,
      limit
    );

    // Filter by activity type if specified
    if (activityType) {
      activities = activities.filter(activity => activity.activity_type === activityType);
    }

    // Filter by timeframe if specified
    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (timeframe) {
        case 'day':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0); // No filtering
      }

      activities = activities.filter(activity => 
        new Date(activity.created_at) >= cutoffDate
      );
    }

    // Enrich activities with additional context data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const enrichedActivity = { ...activity };

        try {
          // Add related entity data based on type
          switch (activity.entity_type) {
            case 'problem':
              if (activity.entity_id) {
                const { data: problem } = await supabase
                  .from('problems')
                  .select(`
                    id, title, description, status, vote_count, created_at,
                    proposer:users!proposer_id(id, name, email, avatar_url),
                    category:categories(id, name)
                  `)
                  .eq('id', activity.entity_id)
                  .single();
                
                if (problem) {
                  enrichedActivity.metadata = {
                    ...enrichedActivity.metadata,
                    problem
                  };
                }
              }
              break;

            case 'achievement':
              if (activity.entity_id) {
                const { data: achievement } = await supabase
                  .from('achievements')
                  .select('id, name, description, icon, category, points')
                  .eq('id', activity.entity_id)
                  .single();
                
                if (achievement) {
                  enrichedActivity.metadata = {
                    ...enrichedActivity.metadata,
                    achievement
                  };
                }
              }
              break;

            case 'user':
              if (activity.entity_id && activity.activity_type === 'user_followed') {
                const { data: followedUser } = await supabase
                  .from('users')
                  .select('id, name, email, avatar_url, reputation_score, total_followers')
                  .eq('id', activity.entity_id)
                  .single();
                
                if (followedUser) {
                  enrichedActivity.metadata = {
                    ...enrichedActivity.metadata,
                    followedUser
                  };
                }
              }
              break;
          }

          // Add interaction status for current user
          if (activity.entity_type === 'problem' && activity.entity_id) {
            const [isFavorited, hasVoted] = await Promise.all([
              socialService.isFavorited(userId, activity.entity_id),
              // Check if user has voted on this problem
              supabase
                .from('votes')
                .select('id')
                .eq('user_id', userId)
                .eq('problem_id', activity.entity_id)
                .single()
                .then(({ data }) => !!data)
            ]);

            enrichedActivity.metadata = {
              ...enrichedActivity.metadata,
              userInteractions: {
                isFavorited,
                hasVoted
              }
            };
          }

          // Add follow status if activity involves another user
          if (activity.user_id !== userId) {
            const isFollowing = await socialService.isFollowing(userId, activity.user_id);
            enrichedActivity.metadata = {
              ...enrichedActivity.metadata,
              isFollowingUser: isFollowing
            };
          }
        } catch (enrichError) {
          console.error('Error enriching activity:', enrichError);
          // Continue without enrichment if there's an error
        }

        return enrichedActivity;
      })
    );

    // Get additional feed statistics
    const stats = await getFeedStats(userId);

    const response: UserActivityFeedResponse & { stats?: any } = {
      activities: enrichedActivities,
      total,
      page,
      limit,
      hasMore,
      stats
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching activity feed:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get feed statistics for the user
 */
async function getFeedStats(userId: string) {
  try {
    const [
      { count: totalFollowing },
      { count: todayActivities },
      { count: weekActivities },
      { data: recentFollowers }
    ] = await Promise.all([
      // Total users following
      supabase
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', userId),
      
      // Activities from today
      supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .in('user_id', 
          supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', userId)
        )
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Activities from this week
      supabase
        .from('user_activities')
        .select('*', { count: 'exact' })
        .in('user_id', 
          supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', userId)
        )
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Recent followers (last 5)
      supabase
        .from('user_follows')
        .select(`
          created_at,
          follower:users!follower_id(id, name, email, avatar_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    return {
      totalFollowing: totalFollowing || 0,
      todayActivities: todayActivities || 0,
      weekActivities: weekActivities || 0,
      recentFollowers: recentFollowers || []
    };
  } catch (error) {
    console.error('Error getting feed stats:', error);
    return {
      totalFollowing: 0,
      todayActivities: 0,
      weekActivities: 0,
      recentFollowers: []
    };
  }
}