-- WikiGaiaLab Database Schema v1.0
-- Migration 001: Initial schema with core tables, indexes, and constraints
-- Author: James (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories table (must be created first due to foreign key relationships)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT categories_name_length CHECK (length(name) >= 2 AND length(name) <= 50),
    CONSTRAINT categories_order_index_positive CHECK (order_index >= 0)
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'google',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_votes_cast INTEGER DEFAULT 0,
    total_problems_proposed INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'free',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT users_subscription_status_valid CHECK (subscription_status IN ('free', 'active', 'cancelled', 'trialing')),
    CONSTRAINT users_total_votes_non_negative CHECK (total_votes_cast >= 0),
    CONSTRAINT users_total_problems_non_negative CHECK (total_problems_proposed >= 0)
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL,
    status TEXT DEFAULT 'Proposed',
    vote_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_problems_proposer FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_problems_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT problems_title_length CHECK (length(title) >= 5 AND length(title) <= 100),
    CONSTRAINT problems_description_length CHECK (length(description) >= 10 AND length(description) <= 1000),
    CONSTRAINT problems_status_valid CHECK (status IN ('Proposed', 'In Development', 'Completed')),
    CONSTRAINT problems_vote_count_positive CHECK (vote_count >= 0)
);

-- Votes table (junction table with composite primary key)
CREATE TABLE IF NOT EXISTS votes (
    user_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite primary key (ensures one vote per user per problem)
    PRIMARY KEY (user_id, problem_id),
    
    -- Foreign keys
    CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_votes_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Apps table (for future developed solutions)
CREATE TABLE IF NOT EXISTS apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_features JSONB DEFAULT '[]',
    premium_features JSONB DEFAULT '[]',
    access_model TEXT DEFAULT 'freemium',
    slug TEXT UNIQUE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_apps_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT apps_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT apps_access_model_valid CHECK (access_model IN ('freemium', 'subscription', 'one-time')),
    CONSTRAINT apps_slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT apps_version_format CHECK (version ~* '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_category_id ON problems(category_id);
CREATE INDEX IF NOT EXISTS idx_problems_proposer_id ON problems(proposer_id);
CREATE INDEX IF NOT EXISTS idx_problems_vote_count ON problems(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_updated_at ON problems(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_problem_id ON votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_order_index ON categories(order_index);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_apps_problem_id ON apps(problem_id);
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_is_published ON apps(is_published);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_problems_status_vote_count ON problems(status, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_problems_category_status ON problems(category_id, status);
CREATE INDEX IF NOT EXISTS idx_problems_proposer_status ON problems(proposer_id, status);

COMMIT;