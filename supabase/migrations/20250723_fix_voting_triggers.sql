-- Migration: Fix Voting Triggers - Separate Creator Interest from Community Votes
-- Date: 2025-07-23
-- Purpose: Resolve P0001 conflict between auto-vote and prevent-self-voting triggers

-- STEP 1: Add vote_type column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_type TEXT DEFAULT 'community';

-- Add constraint to ensure only valid vote types
ALTER TABLE votes ADD CONSTRAINT vote_type_check 
CHECK (vote_type IN ('community', 'creator_interest'));

-- STEP 2: Update existing votes to be 'community' type (they're all community votes)
UPDATE votes SET vote_type = 'community' WHERE vote_type IS NULL;

-- STEP 3: Drop existing problematic triggers
DROP TRIGGER IF EXISTS trigger_prevent_self_voting ON votes;
DROP TRIGGER IF EXISTS trigger_auto_vote_on_problem_creation ON problems;

-- STEP 4: Create improved prevent_self_voting function
CREATE OR REPLACE FUNCTION prevent_self_voting()
RETURNS TRIGGER AS $$
BEGIN
    -- Only prevent community votes on own problems
    -- Allow creator_interest votes (initial interest expression)
    IF NEW.vote_type = 'community' AND EXISTS (
        SELECT 1 FROM problems 
        WHERE id = NEW.problem_id 
        AND proposer_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Users cannot cast community votes on their own problems'
        USING ERRCODE = 'P0001';
    END IF;
    
    -- Prevent duplicate votes (same user, same problem, same type)
    IF EXISTS (
        SELECT 1 FROM votes 
        WHERE user_id = NEW.user_id 
        AND problem_id = NEW.problem_id 
        AND vote_type = NEW.vote_type
    ) THEN
        RAISE EXCEPTION 'User has already cast this type of vote on this problem'
        USING ERRCODE = 'P0002';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Create improved auto_vote_on_problem_creation function
CREATE OR REPLACE FUNCTION auto_vote_on_problem_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a creator_interest vote when problem is created
    INSERT INTO votes (user_id, problem_id, vote_type, created_at)
    VALUES (NEW.proposer_id, NEW.id, 'creator_interest', NEW.created_at);
    
    -- Update vote_count to reflect the creator interest vote
    UPDATE problems 
    SET vote_count = 1
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create rate limiting function (optional but recommended)
CREATE OR REPLACE FUNCTION check_vote_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent spam voting (max 10 votes per minute)
    IF (
        SELECT COUNT(*) 
        FROM votes 
        WHERE user_id = NEW.user_id 
        AND created_at > NOW() - INTERVAL '1 minute'
    ) > 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many votes in short period'
        USING ERRCODE = 'P0003';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Recreate triggers with improved functions
CREATE TRIGGER trigger_prevent_self_voting
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_voting();

CREATE TRIGGER trigger_auto_vote_on_problem_creation
    AFTER INSERT ON problems
    FOR EACH ROW
    EXECUTE FUNCTION auto_vote_on_problem_creation();

CREATE TRIGGER trigger_vote_rate_limit
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION check_vote_rate_limit();

-- STEP 8: Create function to update vote counts properly
CREATE OR REPLACE FUNCTION update_problem_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the problem's vote_count based on actual votes
    IF TG_OP = 'INSERT' THEN
        UPDATE problems 
        SET vote_count = (
            SELECT COUNT(*) 
            FROM votes 
            WHERE problem_id = NEW.problem_id
        )
        WHERE id = NEW.problem_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE problems 
        SET vote_count = (
            SELECT COUNT(*) 
            FROM votes 
            WHERE problem_id = OLD.problem_id
        )
        WHERE id = OLD.problem_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create trigger to maintain vote_count accuracy
CREATE TRIGGER trigger_update_vote_count
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_problem_vote_count();

-- STEP 10: Fix existing problems that may have incorrect vote_counts
UPDATE problems 
SET vote_count = (
    SELECT COUNT(*) 
    FROM votes 
    WHERE problem_id = problems.id
)
WHERE id IN (
    SELECT DISTINCT problem_id FROM votes
);

-- STEP 11: Add helpful comments for future developers
COMMENT ON COLUMN votes.vote_type IS 'Type of vote: creator_interest (initial interest from problem creator) or community (votes from other users)';
COMMENT ON FUNCTION prevent_self_voting() IS 'Prevents community votes on own problems while allowing creator interest votes';
COMMENT ON FUNCTION auto_vote_on_problem_creation() IS 'Automatically creates creator_interest vote when problem is created';
COMMENT ON FUNCTION check_vote_rate_limit() IS 'Rate limiting: max 10 votes per minute per user';

-- STEP 12: Create helpful view for vote analytics
CREATE OR REPLACE VIEW vote_analytics AS
SELECT 
    p.id as problem_id,
    p.title,
    p.proposer_id,
    COUNT(CASE WHEN v.vote_type = 'creator_interest' THEN 1 END) as creator_votes,
    COUNT(CASE WHEN v.vote_type = 'community' THEN 1 END) as community_votes,
    COUNT(*) as total_votes,
    p.vote_count as stored_vote_count
FROM problems p
LEFT JOIN votes v ON p.id = v.problem_id
GROUP BY p.id, p.title, p.proposer_id, p.vote_count;

-- Migration completed successfully
-- Next: Test problem creation - it should work now!