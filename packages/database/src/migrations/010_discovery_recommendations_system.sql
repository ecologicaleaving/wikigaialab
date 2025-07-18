-- WikiGaiaLab Database Schema - Enhanced Discovery & Recommendations System
-- Migration 010: Personalized recommendations, trending algorithms, collections, and discovery
-- Story 4.4: Enhanced Discovery & Recommendations - Epic 4: Community Engagement
-- Author: Claude (Dev Agent)
-- Date: 2025-07-18

BEGIN;

-- User recommendation preferences table
CREATE TABLE IF NOT EXISTS user_recommendation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category_weights JSONB DEFAULT '{}', -- Category preference weights
    interaction_weights JSONB DEFAULT '{}', -- Voting, favoriting, viewing weights
    diversity_preference REAL DEFAULT 0.3, -- 0 = similar content, 1 = diverse content
    trending_preference REAL DEFAULT 0.5, -- 0 = no trending bias, 1 = strong trending bias
    exclude_categories UUID[] DEFAULT '{}', -- Categories to exclude from recommendations
    min_vote_threshold INTEGER DEFAULT 1, -- Minimum votes for recommended problems
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_rec_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT user_rec_prefs_diversity_valid CHECK (diversity_preference >= 0 AND diversity_preference <= 1),
    CONSTRAINT user_rec_prefs_trending_valid CHECK (trending_preference >= 0 AND trending_preference <= 1),
    CONSTRAINT user_rec_prefs_min_votes_valid CHECK (min_vote_threshold >= 0),
    
    -- Unique constraint
    CONSTRAINT unique_user_rec_prefs UNIQUE (user_id)
);

-- Problem similarity matrix for content-based recommendations
CREATE TABLE IF NOT EXISTS problem_similarities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_a_id UUID NOT NULL,
    problem_b_id UUID NOT NULL,
    similarity_score REAL NOT NULL,
    similarity_type TEXT NOT NULL, -- 'content', 'category', 'voting_pattern', 'user_interaction'
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_problem_sim_a FOREIGN KEY (problem_a_id) REFERENCES problems(id) ON DELETE CASCADE,
    CONSTRAINT fk_problem_sim_b FOREIGN KEY (problem_b_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT problem_sim_score_valid CHECK (similarity_score >= 0 AND similarity_score <= 1),
    CONSTRAINT problem_sim_type_valid CHECK (similarity_type IN ('content', 'category', 'voting_pattern', 'user_interaction', 'hybrid')),
    CONSTRAINT problem_sim_not_self CHECK (problem_a_id != problem_b_id),
    
    -- Unique constraint (bidirectional)
    CONSTRAINT unique_problem_similarity UNIQUE (problem_a_id, problem_b_id, similarity_type)
);

-- Trending calculation cache for performance
CREATE TABLE IF NOT EXISTS trending_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL,
    trending_score REAL NOT NULL,
    vote_velocity REAL NOT NULL, -- Votes per hour/day
    time_decay_factor REAL NOT NULL,
    engagement_score REAL NOT NULL, -- Views, favorites, shares
    category_boost REAL DEFAULT 1.0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Foreign keys
    CONSTRAINT fk_trending_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT trending_score_positive CHECK (trending_score >= 0),
    CONSTRAINT vote_velocity_positive CHECK (vote_velocity >= 0),
    CONSTRAINT time_decay_positive CHECK (time_decay_factor >= 0 AND time_decay_factor <= 1),
    CONSTRAINT engagement_positive CHECK (engagement_score >= 0),
    CONSTRAINT category_boost_positive CHECK (category_boost >= 0),
    
    -- Unique constraint
    CONSTRAINT unique_trending_cache UNIQUE (problem_id)
);

-- Problem collections system
CREATE TABLE IF NOT EXISTS problem_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    curator_id UUID NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    collection_type TEXT DEFAULT 'manual', -- 'manual', 'auto_trending', 'auto_category', 'auto_recommended'
    criteria JSONB, -- For automatic collections
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_collection_curator FOREIGN KEY (curator_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT collection_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT collection_description_length CHECK (length(description) <= 500),
    CONSTRAINT collection_type_valid CHECK (collection_type IN ('manual', 'auto_trending', 'auto_category', 'auto_recommended')),
    CONSTRAINT collection_order_positive CHECK (display_order >= 0)
);

-- Collection items junction table
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    item_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by_id UUID,
    
    -- Foreign keys
    CONSTRAINT fk_collection_items_collection FOREIGN KEY (collection_id) REFERENCES problem_collections(id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_items_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_items_added_by FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT collection_item_order_positive CHECK (item_order >= 0),
    
    -- Unique constraint
    CONSTRAINT unique_collection_item UNIQUE (collection_id, problem_id)
);

