/**
 * User Follow API Endpoint
 * Story 4.3: User Profiles & Social Features
 * POST /api/users/[id]/follow - Follow a user
 * DELETE /api/users/[id]/follow - Unfollow a user
 * GET /api/users/[id]/follow - Check follow status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '../../../../../../../packages/shared/src/lib/socialService';
import { AchievementEngine } from '../../../../../../../packages/shared/src/lib/achievementEngine';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize services
const socialService = new SocialService({ databaseClient: supabase });
const achievementEngine = new AchievementEngine({ databaseClient: supabase });

/**
 * Helper function to authenticate user
 */
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}

/**
 * POST /api/users/[id]/follow
 * Follow a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const followerId = authUser.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Follow the user
    const follow = await socialService.followUser(followerId, targetUserId);
    
    if (!follow) {
      return NextResponse.json(
        { error: 'Failed to follow user' },
        { status: 500 }
      );
    }

    // Trigger achievement checks
    await Promise.all([
      achievementEngine.checkAndAwardAchievements(followerId, 'user_followed'),
      achievementEngine.checkAndAwardAchievements(targetUserId, 'follower_gained')
    ]);

    return NextResponse.json({
      message: 'Successfully followed user',
      follow,
      isFollowing: true
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error following user:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error.message === 'Cannot follow yourself' || 
        error.message === 'User does not allow followers' ||
        error.message === 'Already following this user') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/follow
 * Unfollow a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const followerId = authUser.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Unfollow the user
    const success = await socialService.unfollowUser(followerId, targetUserId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unfollow user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully unfollowed user',
      isFollowing: false
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    
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
 * GET /api/users/[id]/follow
 * Check if current user is following the target user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const followerId = authUser.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check follow status
    const isFollowing = await socialService.isFollowing(followerId, targetUserId);
    
    // Get mutual followers count
    const mutualFollowers = await socialService.getMutualFollowers(followerId, targetUserId);

    return NextResponse.json({
      isFollowing,
      mutualFollowers,
      followerId,
      targetUserId
    });
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    
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