-- WikiGaiaLab Row Level Security Policies v1.0
-- Migration 003: Comprehensive RLS policies for data security
-- Author: James (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all public profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Problems table policies
CREATE POLICY "Users can view all problems" ON problems
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create problems" ON problems
    FOR INSERT WITH CHECK (
        auth.uid() = proposer_id 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own problems" ON problems
    FOR UPDATE USING (
        auth.uid() = proposer_id
    );

CREATE POLICY "Admins can manage all problems" ON problems
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Users can delete their own problems" ON problems
    FOR DELETE USING (
        auth.uid() = proposer_id
    );

-- Votes table policies
CREATE POLICY "Users can view all votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can cast votes" ON votes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Admins can manage all votes" ON votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Categories table policies
CREATE POLICY "Users can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all categories" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Apps table policies
CREATE POLICY "Users can view published apps" ON apps
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can view all apps" ON apps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can manage apps" ON apps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Additional security policies for premium features
CREATE POLICY "Premium users can access premium app features" ON apps
    FOR SELECT USING (
        is_published = true AND (
            access_model = 'freemium' OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND subscription_status IN ('active', 'trialing')
            )
        )
    );

-- Policy for user voting history (premium feature)
CREATE POLICY "Users can view their own voting history" ON votes
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Premium users can view extended voting analytics" ON votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND subscription_status IN ('active', 'trialing')
        )
    );

COMMIT;