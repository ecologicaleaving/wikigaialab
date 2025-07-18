-- Enhanced Row Level Security (RLS) Policies
-- Phase 1 Fix: Security hardening with stricter RLS policies

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can view public problems" ON problems;
DROP POLICY IF EXISTS "Users can create problems" ON problems;
DROP POLICY IF EXISTS "Users can update own problems" ON problems;
DROP POLICY IF EXISTS "Users can delete own problems" ON problems;

DROP POLICY IF EXISTS "Users can view votes" ON votes;
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;

DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Enhanced Problems table policies
CREATE POLICY "authenticated_users_can_view_active_problems" ON problems
    FOR SELECT
    TO authenticated
    USING (status = 'active' OR status = 'completed');

CREATE POLICY "authenticated_users_can_create_problems" ON problems
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(title)) >= 10 AND
        LENGTH(TRIM(description)) >= 50 AND
        status = 'active'
    );

CREATE POLICY "users_can_update_own_active_problems" ON problems
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'active')
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(title)) >= 10 AND
        LENGTH(TRIM(description)) >= 50
    );

CREATE POLICY "users_can_delete_own_problems_with_no_votes" ON problems
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id AND
        vote_count = 0 AND
        created_at > NOW() - INTERVAL '24 hours'
    );

-- Enhanced Votes table policies
CREATE POLICY "authenticated_users_can_view_votes" ON votes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "authenticated_users_can_create_votes" ON votes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM problems 
            WHERE id = problem_id AND status = 'active'
        )
    );

CREATE POLICY "users_cannot_update_votes" ON votes
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "users_can_delete_own_recent_votes" ON votes
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id AND
        created_at > NOW() - INTERVAL '5 minutes'
    );

-- Enhanced Comments table policies
CREATE POLICY "authenticated_users_can_view_comments" ON comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "authenticated_users_can_create_comments" ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(content)) >= 10 AND
        EXISTS (
            SELECT 1 FROM problems 
            WHERE id = problem_id AND status = 'active'
        )
    );

CREATE POLICY "users_can_update_own_recent_comments" ON comments
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id AND
        created_at > NOW() - INTERVAL '30 minutes'
    )
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(content)) >= 10
    );

CREATE POLICY "users_can_delete_own_comments" ON comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Enhanced User Profiles policies
CREATE POLICY "users_can_view_public_profiles" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "users_can_create_own_profile" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(full_name)) >= 2
    );

CREATE POLICY "users_can_update_own_profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        LENGTH(TRIM(full_name)) >= 2
    );

CREATE POLICY "users_cannot_delete_profiles" ON user_profiles
    FOR DELETE
    TO authenticated
    USING (false);

-- Enhanced Activity Feed policies
CREATE POLICY "users_can_view_relevant_activity" ON activity_feed
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        target_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_follows 
            WHERE follower_id = auth.uid() AND following_id = activity_feed.user_id
        )
    );

CREATE POLICY "system_can_create_activity" ON activity_feed
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create activity entries

CREATE POLICY "no_manual_activity_updates" ON activity_feed
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "no_manual_activity_deletes" ON activity_feed
    FOR DELETE
    TO authenticated
    USING (false);

-- Enhanced Notifications policies
CREATE POLICY "users_can_view_own_notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "system_can_create_notifications" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "users_can_update_own_notifications" ON notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_notifications" ON notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Enhanced User Achievements policies
CREATE POLICY "users_can_view_all_achievements" ON user_achievements
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "system_can_create_achievements" ON user_achievements
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "no_manual_achievement_changes" ON user_achievements
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "no_manual_achievement_deletes" ON user_achievements
    FOR DELETE
    TO authenticated
    USING (false);

-- Enhanced User Favorites policies
CREATE POLICY "users_can_view_own_favorites" ON user_favorites
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_favorites" ON user_favorites
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM problems 
            WHERE id = problem_id AND status = 'active'
        )
    );

CREATE POLICY "users_can_delete_own_favorites" ON user_favorites
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Enhanced User Follows policies
CREATE POLICY "users_can_view_follow_relationships" ON user_follows
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "users_can_create_own_follows" ON user_follows
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = follower_id AND
        follower_id != following_id
    );

CREATE POLICY "users_can_delete_own_follows" ON user_follows
    FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);

