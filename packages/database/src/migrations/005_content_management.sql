-- WikiGaiaLab Database Schema v1.0
-- Migration 005: Content Management & Category Enhancement
-- Epic 3, Story 3.3 & 3.4: Content Management and Category Management
-- Author: Claude (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Add moderation and featured content fields to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint for moderated_by
ALTER TABLE problems ADD CONSTRAINT IF NOT EXISTS fk_problems_moderated_by 
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add constraint for moderation_status
ALTER TABLE problems ADD CONSTRAINT IF NOT EXISTS problems_moderation_status_valid 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'needs_changes'));

-- Enhance categories table with management fields
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'folder';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#6B7280';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE categories ADD COLUMN IF NOT EXISTS problems_count INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Content collections table for featured content curation
CREATE TABLE IF NOT EXISTS content_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT content_collections_name_length CHECK (length(name) >= 2 AND length(name) <= 100)
);

-- Junction table for problems in collections
CREATE TABLE IF NOT EXISTS collection_problems (
    collection_id UUID REFERENCES content_collections(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    
    PRIMARY KEY (collection_id, problem_id)
);

-- Category analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS category_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    problems_added INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, date)
);

-- Category history for audit trails
CREATE TABLE IF NOT EXISTS category_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT category_history_action_valid CHECK (action IN ('created', 'updated', 'deleted', 'merged', 'migrated'))
);

-- Admin activity log for content management actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT admin_activity_action_valid CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'feature', 'moderate')),
    CONSTRAINT admin_activity_resource_valid CHECK (resource_type IN ('problem', 'category', 'collection', 'user'))
);

-- Create indexes for performance optimization

-- Problems moderation indexes
CREATE INDEX IF NOT EXISTS idx_problems_moderation_status ON problems(moderation_status);
CREATE INDEX IF NOT EXISTS idx_problems_moderated_by ON problems(moderated_by);
CREATE INDEX IF NOT EXISTS idx_problems_is_featured ON problems(is_featured);
CREATE INDEX IF NOT EXISTS idx_problems_featured_until ON problems(featured_until);

-- Categories enhancement indexes
CREATE INDEX IF NOT EXISTS idx_categories_problems_count ON categories(problems_count DESC);
CREATE INDEX IF NOT EXISTS idx_categories_last_used_at ON categories(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON categories USING GIN(keywords);

-- Content collections indexes
CREATE INDEX IF NOT EXISTS idx_content_collections_created_by ON content_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_content_collections_is_active ON content_collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collection_problems_display_order ON collection_problems(collection_id, display_order);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_category_analytics_date ON category_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_category_analytics_category_date ON category_analytics(category_id, date DESC);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_category_history_category_id ON category_history(category_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource ON admin_activity_log(resource_type, resource_id);

-- Composite indexes for complex admin queries
CREATE INDEX IF NOT EXISTS idx_problems_moderation_created ON problems(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_featured_active ON problems(is_featured, featured_until) WHERE is_featured = true;

-- Update existing problems to approved status (since they were previously auto-approved)
UPDATE problems SET moderation_status = 'approved', moderated_at = created_at WHERE moderation_status = 'pending';

-- Initialize category problems_count with actual counts
UPDATE categories SET problems_count = (
    SELECT COUNT(*) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);

-- Update category last_used_at with most recent problem creation
UPDATE categories SET last_used_at = (
    SELECT MAX(created_at) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);

COMMIT;