/**
 * Social Notifications Service
 * Story 4.3: User Profiles & Social Features
 * Integration with existing notification system for social actions
 */

import { UserProfile, Achievement, UserActivity } from '../types/social';

export interface SocialNotificationConfig {
  databaseClient: any;
  notificationService?: any; // Existing notification service
  realtimeClient?: any;
}

export interface SocialNotification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: SocialNotificationType;
  title: string;
  message: string;
  action_url?: string;
  metadata?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export type SocialNotificationType = 
  | 'follow'
  | 'unfollow'
  | 'achievement_earned'
  | 'problem_favorited'
  | 'reputation_milestone'
  | 'profile_viewed'
  | 'mention'
  | 'activity_milestone';

export class SocialNotificationService {
  private db: any;
  private notifications?: any;
  private realtime?: any;

  constructor(config: SocialNotificationConfig) {
    this.db = config.databaseClient;
    this.notifications = config.notificationService;
    this.realtime = config.realtimeClient;
  }

  /**
   * Send follow notification
   */
  async sendFollowNotification(
    followerId: string,
    followingId: string
  ): Promise<void> {
    try {
      // Get follower info
      const { data: follower } = await this.db
        .from('users')
        .select('name, email, avatar_url')
        .eq('id', followerId)
        .single();

      if (!follower) return;

      const followerName = follower.name || follower.email.split('@')[0];

      await this.createNotification({
        recipient_id: followingId,
        sender_id: followerId,
        type: 'follow',
        title: 'Nuovo follower!',
        message: `${followerName} ha iniziato a seguirti`,
        action_url: `/users/${followerId}`,
        metadata: {
          follower_name: followerName,
          follower_avatar: follower.avatar_url
        }
      });
    } catch (error) {
      console.error('Error sending follow notification:', error);
    }
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    try {
      await this.createNotification({
        recipient_id: userId,
        sender_id: userId, // Self-notification
        type: 'achievement_earned',
        title: 'Achievement ottenuto!',
        message: `Hai ottenuto l'achievement "${achievement.name}" (+${achievement.points} punti)`,
        action_url: `/users/${userId}?tab=achievements`,
        metadata: {
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          points: achievement.points,
          category: achievement.category
        }
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  /**
   * Send problem favorited notification
   */
  async sendProblemFavoritedNotification(
    userId: string,
    problemId: string,
    problemTitle: string,
    problemOwnerId: string
  ): Promise<void> {
    try {
      // Don't notify if user favorited their own problem
      if (userId === problemOwnerId) return;

      // Get user info
      const { data: user } = await this.db
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

      if (!user) return;

      const userName = user.name || user.email.split('@')[0];

      await this.createNotification({
        recipient_id: problemOwnerId,
        sender_id: userId,
        type: 'problem_favorited',
        title: 'Problema aggiunto ai preferiti',
        message: `${userName} ha aggiunto il tuo problema "${problemTitle}" ai preferiti`,
        action_url: `/problems/${problemId}`,
        metadata: {
          problem_id: problemId,
          problem_title: problemTitle,
          user_name: userName
        }
      });
    } catch (error) {
      console.error('Error sending problem favorited notification:', error);
    }
  }

  /**
   * Send reputation milestone notification
   */
  async sendReputationMilestoneNotification(
    userId: string,
    newScore: number,
    milestone: string
  ): Promise<void> {
    try {
      const milestones: Record<string, string> = {
        '100': 'Hai raggiunto 100 punti reputazione! 🌟',
        '500': 'Fantastico! 500 punti reputazione! 🚀',
        '1000': 'Incredibile! 1000 punti reputazione! 🏆',
        '2500': 'Sei un veterano! 2500 punti reputazione! 💎',
        '5000': 'Leggenda della comunità! 5000 punti! 👑',
        '10000': 'Maestro supremo! 10000 punti reputazione! ⭐'
      };

      const message = milestones[milestone] || 
        `Hai raggiunto ${newScore} punti reputazione!`;

      await this.createNotification({
        recipient_id: userId,
        sender_id: userId,
        type: 'reputation_milestone',
        title: 'Traguardo reputazione!',
        message,
        action_url: `/users/${userId}`,
        metadata: {
          score: newScore,
          milestone
        }
      });
    } catch (error) {
      console.error('Error sending reputation milestone notification:', error);
    }
  }

  /**
   * Send activity milestone notification
   */
  async sendActivityMilestoneNotification(
    userId: string,
    milestoneType: 'problems_created' | 'votes_cast' | 'achievements_earned',
    count: number
  ): Promise<void> {
    try {
      const messages = {
        problems_created: {
          5: 'Hai creato 5 problemi! Continua così! 💡',
          10: 'Wow! 10 problemi creati! Sei un vero innovatore! 🚀',
          25: 'Incredibile! 25 problemi creati! 🌟',
          50: 'Maestro dei problemi! 50 problemi creati! 🏆'
        },
        votes_cast: {
          10: 'Hai espresso 10 voti! Grazie per la partecipazione! 🗳️',
          50: 'Cittadino attivo! 50 voti espressi! 👥',
          100: 'Campione della democrazia! 100 voti! 🏛️',
          500: 'Pilastro della comunità! 500 voti! 💎'
        },
        achievements_earned: {
          5: 'Hai ottenuto 5 achievement! Fantastico! 🏅',
          10: 'Collezionista di achievement! 10 ottenuti! 🏆',
          20: 'Maestro degli achievement! 20 ottenuti! 👑'
        }
      };

      const typeMessages = messages[milestoneType];
      const message = typeMessages?.[count as keyof typeof typeMessages];

      if (!message) return;

      const titles = {
        problems_created: 'Traguardo Problemi!',
        votes_cast: 'Traguardo Votazioni!',
        achievements_earned: 'Traguardo Achievement!'
      };

      await this.createNotification({
        recipient_id: userId,
        sender_id: userId,
        type: 'activity_milestone',
        title: titles[milestoneType],
        message,
        action_url: `/users/${userId}`,
        metadata: {
          milestone_type: milestoneType,
          count
        }
      });
    } catch (error) {
      console.error('Error sending activity milestone notification:', error);
    }
  }

  /**
   * Create notification in database and send via existing system
   */
  private async createNotification(notificationData: Omit<SocialNotification, 'id' | 'read' | 'created_at'>): Promise<void> {
    try {
      // Create notification in database
      const { data: notification, error } = await this.db
        .from('notifications')
        .insert({
          ...notificationData,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return;
      }

      // Send via existing notification service if available
      if (this.notifications) {
        try {
          await this.notifications.send({
            userId: notificationData.recipient_id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            data: {
              action_url: notificationData.action_url,
              metadata: notificationData.metadata
            }
          });
        } catch (error) {
          console.error('Error sending notification via service:', error);
        }
      }

      // Send real-time notification if available
      if (this.realtime) {
        try {
          await this.realtime.broadcast('notifications', {
            type: 'new_notification',
            user_id: notificationData.recipient_id,
            notification
          });
        } catch (error) {
          console.error('Error sending real-time notification:', error);
        }
      }
    } catch (error) {
      console.error('Error in createNotification:', error);
    }
  }

  /**
   * Get social notifications for a user
   */
  async getSocialNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: SocialNotification[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = this.db
        .from('notifications')
        .select(`
          *,
          sender:users!sender_id(id, name, email, avatar_url)
        `)
        .eq('recipient_id', userId)
        .in('type', ['follow', 'achievement_earned', 'problem_favorited', 'reputation_milestone', 'activity_milestone']);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const [{ data: notifications }, { count }] = await Promise.all([
        query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        this.db
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('recipient_id', userId)
          .in('type', ['follow', 'achievement_earned', 'problem_favorited', 'reputation_milestone', 'activity_milestone'])
          .then((result: any) => ({ count: result.count }))
      ]);

      return {
        notifications: notifications || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error getting social notifications:', error);
      return {
        notifications: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all social notifications as read
   */
  async markAllSocialNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', userId)
        .eq('read', false)
        .in('type', ['follow', 'achievement_earned', 'problem_favorited', 'reputation_milestone', 'activity_milestone']);

      return !error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count } = await this.db
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('read', false)
        .in('type', ['follow', 'achievement_earned', 'problem_favorited', 'reputation_milestone', 'activity_milestone']);

      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Batch notification processing for milestone checks
   */
  async checkAndSendMilestoneNotifications(userId: string): Promise<void> {
    try {
      // Get user stats
      const { data: user } = await this.db
        .from('users')
        .select('total_problems_proposed, total_votes_cast, reputation_score')
        .eq('id', userId)
        .single();

      if (!user) return;

      // Get achievement count
      const { count: achievementCount } = await this.db
        .from('user_achievements')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Check milestones
      const milestones = [
        { type: 'problems_created' as const, count: user.total_problems_proposed, thresholds: [5, 10, 25, 50] },
        { type: 'votes_cast' as const, count: user.total_votes_cast, thresholds: [10, 50, 100, 500] },
        { type: 'achievements_earned' as const, count: achievementCount || 0, thresholds: [5, 10, 20] }
      ];

      // Check reputation milestones
      const reputationMilestones = [100, 500, 1000, 2500, 5000, 10000];
      for (const milestone of reputationMilestones) {
        if (user.reputation_score >= milestone) {
          // Check if we haven't sent this milestone notification before
          const { data: existingNotification } = await this.db
            .from('notifications')
            .select('id')
            .eq('recipient_id', userId)
            .eq('type', 'reputation_milestone')
            .contains('metadata', { milestone: milestone.toString() })
            .single();

          if (!existingNotification) {
            await this.sendReputationMilestoneNotification(userId, user.reputation_score, milestone.toString());
          }
        }
      }

      // Check activity milestones
      for (const milestone of milestones) {
        for (const threshold of milestone.thresholds) {
          if (milestone.count >= threshold) {
            // Check if we haven't sent this milestone notification before
            const { data: existingNotification } = await this.db
              .from('notifications')
              .select('id')
              .eq('recipient_id', userId)
              .eq('type', 'activity_milestone')
              .contains('metadata', { milestone_type: milestone.type, count: threshold })
              .single();

            if (!existingNotification) {
              await this.sendActivityMilestoneNotification(userId, milestone.type, threshold);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking milestone notifications:', error);
    }
  }
}

/**
 * Helper function to format notification time
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const notificationTime = new Date(createdAt);
  const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Ora';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min fa`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h fa`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}g fa`;
  } else {
    return notificationTime.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short'
    });
  }
}

/**
 * Helper function to get notification icon
 */
export function getNotificationIcon(type: SocialNotificationType): string {
  const icons = {
    follow: '👥',
    unfollow: '👋',
    achievement_earned: '🏆',
    problem_favorited: '❤️',
    reputation_milestone: '⭐',
    profile_viewed: '👁️',
    mention: '💬',
    activity_milestone: '🎯'
  };

  return icons[type] || '🔔';
}

/**
 * Helper function to get notification color
 */
export function getNotificationColor(type: SocialNotificationType): string {
  const colors = {
    follow: 'text-blue-600',
    unfollow: 'text-gray-600',
    achievement_earned: 'text-yellow-600',
    problem_favorited: 'text-red-600',
    reputation_milestone: 'text-purple-600',
    profile_viewed: 'text-gray-600',
    mention: 'text-green-600',
    activity_milestone: 'text-blue-600'
  };

  return colors[type] || 'text-gray-600';
}