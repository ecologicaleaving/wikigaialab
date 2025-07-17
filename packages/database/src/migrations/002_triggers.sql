-- WikiGaiaLab Database Triggers v1.0
-- Migration 002: Database triggers for real-time updates and data consistency
-- Author: James (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update problem vote count and user statistics
CREATE OR REPLACE FUNCTION update_problem_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment vote count on problem
        UPDATE problems 
        SET vote_count = vote_count + 1, updated_at = NOW()
        WHERE id = NEW.problem_id;
        
        -- Increment user's total votes cast
        UPDATE users 
        SET total_votes_cast = total_votes_cast + 1, updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement vote count on problem
        UPDATE problems 
        SET vote_count = vote_count - 1, updated_at = NOW()
        WHERE id = OLD.problem_id;
        
        -- Decrement user's total votes cast
        UPDATE users 
        SET total_votes_cast = total_votes_cast - 1, updated_at = NOW()
        WHERE id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update user's problem count
CREATE OR REPLACE FUNCTION update_user_problem_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment user's total problems proposed
        UPDATE users 
        SET total_problems_proposed = total_problems_proposed + 1, updated_at = NOW()
        WHERE id = NEW.proposer_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement user's total problems proposed
        UPDATE users 
        SET total_problems_proposed = total_problems_proposed - 1, updated_at = NOW()
        WHERE id = OLD.proposer_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent self-voting (user cannot vote on their own problems)
CREATE OR REPLACE FUNCTION prevent_self_voting()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM problems 
        WHERE id = NEW.problem_id 
        AND proposer_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Users cannot vote on their own problems';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-increment proposer's vote on problem creation
CREATE OR REPLACE FUNCTION auto_vote_on_problem_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically create a vote for the proposer when they create a problem
    INSERT INTO votes (user_id, problem_id, created_at)
    VALUES (NEW.proposer_id, NEW.id, NEW.created_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamp
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_apps_updated_at
    BEFORE UPDATE ON apps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for vote count updates
CREATE TRIGGER trigger_update_vote_count
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_problem_vote_count();

-- Create trigger for user problem count updates
CREATE TRIGGER trigger_update_user_problem_count
    AFTER INSERT OR DELETE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_user_problem_count();

-- Create trigger to prevent self-voting
CREATE TRIGGER trigger_prevent_self_voting
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_voting();

-- Create trigger for auto-voting on problem creation
CREATE TRIGGER trigger_auto_vote_on_problem_creation
    AFTER INSERT ON problems
    FOR EACH ROW
    EXECUTE FUNCTION auto_vote_on_problem_creation();

COMMIT;