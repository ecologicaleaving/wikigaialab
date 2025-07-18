/**
 * Social Features Type Definitions
 * Story 4.3: User Profiles & Social Features
 * Comprehensive types for user profiles, achievements, and social interactions
 */

// Enhanced User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  interests?: string[];
  website_url?: string;
  location?: string;
  github_username?: string;
  twitter_username?: string;
  linkedin_username?: string;
  profile_visibility: 'public' | 'private' | 'followers_only';
  activity_visibility: 'public' | 'private' | 'followers_only';
  email_visibility: 'public' | 'private' | 'followers_only';
  allow_follow: boolean;
  reputation_score: number;
  total_followers: number;
  total_following: number;
  auth_provider: string;
  created_at: string;
  last_login_at: string;
  total_votes_cast: number;
  total_problems_proposed: number;
  is_admin: boolean;
  subscription_status: 'free' | 'active' | 'cancelled' | 'trialing';
  updated_at: string;
}

// Privacy Settings
export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'followers_only';
  activity_visibility: 'public' | 'private' | 'followers_only';
  email_visibility: 'public' | 'private' | 'followers_only';
  allow_follow: boolean;
}

// User Profile Update Data
export interface UserProfileUpdateData {
  name?: string;
  avatar_url?: string;
  bio?: string;
  interests?: string[];
  website_url?: string;
  location?: string;
  github_username?: string;
  twitter_username?: string;
  linkedin_username?: string;
  profile_visibility?: 'public' | 'private' | 'followers_only';
  activity_visibility?: 'public' | 'private' | 'followers_only';
  email_visibility?: 'public' | 'private' | 'followers_only';
  allow_follow?: boolean;
}

// Achievement System Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'voting' | 'problems' | 'community' | 'engagement' | 'special';
  points: number;
  criteria: AchievementCriteria;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AchievementCriteria {
  type: 'vote_count' | 'problem_count' | 'problem_votes_received' | 'following_count' | 
        'follower_count' | 'join_date' | 'profile_complete' | 'favorite_count' | 'activity_streak';
  threshold?: number;
  before?: string; // For date-based criteria
  days?: number; // For streak-based criteria
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  context?: Record<string, any>;
  achievement?: Achievement; // Populated when joined
}

// Social Interaction Types
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: UserProfile; // Populated when joined
  following?: UserProfile; // Populated when joined
}

export interface UserFavorite {
  id: string;
  user_id: string;
  problem_id: string;
  created_at: string;
  problem?: Problem; // Populated when joined
}

// Activity Feed Types
export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'problem_created' | 'problem_voted' | 'achievement_earned' | 
                 'user_followed' | 'problem_favorited' | 'profile_updated';
  entity_type?: 'problem' | 'vote' | 'achievement' | 'follow' | 'favorite' | 'user';
  entity_id?: string;
  metadata?: Record<string, any>;
  visibility: 'public' | 'private' | 'followers_only';
  created_at: string;
  user?: UserProfile; // Populated when joined
}

// Reputation System Types
export interface UserReputationHistory {
  id: string;
  user_id: string;
  points_change: number;
  reason: 'problem_created' | 'problem_voted' | 'vote_received' | 'achievement_earned' |
          'problem_quality_bonus' | 'community_contribution' | 'penalty_applied';
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

// API Response Types
export interface UserProfileResponse {
  user: UserProfile;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  mutualFollowers?: number;
}

export interface UserActivityFeedResponse {
  activities: UserActivity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
  total: number;
  totalPoints: number;
  recentAchievements: UserAchievement[];
}

export interface UserFollowersResponse {
  followers: UserFollow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserFollowingResponse {
  following: UserFollow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserFavoritesResponse {
  favorites: UserFavorite[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Social Statistics
export interface UserSocialStats {
  reputation_score: number;
  total_followers: number;
  total_following: number;
  total_achievements: number;
  total_favorites: number;
  total_votes_cast: number;
  total_problems_proposed: number;
  recent_activity_count: number;
}

// Search and Discovery Types
export interface UserSearchResult {
  id: string;
  name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  reputation_score: number;
  total_followers: number;
  isFollowing?: boolean;
  mutualFollowers?: number;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form and UI Types
export interface SocialActionButtonProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  earnedAt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export interface ActivityFeedItemProps {
  activity: UserActivity;
  showUser?: boolean;
  compact?: boolean;
}

// Problem type (referenced in social features)
export interface Problem {
  id: string;
  proposer_id: string;
  title: string;
  description: string;
  category_id: string;
  status: 'Proposed' | 'In Development' | 'Completed';
  vote_count: number;
  created_at: string;
  updated_at: string;
  proposer?: UserProfile;
}

// Error and Loading States
export interface SocialError {
  code: string;
  message: string;
  field?: string;
}

export interface SocialLoadingState {
  isLoading: boolean;
  error: SocialError | null;
}

// Event Types for Real-time Updates
export interface SocialEvent {
  type: 'follow' | 'unfollow' | 'achievement_earned' | 'problem_favorited' | 'profile_updated';
  user_id: string;
  target_user_id?: string;
  data?: Record<string, any>;
  timestamp: string;
}

// Utility Types
export type UserVisibility = 'public' | 'private' | 'followers_only';
export type ActivityType = UserActivity['activity_type'];
export type AchievementCategory = Achievement['category'];
export type ReputationReason = UserReputationHistory['reason'];

// Type Guards
export const isUserProfile = (obj: any): obj is UserProfile => {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
};

export const isAchievement = (obj: any): obj is Achievement => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.category === 'string';
};

export const isUserActivity = (obj: any): obj is UserActivity => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string' && typeof obj.activity_type === 'string';
};