/**
 * User Profile API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/[id] - Get comprehensive user profile data
 * PUT /api/users/[id] - Update user profile (own profile only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserProfile, UserProfileUpdateData, UserProfileResponse } from '@wikigaialab/shared/types/social';

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
 * GET /api/users/[id]
 * Get user profile with social data and privacy-aware information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    const url = new URL(request.url);
    const requestingUserId = url.searchParams.get('requesting_user_id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if requesting user can view this profile
    const socialService = getSocialService();
    if (requestingUserId && !await socialService.canViewUserProfile(targetUserId, requestingUserId)) {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      );
    }

    // Get user profile data
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select(`
        id, email, name, avatar_url, bio, interests, website_url, location,
        github_username, twitter_username, linkedin_username,
        profile_visibility, activity_visibility, email_visibility, allow_follow,
        reputation_score, total_followers, total_following, auth_provider,
        created_at, last_login_at, total_votes_cast, total_problems_proposed,
        is_admin, subscription_status, updated_at
      `)
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check privacy settings for sensitive data
    const isOwnProfile = requestingUserId === targetUserId;
    const canViewEmail = isOwnProfile || user.email_visibility === 'public' || 
      (user.email_visibility === 'followers_only' && requestingUserId && 
       await socialService.isFollowing(requestingUserId, targetUserId));

    // Filter sensitive information based on privacy settings
    const filteredUser: UserProfile = {
      ...user,
      email: canViewEmail ? user.email : '',
      // Always show basic profile info if profile is viewable
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      interests: user.interests || [],
      website_url: user.website_url,
      location: user.location,
      github_username: user.github_username,
      twitter_username: user.twitter_username,
      linkedin_username: user.linkedin_username,
      reputation_score: user.reputation_score,
      total_followers: user.total_followers,
      total_following: user.total_following,
      created_at: user.created_at,
      total_votes_cast: user.total_votes_cast,
      total_problems_proposed: user.total_problems_proposed,
      // Hide admin status and subscription for non-own profiles
      is_admin: isOwnProfile ? user.is_admin : false,
      subscription_status: isOwnProfile ? user.subscription_status : 'free',
      // Privacy settings only visible to owner
      profile_visibility: isOwnProfile ? user.profile_visibility : 'public',
      activity_visibility: isOwnProfile ? user.activity_visibility : 'public',
      email_visibility: isOwnProfile ? user.email_visibility : 'private',
      allow_follow: user.allow_follow,
      auth_provider: isOwnProfile ? user.auth_provider : '',
      last_login_at: isOwnProfile ? user.last_login_at : user.created_at,
      updated_at: user.updated_at
    };

    // Get additional social data
    let isFollowing = false;
    let mutualFollowers = 0;

    if (requestingUserId && requestingUserId !== targetUserId) {
      [isFollowing, mutualFollowers] = await Promise.all([
        socialService.isFollowing(requestingUserId, targetUserId),
        socialService.getMutualFollowers(requestingUserId, targetUserId)
      ]);
    }

    const response: UserProfileResponse = {
      user: filteredUser,
      isOwnProfile,
      isFollowing,
      mutualFollowers
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update user profile (authenticated user can only update their own profile)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    
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
    const { data: { user: authUser }, error: authError } = await getSupabaseClient().auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is updating their own profile
    if (authUser.id !== targetUserId) {
      return NextResponse.json(
        { error: 'Can only update your own profile' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const updateData: UserProfileUpdateData = await request.json();

    // Validate required fields and constraints
    if (updateData.name && (updateData.name.length < 2 || updateData.name.length > 100)) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    if (updateData.bio && updateData.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be less than 500 characters' },
        { status: 400 }
      );
    }

    if (updateData.location && updateData.location.length > 100) {
      return NextResponse.json(
        { error: 'Location must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (updateData.interests && updateData.interests.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 interests allowed' },
        { status: 400 }
      );
    }

    // Validate URL formats
    const urlFields = ['avatar_url', 'website_url'];
    for (const field of urlFields) {
      const value = updateData[field as keyof UserProfileUpdateData] as string;
      if (value && value.trim()) {
        try {
          new URL(value);
        } catch {
          return NextResponse.json(
            { error: `Invalid ${field.replace('_', ' ')} format` },
            { status: 400 }
          );
        }
      }
    }

    // Validate privacy settings
    const validVisibilities = ['public', 'private', 'followers_only'];
    if (updateData.profile_visibility && !validVisibilities.includes(updateData.profile_visibility)) {
      return NextResponse.json(
        { error: 'Invalid profile visibility setting' },
        { status: 400 }
      );
    }

    if (updateData.activity_visibility && !validVisibilities.includes(updateData.activity_visibility)) {
      return NextResponse.json(
        { error: 'Invalid activity visibility setting' },
        { status: 400 }
      );
    }

    if (updateData.email_visibility && !validVisibilities.includes(updateData.email_visibility)) {
      return NextResponse.json(
        { error: 'Invalid email visibility setting' },
        { status: 400 }
      );
    }

    // Build update object (only include provided fields)
    const updateFields: Partial<UserProfile> = {
      updated_at: new Date().toISOString()
    };

    // Add provided fields to update
    const allowedFields = [
      'name', 'avatar_url', 'bio', 'interests', 'website_url', 'location',
      'github_username', 'twitter_username', 'linkedin_username',
      'profile_visibility', 'activity_visibility', 'email_visibility', 'allow_follow'
    ];

    for (const field of allowedFields) {
      if (updateData[field as keyof UserProfileUpdateData] !== undefined) {
        updateFields[field as keyof UserProfile] = updateData[field as keyof UserProfileUpdateData] as any;
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await getSupabaseClient()
      .from('users')
      .update(updateFields)
      .eq('id', targetUserId)
      .select(`
        id, email, name, avatar_url, bio, interests, website_url, location,
        github_username, twitter_username, linkedin_username,
        profile_visibility, activity_visibility, email_visibility, allow_follow,
        reputation_score, total_followers, total_following, auth_provider,
        created_at, last_login_at, total_votes_cast, total_problems_proposed,
        is_admin, subscription_status, updated_at
      `)
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Create activity record for profile update
    const socialService = getSocialService();
    await socialService.createActivity(
      targetUserId,
      'profile_updated',
      'user',
      targetUserId,
      { updated_fields: Object.keys(updateFields) }
    );

    // Return updated profile
    const response: UserProfileResponse = {
      user: updatedUser,
      isOwnProfile: true,
      isFollowing: false,
      mutualFollowers: 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}