-- Security functions for additional validation
CREATE OR REPLACE FUNCTION validate_user_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Check daily problem creation limit
    IF TG_TABLE_NAME = 'problems' AND TG_OP = 'INSERT' THEN
        IF (
            SELECT COUNT(*) 
            FROM problems 
            WHERE user_id = NEW.user_id 
            AND created_at > NOW() - INTERVAL '24 hours'
        ) >= 5 THEN
            RAISE EXCEPTION 'Daily problem creation limit exceeded';
        END IF;
    END IF;

    -- Check hourly vote limit
    IF TG_TABLE_NAME = 'votes' AND TG_OP = 'INSERT' THEN
        IF (
            SELECT COUNT(*) 
            FROM votes 
            WHERE user_id = NEW.user_id 
            AND created_at > NOW() - INTERVAL '1 hour'
        ) >= 20 THEN
            RAISE EXCEPTION 'Hourly voting limit exceeded';
        END IF;
    END IF;

    -- Check comment rate limit
    IF TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT' THEN
        IF (
            SELECT COUNT(*) 
            FROM comments 
            WHERE user_id = NEW.user_id 
            AND created_at > NOW() - INTERVAL '1 hour'
        ) >= 10 THEN
            RAISE EXCEPTION 'Hourly comment limit exceeded';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for rate limiting
DROP TRIGGER IF EXISTS validate_problem_rate_limits ON problems;
CREATE TRIGGER validate_problem_rate_limits
    BEFORE INSERT ON problems
    FOR EACH ROW EXECUTE FUNCTION validate_user_rate_limits();

DROP TRIGGER IF EXISTS validate_vote_rate_limits ON votes;
CREATE TRIGGER validate_vote_rate_limits
    BEFORE INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION validate_user_rate_limits();

DROP TRIGGER IF EXISTS validate_comment_rate_limits ON comments;
CREATE TRIGGER validate_comment_rate_limits
    BEFORE INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION validate_user_rate_limits();

-- Content validation function
CREATE OR REPLACE FUNCTION validate_content_safety()
RETURNS TRIGGER AS $$
BEGIN
    -- Basic content validation for problems
    IF TG_TABLE_NAME = 'problems' THEN
        -- Check for minimum content quality
        IF LENGTH(TRIM(NEW.title)) < 10 THEN
            RAISE EXCEPTION 'Problem title must be at least 10 characters';
        END IF;
        
        IF LENGTH(TRIM(NEW.description)) < 50 THEN
            RAISE EXCEPTION 'Problem description must be at least 50 characters';
        END IF;
        
        -- Basic spam detection (simple keyword check)
        IF NEW.title ~* '(spam|scam|hack|virus|malware)' OR 
           NEW.description ~* '(spam|scam|hack|virus|malware)' THEN
            RAISE EXCEPTION 'Content flagged for review';
        END IF;
    END IF;

    -- Content validation for comments
    IF TG_TABLE_NAME = 'comments' THEN
        IF LENGTH(TRIM(NEW.content)) < 10 THEN
            RAISE EXCEPTION 'Comment must be at least 10 characters';
        END IF;
        
        -- Basic spam detection
        IF NEW.content ~* '(spam|scam|hack|virus|malware)' THEN
            RAISE EXCEPTION 'Comment flagged for review';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for content validation
DROP TRIGGER IF EXISTS validate_problem_content ON problems;
CREATE TRIGGER validate_problem_content
    BEFORE INSERT OR UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION validate_content_safety();

DROP TRIGGER IF EXISTS validate_comment_content ON comments;
CREATE TRIGGER validate_comment_content
    BEFORE INSERT OR UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION validate_content_safety();

-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "admins_can_view_audit_logs" ON security_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs
CREATE POLICY "system_can_insert_audit_logs" ON security_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Audit logging function
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    action_val TEXT;
BEGIN
    -- Determine user ID and action
    IF TG_OP = 'INSERT' THEN
        user_id_val := NEW.user_id;
        action_val := 'CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        user_id_val := NEW.user_id;
        action_val := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        user_id_val := OLD.user_id;
        action_val := 'DELETE';
    END IF;

    -- Log the event
    INSERT INTO security_audit_log (
        user_id, 
        action, 
        resource_type, 
        resource_id, 
        metadata
    ) VALUES (
        user_id_val,
        action_val,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'timestamp', NOW()
        )
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_problems_changes
    AFTER INSERT OR UPDATE OR DELETE ON problems
    FOR EACH ROW EXECUTE FUNCTION log_security_event();

CREATE TRIGGER audit_votes_changes
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION log_security_event();

-- Grant necessary permissions
GRANT SELECT ON security_audit_log TO authenticated;
GRANT INSERT ON security_audit_log TO authenticated;

-- Create indexes for audit log performance
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX idx_security_audit_log_resource_type ON security_audit_log(resource_type);