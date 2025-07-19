-- Quick fix for critical database issues
-- Create missing tables needed by the application

-- Create problem_collections table
CREATE TABLE IF NOT EXISTS problem_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    curator_id UUID NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    collection_type TEXT DEFAULT 'manual',
    criteria JSONB,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_items table
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    item_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by_id UUID,
    UNIQUE(collection_id, problem_id)
);

-- Create discovery_analytics table
CREATE TABLE IF NOT EXISTS discovery_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT,
    discovery_method TEXT NOT NULL,
    source_id UUID,
    problems_discovered INTEGER DEFAULT 0,
    problems_clicked INTEGER DEFAULT 0,
    problems_voted INTEGER DEFAULT 0,
    session_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trending_cache table  
CREATE TABLE IF NOT EXISTS trending_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL,
    trending_score REAL NOT NULL,
    vote_velocity REAL NOT NULL,
    time_decay_factor REAL NOT NULL,
    engagement_score REAL NOT NULL,
    category_boost REAL DEFAULT 1.0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(problem_id)
);

-- Add relevance column to problems table if it doesn't exist
ALTER TABLE problems ADD COLUMN IF NOT EXISTS relevance REAL DEFAULT 0.0;

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_collections_public ON problem_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_trending_cache_score ON trending_cache(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_problems_relevance ON problems(relevance DESC);

-- Basic users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic categories table if it doesn't exist  
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic problems table if it doesn't exist
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID,
    proposer_id UUID,
    status TEXT DEFAULT 'Proposed',
    vote_count INTEGER DEFAULT 0,
    relevance REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user if none exists
INSERT INTO users (email, name, is_admin) 
SELECT 'admin@wikigaialab.com', 'Admin', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE is_admin = true);

-- Insert default categories if none exist
INSERT INTO categories (name, description, display_order) VALUES
('Tecnologia', 'Problemi legati alla tecnologia e all''innovazione', 1),
('Ambiente', 'Problemi ambientali e sostenibilità', 2),
('Sociale', 'Problemi sociali e comunitari', 3),
('Economia', 'Problemi economici e finanziari', 4),
('Salute', 'Problemi di salute e benessere', 5)
ON CONFLICT DO NOTHING;