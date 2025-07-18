-- Critical Performance Indexes Implementation
-- Phase 1 Fix: Database performance optimization

-- Problems table indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_created_at_desc 
ON problems (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_vote_count_desc 
ON problems (vote_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_status_created 
ON problems (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_user_id_created 
ON problems (user_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_fts_title_description 
ON problems USING GIN (to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_fts_title 
ON problems USING GIN (to_tsvector('english', title));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_fts_description 
ON problems USING GIN (to_tsvector('english', description));

-- Votes table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_problem_id_created 
ON votes (problem_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_id_created 
ON votes (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_problem_user_unique 
ON votes (problem_id, user_id);

-- Comments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_problem_id_created 
ON comments (problem_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id_created 
ON comments (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id 
ON comments (parent_id) WHERE parent_id IS NOT NULL;

-- User profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_updated_at 
ON user_profiles (updated_at DESC);

-- Activity feed indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed_user_id_created 
ON activity_feed (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed_target_user_created 
ON activity_feed (target_user_id, created_at DESC) WHERE target_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed_type_created 
ON activity_feed (activity_type, created_at DESC);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_created 
ON notifications (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read_status 
ON notifications (user_id, is_read, created_at DESC);

-- User achievements indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_id 
ON user_achievements (user_id, earned_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_achievement_type 
ON user_achievements (achievement_type, earned_at DESC);

-- User favorites indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_favorites_user_id 
ON user_favorites (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_favorites_problem_id 
ON user_favorites (problem_id, created_at DESC);

-- User follows indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_follower_id 
ON user_follows (follower_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_following_id 
ON user_follows (following_id, created_at DESC);

-- Problem tags indexes (if using tag system)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_tags_problem_id 
ON problem_tags (problem_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problem_tags');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_tags_tag_id 
ON problem_tags (tag_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problem_tags');

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_status_votes_created 
ON problems (status, vote_count DESC, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_user_status_created 
ON problems (user_id, status, created_at DESC);

-- Search performance indexes with trigrams for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_title_trgm 
ON problems USING GIN (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_description_trgm 
ON problems USING GIN (description gin_trgm_ops);

-- Analytics indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_created_at_date 
ON votes (DATE(created_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_created_at_date 
ON problems (DATE(created_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at_date 
ON comments (DATE(created_at));

-- Update table statistics for better query planning
ANALYZE problems;
ANALYZE votes;
ANALYZE comments;
ANALYZE user_profiles;
ANALYZE activity_feed;
ANALYZE notifications;
ANALYZE user_achievements;
ANALYZE user_favorites;
ANALYZE user_follows;

-- Create partial indexes for common filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_active_status 
ON problems (created_at DESC) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_high_votes 
ON problems (created_at DESC) WHERE vote_count >= 10;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications (user_id, created_at DESC) WHERE is_read = false;

-- Comment about index maintenance
COMMENT ON INDEX idx_problems_fts_title_description IS 'Full-text search index for problems title and description';
COMMENT ON INDEX idx_problems_vote_count_desc IS 'Index for sorting problems by vote count (popular first)';
COMMENT ON INDEX idx_problems_created_at_desc IS 'Index for sorting problems by creation date (newest first)';

-- Create index monitoring view for future maintenance
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Grant necessary permissions
GRANT SELECT ON index_usage_stats TO authenticated;