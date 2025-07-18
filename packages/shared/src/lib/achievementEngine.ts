/**
 * Achievement Calculation Engine
 * Story 4.3: User Profiles & Social Features
 * Automatic achievement tracking and awarding system
 */

import { 
  Achievement, 
  UserProfile, 
  UserAchievement, 
  AchievementCriteria,
  UserReputationHistory 
} from '../types/social';

export interface AchievementEngineConfig {
  databaseClient: any; // Database client interface
  notificationService?: any; // Optional notification service
  realtimeClient?: any; // Optional real-time client
}

export class AchievementEngine {
  private db: any;
  private notifications?: any;
  private realtime?: any;

  constructor(config: AchievementEngineConfig) {
    this.db = config.databaseClient;
    this.notifications = config.notificationService;
    this.realtime = config.realtimeClient;
  }

  /**
   * Check and award achievements for a user based on a specific activity
   */
  async checkAndAwardAchievements(
    userId: string, 
    activityType: string, 
    context?: Record<string, any>
  ): Promise<UserAchievement[]> {
    try {
      // Get user's current stats
      const userStats = await this.getUserStats(userId);
      
      // Get all active achievements that user hasn't earned yet
      const availableAchievements = await this.getAvailableAchievements(userId);
      
      // Check which achievements should be awarded
      const earnedAchievements: UserAchievement[] = [];
      
      for (const achievement of availableAchievements) {
        if (await this.checkAchievementCriteria(achievement, userStats, activityType, context)) {
          const userAchievement = await this.awardAchievement(userId, achievement.id, context);
          if (userAchievement) {
            earnedAchievements.push(userAchievement);
          }
        }
      }

      // Update user reputation based on earned achievements
      if (earnedAchievements.length > 0) {
        await this.updateUserReputation(userId, earnedAchievements);
      }

      return earnedAchievements;
    } catch (error) {
      console.error('Error in achievement engine:', error);
      return [];
    }
  }

