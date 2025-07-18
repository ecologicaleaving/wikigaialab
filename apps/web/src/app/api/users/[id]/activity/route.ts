/**
 * User Activity API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/[id]/activity - Get user's activity feed with privacy controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserActivityFeedResponse } from '@wikigaialab/shared/types/social';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize social service
const socialService = new SocialService({ databaseClient: supabase });

/**
 * GET /api/users/[id]/activity
 * Get user's activity feed with privacy controls and pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    const url = new URL(request.url);
    
    // Get query parameters
    const requestingUserId = url.searchParams.get('requesting_user_id');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const activityType = url.searchParams.get('activity_type');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if requesting user can view this user's activity
    const canViewActivity = await socialService.canViewUserActivity(targetUserId, requestingUserId);
    if (!canViewActivity) {
      return NextResponse.json(
        { error: 'Activity feed is private' },
        { status: 403 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, activity_visibility')
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user activity with privacy filtering
    const { activities, total, hasMore } = await socialService.getUserActivity(
      targetUserId,
      page,
      limit,
      requestingUserId
    );

    // Filter by activity type if specified
    let filteredActivities = activities;
    if (activityType) {
      filteredActivities = activities.filter(activity => activity.activity_type === activityType);
    }

    // Enrich activities with additional context data
    const enrichedActivities = await Promise.all(
      filteredActivities.map(async (activity) => {
        const enrichedActivity = { ...activity };

        // Add related entity data based on type
        try {
          switch (activity.entity_type) {
            case 'problem':
              if (activity.entity_id) {
                const { data: problem } = await supabase
                  .from('problems')
                  .select(`
                    id, title, description, status, vote_count, created_at,
                    proposer:users!proposer_id(id, name, email, avatar_url)
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
                  .select('id, name, email, avatar_url, reputation_score')
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
        } catch (enrichError) {
          console.error('Error enriching activity:', enrichError);
          // Continue without enrichment if there's an error
        }

        return enrichedActivity;
      })
    );

    const response: UserActivityFeedResponse = {
      activities: enrichedActivities,
      total,
      page,
      limit,
      hasMore
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/activity
 * Create a new activity record (for manual activity creation if needed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: userId } = params;
    
    // Get requesting user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate JWT token and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is creating activity for themselves or is admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (authUser.id !== userId && !userInfo?.is_admin) {
      return NextResponse.json(
        { error: 'Can only create activities for yourself' },
        { status: 403 }
      );
    }

    // Parse request body
    const {
      activity_type,
      entity_type,
      entity_id,
      metadata,
      visibility
    } = await request.json();

    // Validate activity type
    const validActivityTypes = [
      'problem_created', 'problem_voted', 'achievement_earned',
      'user_followed', 'problem_favorited', 'profile_updated'
    ];

    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Validate visibility
    const validVisibilities = ['public', 'private', 'followers_only'];
    if (visibility && !validVisibilities.includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility setting' },
        { status: 400 }
      );
    }

    // Create activity
    const activity = await socialService.createActivity(
      userId,
      activity_type,
      entity_type,
      entity_id,
      metadata,
      visibility
    );

    if (!activity) {
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}