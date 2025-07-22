/**
 * User Search API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/search - Search and discover users with filters and suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserSearchResponse } from '@wikigaialab/shared/types/social';

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
 * GET /api/users/search
 * Search users with various filters and criteria
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    
    // Get query parameters
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category'); // Filter by interest category
    const minReputation = parseInt(url.searchParams.get('min_reputation') || '0');
    const hasAchievements = url.searchParams.get('has_achievements') === 'true';
    const isActive = url.searchParams.get('is_active') === 'true'; // Active in last 30 days
    const location = url.searchParams.get('location');
    const sortBy = url.searchParams.get('sort_by') || 'relevance'; // relevance, reputation, followers, recent
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const requestingUserId = url.searchParams.get('requesting_user_id');

    const offset = (page - 1) * limit;

    // Build base query
    let queryBuilder = getSupabaseClient()
      .from('users')
      .select(`
        id, name, email, avatar_url, bio, interests, location,
        reputation_score, total_followers, total_following,
        total_problems_proposed, total_votes_cast,
        created_at, last_login_at, profile_visibility
      `);

    // Apply privacy filter - only show public profiles or those visible to requesting user
    if (requestingUserId) {
      // Complex privacy logic would go here
      // For now, we'll show public and followers_only profiles
      queryBuilder = queryBuilder.in('profile_visibility', ['public', 'followers_only']);
    } else {
      // Only public profiles for non-authenticated users
      queryBuilder = queryBuilder.eq('profile_visibility', 'public');
    }

    // Apply text search filter
    if (query.trim()) {
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
      );
    }

    // Apply location filter
    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`);
    }

    // Apply reputation filter
    if (minReputation > 0) {
      queryBuilder = queryBuilder.gte('reputation_score', minReputation);
    }

    // Apply activity filter (active in last 30 days)
    if (isActive) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      queryBuilder = queryBuilder.gte('last_login_at', thirtyDaysAgo);
    }

    // Apply category filter (interests)
    if (category) {
      queryBuilder = queryBuilder.contains('interests', [category]);
    }

    // Apply sorting
    switch (sortBy) {
      case 'reputation':
        queryBuilder = queryBuilder.order('reputation_score', { ascending: false });
        break;
      case 'followers':
        queryBuilder = queryBuilder.order('total_followers', { ascending: false });
        break;
      case 'recent':
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      default: // relevance
        if (query.trim()) {
          // Sort by reputation for text searches (simple relevance)
          queryBuilder = queryBuilder.order('reputation_score', { ascending: false });
        } else {
          // Default to reputation when no search query
          queryBuilder = queryBuilder.order('reputation_score', { ascending: false });
        }
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('profile_visibility', 'public');

    // Apply same filters to count query
    if (query.trim()) {
      const searchTerm = query.trim();
      countQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
    }
    if (location) countQuery.ilike('location', `%${location}%`);
    if (minReputation > 0) countQuery.gte('reputation_score', minReputation);
    if (isActive) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      countQuery.gte('last_login_at', thirtyDaysAgo);
    }
    if (category) countQuery.contains('interests', [category]);

    // Execute queries
    const [{ data: users, error }, { count }] = await Promise.all([
      queryBuilder.range(offset, offset + limit - 1),
      countQuery
    ]);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    // Filter users that have achievements if requested
    let filteredUsers = users || [];
    if (hasAchievements) {
      const userIds = filteredUsers.map(u => u.id);
      const { data: usersWithAchievements } = await supabase
        .from('user_achievements')
        .select('user_id')
        .in('user_id', userIds);

      const userIdsWithAchievements = new Set(
        usersWithAchievements?.map(ua => ua.user_id) || []
      );

      filteredUsers = filteredUsers.filter(user => 
        userIdsWithAchievements.has(user.id)
      );
    }

    // Enrich with social data if requesting user is provided
    const enrichedUsers = await Promise.all(
      filteredUsers.map(async (user) => {
        let isFollowing = false;
        let mutualFollowers = 0;

        if (requestingUserId && requestingUserId !== user.id) {
          [isFollowing, mutualFollowers] = await Promise.all([
            socialService.isFollowing(requestingUserId, user.id),
            socialService.getMutualFollowers(requestingUserId, user.id)
          ]);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          reputation_score: user.reputation_score,
          total_followers: user.total_followers,
          isFollowing,
          mutualFollowers
        };
      })
    );

    const response: UserSearchResponse = {
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in user search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/search/suggestions
 * Get personalized user suggestions based on user's interests and activity
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, limit = 10 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's profile and interests
    const { data: currentUser } = await supabase
      .from('users')
      .select('interests, reputation_score, total_followers')
      .eq('id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get users that current user is already following
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];
    const excludeIds = [...followingIds, userId]; // Exclude self and already followed users

    const suggestions: any[] = [];

    // Strategy 1: Users with similar interests (40% of results)
    if (currentUser.interests && currentUser.interests.length > 0) {
      const { data: similarInterestUsers } = await supabase
        .from('users')
        .select(`
          id, name, email, avatar_url, bio, interests,
          reputation_score, total_followers
        `)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .eq('profile_visibility', 'public')
        .overlaps('interests', currentUser.interests)
        .order('reputation_score', { ascending: false })
        .limit(Math.ceil(limit * 0.4));

      suggestions.push(...(similarInterestUsers || []));
    }

    // Strategy 2: Mutual connections (people followed by people you follow) (30% of results)
    if (followingIds.length > 0) {
      const { data: mutualConnections } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          following:users!following_id(
            id, name, email, avatar_url, bio,
            reputation_score, total_followers
          )
        `)
        .in('follower_id', followingIds)
        .not('following_id', 'in', `(${excludeIds.join(',')})`)
        .limit(Math.ceil(limit * 0.3));

      const mutualUsers = mutualConnections?.map(mc => mc.following).filter(Boolean) || [];
      suggestions.push(...mutualUsers);
    }

    // Strategy 3: High reputation users in similar activity range (20% of results)
    const reputationRange = {
      min: Math.max(0, currentUser.reputation_score - 500),
      max: currentUser.reputation_score + 1000
    };

    const { data: similarReputationUsers } = await supabase
      .from('users')
      .select(`
        id, name, email, avatar_url, bio,
        reputation_score, total_followers
      `)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .eq('profile_visibility', 'public')
      .gte('reputation_score', reputationRange.min)
      .lte('reputation_score', reputationRange.max)
      .order('total_followers', { ascending: false })
      .limit(Math.ceil(limit * 0.2));

    suggestions.push(...(similarReputationUsers || []));

    // Strategy 4: Recently active users (10% of results)
    const recentlyActive = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabase
      .from('users')
      .select(`
        id, name, email, avatar_url, bio,
        reputation_score, total_followers
      `)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .eq('profile_visibility', 'public')
      .gte('last_login_at', recentlyActive)
      .order('last_login_at', { ascending: false })
      .limit(Math.ceil(limit * 0.1));

    suggestions.push(...(activeUsers || []));

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.reduce((acc, user) => {
      if (!acc.some(existing => existing.id === user.id)) {
        acc.push(user);
      }
      return acc;
    }, [] as any[]);

    // Limit to requested amount
    const limitedSuggestions = uniqueSuggestions.slice(0, limit);

    // Enrich with mutual follower data
    const enrichedSuggestions = await Promise.all(
      limitedSuggestions.map(async (user) => {
        const mutualFollowers = await socialService.getMutualFollowers(userId, user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          reputation_score: user.reputation_score,
          total_followers: user.total_followers,
          isFollowing: false, // By definition, these are not followed yet
          mutualFollowers
        };
      })
    );

    return NextResponse.json({
      suggestions: enrichedSuggestions
    });
  } catch (error) {
    console.error('Error generating user suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}