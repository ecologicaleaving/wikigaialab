-- WikiGaiaLab Row Level Security Policies v1.1 (Fixed)
-- Migration 003: Fixed RLS policies to prevent infinite recursion
-- Author: James (Dev Agent) 
-- Date: 2025-07-17

BEGIN;

-- Disable RLS temporarily to avoid recursion during setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE apps DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all public profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view all problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can create problems" ON problems;
DROP POLICY IF EXISTS "Users can update their own problems" ON problems;
DROP POLICY IF EXISTS "Admins can manage all problems" ON problems;
DROP POLICY IF EXISTS "Users can delete their own problems" ON problems;
DROP POLICY IF EXISTS "Users can view all votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can cast votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Admins can manage all votes" ON votes;
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Users can view published apps" ON apps;
DROP POLICY IF EXISTS "Admins can view all apps" ON apps;
DROP POLICY IF EXISTS "Admins can manage apps" ON apps;
DROP POLICY IF EXISTS "Premium users can access premium app features" ON apps;
DROP POLICY IF EXISTS "Users can view their own voting history" ON votes;
DROP POLICY IF EXISTS "Premium users can view extended voting analytics" ON votes;

-- Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Users table policies (simplified to avoid recursion)
CREATE POLICY "Users can view all public profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Categories table policies (public access for basic functionality)
CREATE POLICY "Users can view active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Apps table policies
CREATE POLICY "Users can view published apps" ON apps
    FOR SELECT USING (is_published = true);

-- Policy for user voting history
CREATE POLICY "Users can view their own voting history" ON votes
    FOR SELECT USING (
        auth.uid() = user_id
    );

COMMIT;