  /**
   * Get user statistics for achievement checking
   */
  private async getUserStats(userId: string): Promise<any> {
    const { data: user } = await this.db
      .from('users')
      .select(`
        *,
        total_votes_cast,
        total_problems_proposed,
        total_followers,
        total_following,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    // Get additional stats
    const [
      { count: favoriteCount },
      { count: achievementCount },
      { data: recentActivities }
    ] = await Promise.all([
      this.db.from('user_favorites').select('*', { count: 'exact' }).eq('user_id', userId),
      this.db.from('user_achievements').select('*', { count: 'exact' }).eq('user_id', userId),
      this.db
        .from('user_activities')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
    ]);

    // Calculate activity streak
    const activityStreak = this.calculateActivityStreak(recentActivities);

    // Check if profile is complete
    const profileComplete = !!(user.name && user.bio && user.interests?.length > 0);

    return {
      ...user,
      favoriteCount: favoriteCount || 0,
      achievementCount: achievementCount || 0,
      activityStreak,
      profileComplete,
      joinDate: new Date(user.created_at)
    };
  }

  /**
   * Get achievements that user hasn't earned yet
   */
  private async getAvailableAchievements(userId: string): Promise<Achievement[]> {
    const { data } = await this.db
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', 
        this.db
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', userId)
      );

    return data || [];
  }

  /**
   * Check if achievement criteria is met
   */
  private async checkAchievementCriteria(
    achievement: Achievement,
    userStats: any,
    activityType: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const criteria = achievement.criteria;

    switch (criteria.type) {
      case 'vote_count':
        return userStats.total_votes_cast >= (criteria.threshold || 0);

      case 'problem_count':
        return userStats.total_problems_proposed >= (criteria.threshold || 0);

      case 'problem_votes_received':
        // Check if any of user's problems has reached vote threshold
        const { data: problems } = await this.db
          .from('problems')
          .select('vote_count')
          .eq('proposer_id', userStats.id)
          .gte('vote_count', criteria.threshold || 0)
          .limit(1);
        return problems && problems.length > 0;

      case 'following_count':
        return userStats.total_following >= (criteria.threshold || 0);

      case 'follower_count':
        return userStats.total_followers >= (criteria.threshold || 0);

      case 'join_date':
        if (criteria.before) {
          return userStats.joinDate < new Date(criteria.before);
        }
        return false;

      case 'profile_complete':
        return userStats.profileComplete;

      case 'favorite_count':
        return userStats.favoriteCount >= (criteria.threshold || 0);

      case 'activity_streak':
        return userStats.activityStreak >= (criteria.days || 0);

      default:
        return false;
    }
  }

  /**
   * Award achievement to user
   */
  private async awardAchievement(
    userId: string,
    achievementId: string,
    context?: Record<string, any>
  ): Promise<UserAchievement | null> {
    try {
      const { data, error } = await this.db
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          context: context || {}
        })
        .select(`
          *,
          achievement:achievements(*)
        `)
        .single();

      if (error) {
        console.error('Error awarding achievement:', error);
        return null;
      }

      // Create activity record
      await this.db
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'achievement_earned',
          entity_type: 'achievement',
          entity_id: achievementId,
          metadata: { achievement_name: data.achievement?.name },
          visibility: 'public'
        });

      // Send notification if service is available
      if (this.notifications) {
        await this.notifications.sendAchievementNotification(userId, data.achievement);
      }

      // Send real-time update if service is available
      if (this.realtime) {
        await this.realtime.broadcast('social_events', {
          type: 'achievement_earned',
          user_id: userId,
          data: { achievement: data.achievement }
        });
      }

      return data;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  /**
   * Update user reputation based on earned achievements
   */
  private async updateUserReputation(
    userId: string,
    earnedAchievements: UserAchievement[]
  ): Promise<void> {
    try {
      const totalPoints = earnedAchievements.reduce((sum, ua) => {
        return sum + (ua.achievement?.points || 0);
      }, 0);

      if (totalPoints > 0) {
        // Update user reputation score
        await this.db
          .from('users')
          .update({
            reputation_score: this.db.raw('reputation_score + ?', [totalPoints])
          })
          .eq('id', userId);

        // Record reputation history
        for (const ua of earnedAchievements) {
          await this.db
            .from('user_reputation_history')
            .insert({
              user_id: userId,
              points_change: ua.achievement?.points || 0,
              reason: 'achievement_earned',
              related_entity_type: 'achievement',
              related_entity_id: ua.achievement_id
            });
        }
      }
    } catch (error) {
      console.error('Error updating user reputation:', error);
    }
  }

  /**
   * Calculate activity streak in days
   */
  private calculateActivityStreak(activities: any[]): number {
    if (!activities || activities.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDates = activities.map(a => {
      const date = new Date(a.created_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);

    let streak = 0;
    let currentDate = today.getTime();

    for (const activityDate of uniqueDates) {
      if (activityDate === currentDate) {
        streak++;
        currentDate -= 24 * 60 * 60 * 1000; // Go back one day
      } else if (activityDate === currentDate - 24 * 60 * 60 * 1000) {
        streak++;
        currentDate = activityDate - 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Manual achievement check for all users (for maintenance)
   */
  async recheckAllUserAchievements(): Promise<void> {
    try {
      const { data: users } = await this.db
        .from('users')
        .select('id');

      for (const user of users || []) {
        await this.checkAndAwardAchievements(user.id, 'manual_recheck');
      }
    } catch (error) {
      console.error('Error rechecking achievements:', error);
    }
  }

  /**
   * Get user achievement progress for UI display
   */
  async getUserAchievementProgress(userId: string): Promise<any> {
    try {
      const [userStats, allAchievements, userAchievements] = await Promise.all([
        this.getUserStats(userId),
        this.db.from('achievements').select('*').eq('is_active', true),
        this.db
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })
      ]);

      const earnedAchievementIds = new Set(
        userAchievements.data?.map((ua: any) => ua.achievement_id) || []
      );

      const progressData = allAchievements.data?.map((achievement: any) => {
        const isEarned = earnedAchievementIds.has(achievement.id);
        const earnedData = userAchievements.data?.find((ua: any) => ua.achievement_id === achievement.id);

        let progress = 0;
        if (!isEarned) {
          progress = this.calculateProgress(achievement, userStats);
        }

        return {
          achievement,
          isEarned,
          earnedAt: earnedData?.earned_at,
          progress: isEarned ? 100 : progress
        };
      });

      return {
        achievements: progressData || [],
        totalEarned: userAchievements.data?.length || 0,
        totalPoints: userAchievements.data?.reduce((sum: number, ua: any) => sum + (ua.achievement?.points || 0), 0) || 0,
        recentAchievements: userAchievements.data?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return {
        achievements: [],
        totalEarned: 0,
        totalPoints: 0,
        recentAchievements: []
      };
    }
  }

  /**
   * Calculate progress towards an achievement (0-100)
   */
  private calculateProgress(achievement: Achievement, userStats: any): number {
    const criteria = achievement.criteria;

    switch (criteria.type) {
      case 'vote_count':
        return Math.min(100, (userStats.total_votes_cast / (criteria.threshold || 1)) * 100);
      case 'problem_count':
        return Math.min(100, (userStats.total_problems_proposed / (criteria.threshold || 1)) * 100);
      case 'following_count':
        return Math.min(100, (userStats.total_following / (criteria.threshold || 1)) * 100);
      case 'follower_count':
        return Math.min(100, (userStats.total_followers / (criteria.threshold || 1)) * 100);
      case 'favorite_count':
        return Math.min(100, (userStats.favoriteCount / (criteria.threshold || 1)) * 100);
      case 'activity_streak':
        return Math.min(100, (userStats.activityStreak / (criteria.days || 1)) * 100);
      case 'profile_complete':
        return userStats.profileComplete ? 100 : 0;
      default:
        return 0;
    }
  }
}

/**
 * Activity type mapping for achievement triggers
 */
export const ACHIEVEMENT_TRIGGERS = {
  VOTE_CAST: 'vote_cast',
  PROBLEM_CREATED: 'problem_created',
  PROBLEM_VOTED: 'problem_voted',
  USER_FOLLOWED: 'user_followed',
  PROBLEM_FAVORITED: 'problem_favorited',
  PROFILE_UPDATED: 'profile_updated',
  DAILY_LOGIN: 'daily_login'
} as const;

/**
 * Helper function to trigger achievement check
 */
export async function triggerAchievementCheck(
  engine: AchievementEngine,
  userId: string,
  activityType: string,
  context?: Record<string, any>
): Promise<UserAchievement[]> {
  return await engine.checkAndAwardAchievements(userId, activityType, context);
}