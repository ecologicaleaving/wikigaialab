/**
 * User Following API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/[id]/following - Get list of users that this user follows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserFollowingResponse } from '@wikigaialab/shared/types/social';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize social service
const socialService = new SocialService({ databaseClient: supabase });

/**
 * GET /api/users/[id]/following
 * Get list of users that this user follows with privacy controls and pagination
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, profile_visibility')
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get following list with privacy controls
    const { following, total, hasMore } = await socialService.getUserFollowing(
      targetUserId,
      page,
      limit,
      requestingUserId
    );

    // If requesting user is authenticated, add follow status for each followed user
    let enrichedFollowing = following;
    if (requestingUserId) {
      enrichedFollowing = await Promise.all(
        following.map(async (follow) => {
          const isFollowingBack = await socialService.isFollowing(
            requestingUserId,
            follow.following_id
          );
          
          const mutualFollowers = await socialService.getMutualFollowers(
            requestingUserId,
            follow.following_id
          );

          return {
            ...follow,
            isFollowingBack,
            mutualFollowers
          };
        })
      );
    }

    const response: UserFollowingResponse = {
      following: enrichedFollowing,
      total,
      page,
      limit,
      hasMore
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user following:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}