-- User recommendation feedback for learning
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    recommendation_type TEXT NOT NULL, -- 'personal', 'trending', 'similar', 'collection'
    feedback_type TEXT NOT NULL, -- 'clicked', 'voted', 'favorited', 'shared', 'dismissed', 'hidden'
    context JSONB, -- Additional context about the recommendation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_rec_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_feedback_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT rec_feedback_type_valid CHECK (recommendation_type IN ('personal', 'trending', 'similar', 'collection', 'category')),
    CONSTRAINT feedback_type_valid CHECK (feedback_type IN ('clicked', 'voted', 'favorited', 'shared', 'dismissed', 'hidden', 'viewed'))
);

-- User problem interactions for collaborative filtering
CREATE TABLE IF NOT EXISTS user_problem_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    interaction_type TEXT NOT NULL,
    interaction_weight REAL DEFAULT 1.0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 1,
    
    -- Foreign keys
    CONSTRAINT fk_user_interactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_interactions_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT interaction_type_valid CHECK (interaction_type IN ('vote', 'view', 'favorite', 'share', 'comment', 'propose')),
    CONSTRAINT interaction_weight_positive CHECK (interaction_weight >= 0),
    CONSTRAINT interaction_count_positive CHECK (interaction_count >= 0),
    
    -- Unique constraint
    CONSTRAINT unique_user_problem_interaction UNIQUE (user_id, problem_id, interaction_type)
);

-- Discovery analytics table
CREATE TABLE IF NOT EXISTS discovery_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT,
    discovery_method TEXT NOT NULL, -- 'search', 'trending', 'recommendations', 'collection', 'category'
    source_id UUID, -- ID of collection, category, or recommendation source
    problems_discovered INTEGER DEFAULT 0,
    problems_clicked INTEGER DEFAULT 0,
    problems_voted INTEGER DEFAULT 0,
    session_duration INTEGER, -- Duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_discovery_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT discovery_method_valid CHECK (discovery_method IN ('search', 'trending', 'recommendations', 'collection', 'category', 'homepage', 'similar')),
    CONSTRAINT problems_discovered_positive CHECK (problems_discovered >= 0),
    CONSTRAINT problems_clicked_positive CHECK (problems_clicked >= 0),
    CONSTRAINT problems_voted_positive CHECK (problems_voted >= 0),
    CONSTRAINT session_duration_positive CHECK (session_duration >= 0)
);

-- Create indexes for performance optimization

-- User recommendation preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_rec_prefs_user_id ON user_recommendation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rec_prefs_updated_at ON user_recommendation_preferences(updated_at DESC);

-- Problem similarity indexes
CREATE INDEX IF NOT EXISTS idx_problem_sim_a_id ON problem_similarities(problem_a_id);
CREATE INDEX IF NOT EXISTS idx_problem_sim_b_id ON problem_similarities(problem_b_id);
CREATE INDEX IF NOT EXISTS idx_problem_sim_score ON problem_similarities(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_problem_sim_type ON problem_similarities(similarity_type);
CREATE INDEX IF NOT EXISTS idx_problem_sim_calculated_at ON problem_similarities(calculated_at DESC);

-- Trending cache indexes
CREATE INDEX IF NOT EXISTS idx_trending_cache_problem_id ON trending_cache(problem_id);
CREATE INDEX IF NOT EXISTS idx_trending_cache_score ON trending_cache(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_cache_expires_at ON trending_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_trending_cache_calculated_at ON trending_cache(calculated_at DESC);

-- Problem collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_curator_id ON problem_collections(curator_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_featured ON problem_collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON problem_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_type ON problem_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON problem_collections(display_order);

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_problem_id ON collection_items(problem_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_order ON collection_items(collection_id, item_order);

-- Recommendation feedback indexes
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_problem_id ON recommendation_feedback(problem_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_type ON recommendation_feedback(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_created_at ON recommendation_feedback(created_at DESC);

-- User problem interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_problem_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_problem_id ON user_problem_interactions(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_problem_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_weight ON user_problem_interactions(interaction_weight DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_last ON user_problem_interactions(last_interaction DESC);

-- Discovery analytics indexes
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_user_id ON discovery_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_session ON discovery_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_method ON discovery_analytics(discovery_method);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_created_at ON discovery_analytics(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_trending_cache_score_calculated ON trending_cache(trending_score DESC, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_problem_sim_a_score ON problem_similarities(problem_a_id, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_weight ON user_problem_interactions(user_id, interaction_weight DESC);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user_type_created ON recommendation_feedback(user_id, recommendation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_public_featured_order ON problem_collections(is_public, is_featured, display_order);

-- Insert default problem collections
INSERT INTO problem_collections (name, description, curator_id, is_featured, is_public, collection_type, display_order) VALUES
('Trending Problems', 'Currently trending problems based on voting velocity and engagement', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_trending', 1),
('Community Favorites', 'Most voted problems across all categories', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_recommended', 2),
('Recent Discoveries', 'Recently proposed problems gaining traction', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_trending', 3),
('Productivity Solutions', 'Problems focused on improving productivity and efficiency', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_category', 4),
('Communication Tools', 'Problems addressing communication and collaboration needs', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_category', 5),
('Home & Family', 'Problems related to home management and family organization', 
 (SELECT id FROM users WHERE is_admin = true LIMIT 1), true, true, 'auto_category', 6);

COMMIT;