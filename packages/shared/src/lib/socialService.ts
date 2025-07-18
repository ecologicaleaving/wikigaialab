/**
 * Social Interaction Service
 * Story 4.3: User Profiles & Social Features
 * Comprehensive service for social interactions, activity tracking, and privacy
 */

import {
  UserProfile,
  UserFollow,
  UserFavorite,
  UserActivity,
  UserSocialStats,
  PrivacySettings,
  UserVisibility
} from '../types/social';

export interface SocialServiceConfig {
  databaseClient: any;
  notificationService?: any;
  realtimeClient?: any;
  achievementEngine?: any;
}

export class SocialService {
  private db: any;
  private notifications?: any;
  private realtime?: any;
  private achievementEngine?: any;

  constructor(config: SocialServiceConfig) {
    this.db = config.databaseClient;
    this.notifications = config.notificationService;
    this.realtime = config.realtimeClient;
    this.achievementEngine = config.achievementEngine;
  }

  // ============ FOLLOW SYSTEM ============

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<UserFollow | null> {
    try {
      // Prevent self-following
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if target user allows follows
      const { data: targetUser } = await this.db
        .from('users')
        .select('allow_follow, profile_visibility')
        .eq('id', followingId)
        .single();

      if (!targetUser?.allow_follow) {
        throw new Error('User does not allow followers');
      }

      // Check if already following
      const { data: existingFollow } = await this.db
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existingFollow) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      const { data: follow, error } = await this.db
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })
        .select(`
          *,
          follower:users!follower_id(id, name, email, avatar_url),
          following:users!following_id(id, name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update follower counts
      await Promise.all([
        this.db
          .from('users')
          .update({ total_following: this.db.raw('total_following + 1') })
          .eq('id', followerId),
        this.db
          .from('users')
          .update({ total_followers: this.db.raw('total_followers + 1') })
          .eq('id', followingId)
      ]);

      // Create activity records
      await Promise.all([
        this.createActivity(followerId, 'user_followed', 'user', followingId, {
          followed_user_name: follow.following?.name || follow.following?.email
        }),
        this.createActivity(followingId, 'user_followed', 'user', followerId, {
          follower_user_name: follow.follower?.name || follow.follower?.email,
          visibility: 'followers_only'
        })
      ]);

      // Send notification
      if (this.notifications) {
        await this.notifications.sendFollowNotification(followingId, followerId);
      }

      // Trigger achievement check
      if (this.achievementEngine) {
        await this.achievementEngine.checkAndAwardAchievements(followerId, 'user_followed');
        await this.achievementEngine.checkAndAwardAchievements(followingId, 'follower_gained');
      }

      // Real-time update
      if (this.realtime) {
        await this.realtime.broadcast('social_events', {
          type: 'follow',
          user_id: followerId,
          target_user_id: followingId
        });
      }

      return follow;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;

      // Update follower counts
      await Promise.all([
        this.db
          .from('users')
          .update({ total_following: this.db.raw('GREATEST(total_following - 1, 0)') })
          .eq('id', followerId),
        this.db
          .from('users')
          .update({ total_followers: this.db.raw('GREATEST(total_followers - 1, 0)') })
          .eq('id', followingId)
      ]);

      // Real-time update
      if (this.realtime) {
        await this.realtime.broadcast('social_events', {
          type: 'unfollow',
          user_id: followerId,
          target_user_id: followingId
        });
      }

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data } = await this.db
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's followers
   */
  async getUserFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20,
    requestingUserId?: string
  ): Promise<{ followers: UserFollow[]; total: number; hasMore: boolean }> {
    try {
      // Check privacy settings
      if (requestingUserId !== userId) {
        const canView = await this.canViewUserFollowers(userId, requestingUserId);
        if (!canView) {
          return { followers: [], total: 0, hasMore: false };
        }
      }

      const offset = (page - 1) * limit;

      const [{ data: followers }, { count }] = await Promise.all([
        this.db
          .from('user_follows')
          .select(`
            *,
            follower:users!follower_id(id, name, email, avatar_url, reputation_score, total_followers)
          `)
          .eq('following_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('user_follows')
          .select('*', { count: 'exact' })
          .eq('following_id', userId)
      ]);

      return {
        followers: followers || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting user followers:', error);
      return { followers: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get users that a user is following
   */
  async getUserFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20,
    requestingUserId?: string
  ): Promise<{ following: UserFollow[]; total: number; hasMore: boolean }> {
    try {
      // Check privacy settings
      if (requestingUserId !== userId) {
        const canView = await this.canViewUserFollowing(userId, requestingUserId);
        if (!canView) {
          return { following: [], total: 0, hasMore: false };
        }
      }

      const offset = (page - 1) * limit;

      const [{ data: following }, { count }] = await Promise.all([
        this.db
          .from('user_follows')
          .select(`
            *,
            following:users!following_id(id, name, email, avatar_url, reputation_score, total_followers)
          `)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('user_follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', userId)
      ]);

      return {
        following: following || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting user following:', error);
      return { following: [], total: 0, hasMore: false };
    }
  }

  // ============ FAVORITES SYSTEM ============

  /**
   * Favorite a problem
   */
  async favoriteProblem(userId: string, problemId: string): Promise<UserFavorite | null> {
    try {
      // Check if already favorited
      const { data: existing } = await this.db
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .single();

      if (existing) {
        throw new Error('Problem already favorited');
      }

      // Create favorite
      const { data: favorite, error } = await this.db
        .from('user_favorites')
        .insert({
          user_id: userId,
          problem_id: problemId
        })
        .select(`
          *,
          problem:problems(id, title, description, proposer_id, vote_count)
        `)
        .single();

      if (error) throw error;

      // Create activity
      await this.createActivity(userId, 'problem_favorited', 'problem', problemId, {
        problem_title: favorite.problem?.title
      });

      // Trigger achievement check
      if (this.achievementEngine) {
        await this.achievementEngine.checkAndAwardAchievements(userId, 'problem_favorited');
      }

      return favorite;
    } catch (error) {
      console.error('Error favoriting problem:', error);
      throw error;
    }
  }

  /**
   * Unfavorite a problem
   */
  async unfavoriteProblem(userId: string, problemId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('problem_id', problemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfavoriting problem:', error);
      throw error;
    }
  }

  /**
   * Check if user has favorited a problem
   */
  async isFavorited(userId: string, problemId: string): Promise<boolean> {
    try {
      const { data } = await this.db
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's favorite problems
   */
  async getUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 20,
    requestingUserId?: string
  ): Promise<{ favorites: UserFavorite[]; total: number; hasMore: boolean }> {
    try {
      // Check privacy settings
      if (requestingUserId !== userId) {
        const canView = await this.canViewUserActivity(userId, requestingUserId);
        if (!canView) {
          return { favorites: [], total: 0, hasMore: false };
        }
      }

      const offset = (page - 1) * limit;

      const [{ data: favorites }, { count }] = await Promise.all([
        this.db
          .from('user_favorites')
          .select(`
            *,
            problem:problems(
              id, title, description, proposer_id, vote_count, status, created_at,
              proposer:users!proposer_id(id, name, email, avatar_url)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('user_favorites')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
      ]);

      return {
        favorites: favorites || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting user favorites:', error);
      return { favorites: [], total: 0, hasMore: false };
    }
  }

  // ============ ACTIVITY SYSTEM ============

  /**
   * Create a user activity record
   */
  async createActivity(
    userId: string,
    activityType: UserActivity['activity_type'],
    entityType?: UserActivity['entity_type'],
    entityId?: string,
    metadata?: Record<string, any>,
    customVisibility?: UserVisibility
  ): Promise<UserActivity | null> {
    try {
      // Get user's default activity visibility
      const { data: user } = await this.db
        .from('users')
        .select('activity_visibility')
        .eq('id', userId)
        .single();

      const visibility = customVisibility || user?.activity_visibility || 'public';

      const { data: activity, error } = await this.db
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata || {},
          visibility
        })
        .select('*')
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  /**
   * Get user's activity feed
   */
  async getUserActivity(
    userId: string,
    page: number = 1,
    limit: number = 20,
    requestingUserId?: string
  ): Promise<{ activities: UserActivity[]; total: number; hasMore: boolean }> {
    try {
      // Check privacy settings
      if (requestingUserId !== userId) {
        const canView = await this.canViewUserActivity(userId, requestingUserId);
        if (!canView) {
          return { activities: [], total: 0, hasMore: false };
        }
      }

      const offset = (page - 1) * limit;

      // Build visibility filter
      let visibilityFilter = ['public'];
      if (requestingUserId === userId) {
        visibilityFilter = ['public', 'private', 'followers_only'];
      } else if (requestingUserId && await this.isFollowing(requestingUserId, userId)) {
        visibilityFilter = ['public', 'followers_only'];
      }

      const [{ data: activities }, { count }] = await Promise.all([
        this.db
          .from('user_activities')
          .select(`
            *,
            user:users(id, name, email, avatar_url)
          `)
          .eq('user_id', userId)
          .in('visibility', visibilityFilter)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('user_activities')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .in('visibility', visibilityFilter)
      ]);

      return {
        activities: activities || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return { activities: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get activity feed for a user (including followed users' activities)
   */
  async getActivityFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ activities: UserActivity[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;

      // Get users that this user follows (including self)
      const { data: following } = await this.db
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = [userId, ...(following?.map(f => f.following_id) || [])];

      const [{ data: activities }, { count }] = await Promise.all([
        this.db
          .from('user_activities')
          .select(`
            *,
            user:users(id, name, email, avatar_url, reputation_score)
          `)
          .in('user_id', followingIds)
          .in('visibility', ['public', 'followers_only'])
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('user_activities')
          .select('*', { count: 'exact' })
          .in('user_id', followingIds)
          .in('visibility', ['public', 'followers_only'])
      ]);

      return {
        activities: activities || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting activity feed:', error);
      return { activities: [], total: 0, hasMore: false };
    }
  }

  // ============ PRIVACY & PERMISSIONS ============

  /**
   * Check if requesting user can view target user's profile
   */
  async canViewUserProfile(targetUserId: string, requestingUserId?: string): Promise<boolean> {
    try {
      const { data: user } = await this.db
        .from('users')
        .select('profile_visibility')
        .eq('id', targetUserId)
        .single();

      if (!user) return false;

      switch (user.profile_visibility) {
        case 'public':
          return true;
        case 'private':
          return targetUserId === requestingUserId;
        case 'followers_only':
          if (!requestingUserId) return false;
          if (targetUserId === requestingUserId) return true;
          return await this.isFollowing(requestingUserId, targetUserId);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if requesting user can view target user's activity
   */
  async canViewUserActivity(targetUserId: string, requestingUserId?: string): Promise<boolean> {
    try {
      const { data: user } = await this.db
        .from('users')
        .select('activity_visibility')
        .eq('id', targetUserId)
        .single();

      if (!user) return false;

      switch (user.activity_visibility) {
        case 'public':
          return true;
        case 'private':
          return targetUserId === requestingUserId;
        case 'followers_only':
          if (!requestingUserId) return false;
          if (targetUserId === requestingUserId) return true;
          return await this.isFollowing(requestingUserId, targetUserId);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if requesting user can view target user's followers
   */
  async canViewUserFollowers(targetUserId: string, requestingUserId?: string): Promise<boolean> {
    // For now, use same logic as profile visibility
    return await this.canViewUserProfile(targetUserId, requestingUserId);
  }

  /**
   * Check if requesting user can view target user's following list
   */
  async canViewUserFollowing(targetUserId: string, requestingUserId?: string): Promise<boolean> {
    // For now, use same logic as profile visibility
    return await this.canViewUserProfile(targetUserId, requestingUserId);
  }

  // ============ STATISTICS ============

  /**
   * Get user social statistics
   */
  async getUserSocialStats(userId: string): Promise<UserSocialStats> {
    try {
      const [
        { data: user },
        { count: achievementCount },
        { count: favoriteCount },
        { count: recentActivityCount }
      ] = await Promise.all([
        this.db
          .from('users')
          .select('reputation_score, total_followers, total_following, total_votes_cast, total_problems_proposed')
          .eq('id', userId)
          .single(),
        this.db
          .from('user_achievements')
          .select('*', { count: 'exact' })
          .eq('user_id', userId),
        this.db
          .from('user_favorites')
          .select('*', { count: 'exact' })
          .eq('user_id', userId),
        this.db
          .from('user_activities')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        reputation_score: user?.reputation_score || 0,
        total_followers: user?.total_followers || 0,
        total_following: user?.total_following || 0,
        total_achievements: achievementCount || 0,
        total_favorites: favoriteCount || 0,
        total_votes_cast: user?.total_votes_cast || 0,
        total_problems_proposed: user?.total_problems_proposed || 0,
        recent_activity_count: recentActivityCount || 0
      };
    } catch (error) {
      console.error('Error getting user social stats:', error);
      return {
        reputation_score: 0,
        total_followers: 0,
        total_following: 0,
        total_achievements: 0,
        total_favorites: 0,
        total_votes_cast: 0,
        total_problems_proposed: 0,
        recent_activity_count: 0
      };
    }
  }

  /**
   * Get mutual followers between two users
   */
  async getMutualFollowers(userId1: string, userId2: string): Promise<number> {
    try {
      const { count } = await this.db
        .from('user_follows')
        .select('*', { count: 'exact' })
        .eq('following_id', userId1)
        .in(
          'follower_id',
          this.db
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', userId2)
        );

      return count || 0;
    } catch (error) {
      return 0;
    }
  }
}

// Helper functions
export function formatActivityType(activityType: UserActivity['activity_type']): string {
  const formatMap = {
    'problem_created': 'Created a problem',
    'problem_voted': 'Voted on a problem',
    'achievement_earned': 'Earned an achievement',
    'user_followed': 'Followed a user',
    'problem_favorited': 'Favorited a problem',
    'profile_updated': 'Updated profile'
  };

  return formatMap[activityType] || 'Unknown activity';
}

export function getActivityIcon(activityType: UserActivity['activity_type']): string {
  const iconMap = {
    'problem_created': 'plus-circle',
    'problem_voted': 'hand-thumb-up',
    'achievement_earned': 'trophy',
    'user_followed': 'user-plus',
    'problem_favorited': 'heart',
    'profile_updated': 'user'
  };

  return iconMap[activityType] || 'bell';
}