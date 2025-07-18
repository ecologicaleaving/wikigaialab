-- Atomic vote count update function
-- Phase 1 Fix: Database performance optimization

CREATE OR REPLACE FUNCTION update_vote_count_atomic(
    problem_id UUID,
    increment_by INTEGER
)
RETURNS TABLE(new_vote_count INTEGER) AS $$
DECLARE
    current_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Use SELECT FOR UPDATE to lock the row and prevent race conditions
    SELECT vote_count INTO current_count
    FROM problems
    WHERE id = problem_id
    FOR UPDATE;

    -- Check if problem exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Problem not found: %', problem_id;
    END IF;

    -- Calculate new count, ensuring it doesn't go below 0
    new_count := GREATEST(0, current_count + increment_by);

    -- Update the vote count
    UPDATE problems
    SET 
        vote_count = new_count,
        updated_at = NOW()
    WHERE id = problem_id;

    -- Return the new count
    RETURN QUERY SELECT new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;