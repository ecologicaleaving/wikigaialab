-- WikiGaiaLab Database Schema - Search Performance Optimization
-- Migration 008: Add full-text search indexes and search performance optimizations
-- Author: Claude (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Enable extensions for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Add full-text search columns to problems table
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('italian', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('italian', coalesce(description, '')), 'B')
) STORED;

-- Create GIN index for full-text search (best for tsvector columns)
CREATE INDEX IF NOT EXISTS idx_problems_search_vector 
ON problems USING gin(search_vector);

-- Create trigram indexes for fuzzy text search (useful for typos and partial matches)
CREATE INDEX IF NOT EXISTS idx_problems_title_trgm 
ON problems USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_problems_description_trgm 
ON problems USING gin(description gin_trgm_ops);

-- Create B-tree indexes for case-insensitive text search
CREATE INDEX IF NOT EXISTS idx_problems_title_lower 
ON problems(lower(title));

CREATE INDEX IF NOT EXISTS idx_problems_description_lower 
ON problems(lower(description));

-- Composite indexes for common search patterns
-- Search + filter by category
CREATE INDEX IF NOT EXISTS idx_problems_search_category 
ON problems USING gin(search_vector, category_id);

-- Search + filter by status
CREATE INDEX IF NOT EXISTS idx_problems_search_status 
ON problems USING gin(search_vector, status);

-- Search + sort by vote_count (trending)
CREATE INDEX IF NOT EXISTS idx_problems_search_votes 
ON problems(vote_count DESC) 
WHERE search_vector IS NOT NULL;

-- Search + sort by created_at (recent)
CREATE INDEX IF NOT EXISTS idx_problems_search_created 
ON problems(created_at DESC) 
WHERE search_vector IS NOT NULL;

-- Combined filter indexes for advanced search scenarios
CREATE INDEX IF NOT EXISTS idx_problems_category_status_votes 
ON problems(category_id, status, vote_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problems_proposer_category_status 
ON problems(proposer_id, category_id, status, vote_count DESC);

-- Date range search optimization
CREATE INDEX IF NOT EXISTS idx_problems_created_at_range 
ON problems(created_at) 
WHERE created_at >= '2024-01-01';

-- Vote count range optimization (for problems with significant engagement)
CREATE INDEX IF NOT EXISTS idx_problems_vote_count_range 
ON problems(vote_count, created_at DESC) 
WHERE vote_count > 0;

-- Optimization for categories search suggestions
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm 
ON categories USING gin(name gin_trgm_ops) 
WHERE is_active = true;

-- Optimization for users search suggestions (proposers)
CREATE INDEX IF NOT EXISTS idx_users_name_trgm 
ON users USING gin(name gin_trgm_ops);

-- Create analytics table indexes for search tracking
CREATE INDEX IF NOT EXISTS idx_analytics_events_search 
ON analytics_events(event_type, created_at DESC) 
WHERE event_type IN ('search_problems', 'search_suggestions');

-- Function to update search rankings based on engagement
CREATE OR REPLACE FUNCTION calculate_search_rank(
  vote_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) RETURNS FLOAT AS $$
DECLARE
  age_factor FLOAT;
  engagement_factor FLOAT;
  recency_bonus FLOAT;
BEGIN
  -- Calculate age factor (newer problems get higher rank)
  age_factor := 1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0);
  
  -- Calculate engagement factor (more votes = higher rank)
  engagement_factor := LOG(GREATEST(vote_count, 1)) / LOG(10);
  
  -- Calculate recency bonus for recently updated problems
  recency_bonus := CASE 
    WHEN updated_at > NOW() - INTERVAL '7 days' THEN 0.2
    WHEN updated_at > NOW() - INTERVAL '30 days' THEN 0.1
    ELSE 0.0
  END;
  
  RETURN age_factor * 0.3 + engagement_factor * 0.6 + recency_bonus;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed search rank column
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS search_rank FLOAT 
GENERATED ALWAYS AS (
  calculate_search_rank(vote_count, created_at, updated_at)
) STORED;

-- Index for search rank ordering
CREATE INDEX IF NOT EXISTS idx_problems_search_rank 
ON problems(search_rank DESC, created_at DESC);

-- Create materialized view for search statistics (for analytics)
CREATE MATERIALIZED VIEW IF NOT EXISTS search_statistics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_searches,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CAST(event_data->>'results_count' AS INTEGER)) as avg_results,
  COUNT(*) FILTER (WHERE CAST(event_data->>'results_count' AS INTEGER) = 0) as zero_results
FROM analytics_events 
WHERE event_type = 'search_problems' 
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_statistics_date 
ON search_statistics(date DESC);

-- Function to refresh search statistics (to be called periodically)
CREATE OR REPLACE FUNCTION refresh_search_statistics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW search_statistics;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON search_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_search_statistics() TO service_role;

COMMIT;

-- Performance notes:
-- 1. The tsvector column is automatically updated when title or description changes
-- 2. GIN indexes are optimized for text search but take more space than B-tree
-- 3. Trigram indexes help with typos and partial matches
-- 4. Composite indexes support complex queries with multiple filters
-- 5. The search_rank function provides relevance scoring
-- 6. Materialized view provides aggregated search analytics
--
-- Expected performance improvements:
-- - Full-text search: 10-100x faster on large datasets
-- - Fuzzy matching: Improved user experience for typos
-- - Complex filtering: 5-10x faster with composite indexes
-- - Search analytics: Real-time insights into search patterns