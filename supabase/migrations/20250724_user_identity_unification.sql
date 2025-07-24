-- User Identity Unification Migration
-- Adds role column and atomic user sync stored procedure
-- Date: 2025-07-24

BEGIN;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
        
        -- Update existing users to have proper role based on is_admin
        UPDATE users SET role = CASE WHEN is_admin THEN 'admin' ELSE 'user' END;
    END IF;
END $$;

-- Create atomic user sync stored procedure
CREATE OR REPLACE FUNCTION atomic_user_sync(
    user_id UUID,
    user_email TEXT,
    user_name TEXT DEFAULT NULL,
    user_avatar_url TEXT DEFAULT NULL,
    provider_name TEXT DEFAULT NULL,
    provider_account_id TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN,
    role TEXT,
    subscription_status TEXT,
    total_votes_cast INTEGER,
    total_problems_proposed INTEGER
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_user RECORD;
    now_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Input validation
    IF user_id IS NULL OR user_email IS NULL THEN
        RAISE EXCEPTION 'user_id and user_email are required';
    END IF;

    -- Validate email format
    IF user_email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', user_email;
    END IF;

    -- Lock the users table to prevent race conditions
    LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;

    -- Try to find existing user by ID first
    SELECT * INTO existing_user FROM users WHERE users.id = user_id;

    IF FOUND THEN
        -- Update existing user
        UPDATE users SET 
            name = COALESCE(user_name, existing_user.name),
            avatar_url = COALESCE(user_avatar_url, existing_user.avatar_url),
            last_login_at = now_timestamp,
            updated_at = now_timestamp
        WHERE users.id = user_id
        RETURNING * INTO existing_user;
        
        -- Return updated user data
        RETURN QUERY SELECT 
            existing_user.id,
            existing_user.email,
            existing_user.name,
            existing_user.avatar_url,
            existing_user.created_at,
            existing_user.updated_at,
            existing_user.last_login_at,
            existing_user.is_admin,
            existing_user.role,
            existing_user.subscription_status,
            existing_user.total_votes_cast,
            existing_user.total_problems_proposed;
    ELSE
        -- Check for email conflict (shouldn't happen with deterministic IDs)
        SELECT * INTO existing_user FROM users WHERE users.email = user_email;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Email % already exists with different ID. Expected ID: %, Existing ID: %', 
                          user_email, user_id, existing_user.id;
        END IF;

        -- Insert new user
        INSERT INTO users (
            id,
            email,
            name,
            avatar_url,
            created_at,
            updated_at,
            last_login_at,
            is_admin,
            role,
            subscription_status,
            total_votes_cast,
            total_problems_proposed
        ) VALUES (
            user_id,
            user_email,
            COALESCE(user_name, split_part(user_email, '@', 1)),
            user_avatar_url,
            now_timestamp,
            now_timestamp,
            now_timestamp,
            false,
            'user',
            'free',
            0,
            0
        ) RETURNING * INTO existing_user;

        -- Return new user data
        RETURN QUERY SELECT 
            existing_user.id,
            existing_user.email,
            existing_user.name,
            existing_user.avatar_url,
            existing_user.created_at,
            existing_user.updated_at,
            existing_user.last_login_at,
            existing_user.is_admin,
            existing_user.role,
            existing_user.subscription_status,
            existing_user.total_votes_cast,
            existing_user.total_problems_proposed;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION atomic_user_sync TO authenticated;

-- Create index on email for faster lookups during conflict checking
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';

-- Add comment to function
COMMENT ON FUNCTION atomic_user_sync IS 'Atomically creates or updates user data with proper locking to prevent race conditions';

-- Create user ID migration stored procedure
CREATE OR REPLACE FUNCTION migrate_user_id(
    old_user_id UUID,
    new_user_id UUID,
    user_email TEXT
) RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_problems INTEGER := 0;
    affected_votes INTEGER := 0;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Input validation
    IF old_user_id IS NULL OR new_user_id IS NULL OR user_email IS NULL THEN
        RAISE EXCEPTION 'old_user_id, new_user_id, and user_email are required';
    END IF;

    -- Validate email format
    IF user_email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', user_email;
    END IF;

    -- Lock all relevant tables to prevent race conditions
    LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
    LOCK TABLE problems IN SHARE ROW EXCLUSIVE MODE;
    LOCK TABLE votes IN SHARE ROW EXCLUSIVE MODE;

    -- Check if user exists with old ID
    SELECT EXISTS(SELECT 1 FROM users WHERE id = old_user_id AND email = user_email) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with ID % and email % not found', old_user_id, user_email;
    END IF;

    -- Check if new ID conflicts with existing user
    IF EXISTS(SELECT 1 FROM users WHERE id = new_user_id AND email != user_email) THEN
        RAISE EXCEPTION 'New user ID % conflicts with existing user', new_user_id;
    END IF;

    -- Update foreign key references first
    
    -- Update problems table
    UPDATE problems 
    SET proposer_id = new_user_id 
    WHERE proposer_id = old_user_id;
    
    GET DIAGNOSTICS affected_problems = ROW_COUNT;

    -- Update votes table
    UPDATE votes 
    SET user_id = new_user_id 
    WHERE user_id = old_user_id;
    
    GET DIAGNOSTICS affected_votes = ROW_COUNT;

    -- Update content_flags table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_flags') THEN
        UPDATE content_flags 
        SET flagger_id = new_user_id 
        WHERE flagger_id = old_user_id;
        
        UPDATE content_flags 
        SET moderator_id = new_user_id 
        WHERE moderator_id = old_user_id;
    END IF;

    -- Update other related tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        UPDATE referrals 
        SET referrer_id = new_user_id 
        WHERE referrer_id = old_user_id;
        
        UPDATE referrals 
        SET referee_id = new_user_id 
        WHERE referee_id = old_user_id;
    END IF;

    -- Finally, update the user record
    UPDATE users 
    SET id = new_user_id,
        updated_at = NOW()
    WHERE id = old_user_id AND email = user_email;

    -- Log the migration
    RAISE NOTICE 'User ID migration completed: % -> % (email: %, problems: %, votes: %)', 
                 old_user_id, new_user_id, user_email, affected_problems, affected_votes;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration failed for user %: %', user_email, SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION migrate_user_id TO authenticated;

-- Add comment to migration function
COMMENT ON FUNCTION migrate_user_id IS 'Atomically migrates user ID across all tables with proper foreign key reference updates';

-- Create utility function to execute raw SQL (for migration table creation)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT) RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;

COMMIT;