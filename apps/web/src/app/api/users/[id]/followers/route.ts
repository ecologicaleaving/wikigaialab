/**
 * User Followers API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/[id]/followers - Get user's followers list
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserFollowersResponse } from '@wikigaialab/shared/types/social';

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
 * GET /api/users/[id]/followers
 * Get user's followers with privacy controls and pagination
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
    const { data: user, error: userError } = await getSupabaseClient()
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

    // Get followers with privacy controls
    const { followers, total, hasMore } = await socialService.getUserFollowers(
      targetUserId,
      page,
      limit,
      requestingUserId
    );

    // If requesting user is authenticated, add follow status for each follower
    let enrichedFollowers = followers;
    if (requestingUserId) {
      enrichedFollowers = await Promise.all(
        followers.map(async (follow) => {
          const isFollowingBack = await socialService.isFollowing(
            requestingUserId,
            follow.follower_id
          );
          
          const mutualFollowers = await socialService.getMutualFollowers(
            requestingUserId,
            follow.follower_id
          );

          return {
            ...follow,
            isFollowingBack,
            mutualFollowers
          };
        })
      );
    }

    const response: UserFollowersResponse = {
      followers: enrichedFollowers,
      total,
      page,
      limit,
      hasMore
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user followers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}