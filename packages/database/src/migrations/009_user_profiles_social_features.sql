-- WikiGaiaLab Database Schema - User Profiles & Social Features
-- Migration 009: User profiles, achievements, social interactions, and activity tracking
-- Story 4.3: User Profiles & Social Features - Epic 4: Community Engagement
-- Author: Claude (Dev Agent)
-- Date: 2025-07-18

BEGIN;

-- Extend users table with profile and social fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS twitter_username TEXT,
ADD COLUMN IF NOT EXISTS linkedin_username TEXT,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS activity_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS email_visibility TEXT DEFAULT 'private',
ADD COLUMN IF NOT EXISTS allow_follow BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_following INTEGER DEFAULT 0;

-- Add constraints for new user fields
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_bio_length CHECK (length(bio) <= 500),
ADD CONSTRAINT IF NOT EXISTS users_location_length CHECK (length(location) <= 100),
ADD CONSTRAINT IF NOT EXISTS users_profile_visibility_valid CHECK (profile_visibility IN ('public', 'private', 'followers_only')),
ADD CONSTRAINT IF NOT EXISTS users_activity_visibility_valid CHECK (activity_visibility IN ('public', 'private', 'followers_only')),
ADD CONSTRAINT IF NOT EXISTS users_email_visibility_valid CHECK (email_visibility IN ('public', 'private', 'followers_only')),
ADD CONSTRAINT IF NOT EXISTS users_reputation_non_negative CHECK (reputation_score >= 0),
ADD CONSTRAINT IF NOT EXISTS users_followers_non_negative CHECK (total_followers >= 0),
ADD CONSTRAINT IF NOT EXISTS users_following_non_negative CHECK (total_following >= 0);

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT, -- URL or icon identifier
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    criteria JSONB NOT NULL, -- Flexible criteria definition
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT achievements_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT achievements_description_length CHECK (length(description) >= 10 AND length(description) <= 500),
    CONSTRAINT achievements_category_valid CHECK (category IN ('voting', 'problems', 'community', 'engagement', 'special')),
    CONSTRAINT achievements_points_non_negative CHECK (points >= 0)
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB, -- Additional context about how the achievement was earned
    
    -- Foreign keys
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate achievements
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- User follows table (social following system)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint and self-follow prevention
    CONSTRAINT unique_user_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- User favorites table (favorite problems)
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_favorites_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate favorites
    CONSTRAINT unique_user_favorite UNIQUE (user_id, problem_id)
);

-- Activity feed table (comprehensive activity tracking)
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    entity_type TEXT, -- 'problem', 'vote', 'achievement', 'follow', 'favorite'
    entity_id UUID,
    metadata JSONB, -- Flexible metadata for different activity types
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT user_activities_type_valid CHECK (activity_type IN (
        'problem_created', 'problem_voted', 'achievement_earned', 
        'user_followed', 'problem_favorited', 'profile_updated'
    )),
    CONSTRAINT user_activities_entity_type_valid CHECK (entity_type IN ('problem', 'vote', 'achievement', 'follow', 'favorite', 'user')),
    CONSTRAINT user_activities_visibility_valid CHECK (visibility IN ('public', 'private', 'followers_only'))
);

-- User reputation history table (track reputation changes)
CREATE TABLE IF NOT EXISTS user_reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_reputation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT reputation_reason_valid CHECK (reason IN (
        'problem_created', 'problem_voted', 'vote_received', 'achievement_earned',
        'problem_quality_bonus', 'community_contribution', 'penalty_applied'
    ))
);

-- Create indexes for performance optimization

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_users_reputation_score ON users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_followers ON users(total_followers DESC);
CREATE INDEX IF NOT EXISTS idx_users_interests ON users USING GIN(interests);

-- Achievement indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_points ON achievements(points DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_problem_id ON user_favorites(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_visibility ON user_activities(visibility);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity ON user_activities(entity_type, entity_id);

-- Reputation history indexes
CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON user_reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputation_created_at ON user_reputation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_reason ON user_reputation_history(reason);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_visibility_created ON user_activities(user_id, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_created ON user_follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_earned ON user_achievements(user_id, earned_at DESC);

-- Insert default achievement definitions
INSERT INTO achievements (name, description, icon, category, points, criteria) VALUES
('First Vote', 'Cast your first vote on a problem', 'vote-icon', 'voting', 10, '{"type": "vote_count", "threshold": 1}'),
('Active Voter', 'Cast 10 votes on problems', 'voter-icon', 'voting', 50, '{"type": "vote_count", "threshold": 10}'),
('Democracy Champion', 'Cast 100 votes on problems', 'champion-icon', 'voting', 200, '{"type": "vote_count", "threshold": 100}'),
('Problem Solver', 'Create your first problem proposal', 'lightbulb-icon', 'problems', 25, '{"type": "problem_count", "threshold": 1}'),
('Idea Generator', 'Create 5 problem proposals', 'ideas-icon', 'problems', 100, '{"type": "problem_count", "threshold": 5}'),
('Innovation Leader', 'Create 20 problem proposals', 'leader-icon', 'problems', 300, '{"type": "problem_count", "threshold": 20}'),
('Popular Problem', 'Have a problem receive 50 votes', 'popular-icon', 'problems', 150, '{"type": "problem_votes_received", "threshold": 50}'),
('Viral Problem', 'Have a problem receive 200 votes', 'viral-icon', 'problems', 500, '{"type": "problem_votes_received", "threshold": 200}'),
('Community Builder', 'Follow 10 other users', 'community-icon', 'community', 30, '{"type": "following_count", "threshold": 10}'),
('Social Butterfly', 'Have 10 followers', 'butterfly-icon', 'community', 50, '{"type": "follower_count", "threshold": 10}'),
('Influencer', 'Have 50 followers', 'influencer-icon', 'community', 200, '{"type": "follower_count", "threshold": 50}'),
('Early Adopter', 'Join WikiGaiaLab in the first week', 'early-icon', 'special', 100, '{"type": "join_date", "before": "2025-08-01"}'),
('Profile Complete', 'Complete your user profile with bio and interests', 'profile-icon', 'engagement', 20, '{"type": "profile_complete"}'),
('Curator', 'Favorite 20 problems', 'curator-icon', 'engagement', 40, '{"type": "favorite_count", "threshold": 20}'),
('Weekly Active', 'Be active for 7 consecutive days', 'streak-icon', 'engagement', 60, '{"type": "activity_streak", "days": 7}')
ON CONFLICT (name) DO NOTHING;

COMMIT;