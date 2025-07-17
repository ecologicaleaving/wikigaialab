-- WikiGaiaLab Seed Data v1.0
-- Migration 004: Initial seed data for development and testing
-- Author: James (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Insert initial categories
INSERT INTO categories (id, name, description, order_index, is_active) VALUES
    (gen_random_uuid(), 'Technology', 'Problems related to technology, software, and digital solutions', 1, true),
    (gen_random_uuid(), 'Environment', 'Environmental issues, sustainability, and green initiatives', 2, true),
    (gen_random_uuid(), 'Health', 'Healthcare, wellness, and medical challenges', 3, true),
    (gen_random_uuid(), 'Education', 'Educational system improvements and learning challenges', 4, true),
    (gen_random_uuid(), 'Transportation', 'Transportation, logistics, and mobility solutions', 5, true),
    (gen_random_uuid(), 'Social Issues', 'Community problems, social inequality, and civic engagement', 6, true),
    (gen_random_uuid(), 'Economics', 'Financial systems, economic inequality, and market issues', 7, true),
    (gen_random_uuid(), 'Communication', 'Communication barriers, information access, and media', 8, true),
    (gen_random_uuid(), 'Safety', 'Public safety, security, and emergency preparedness', 9, true),
    (gen_random_uuid(), 'Other', 'Miscellaneous problems that don''t fit other categories', 10, true)
ON CONFLICT (name) DO NOTHING;

-- Create a demo admin user (for development only)
INSERT INTO users (id, email, name, avatar_url, is_admin, subscription_status, created_at) VALUES
    (gen_random_uuid(), 'admin@wikigaialab.com', 'Admin User', 'https://avatars.githubusercontent.com/u/1?v=4', true, 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- Create demo regular users
INSERT INTO users (id, email, name, avatar_url, is_admin, subscription_status, created_at) VALUES
    (gen_random_uuid(), 'user1@example.com', 'Alice Johnson', 'https://avatars.githubusercontent.com/u/2?v=4', false, 'free', NOW()),
    (gen_random_uuid(), 'user2@example.com', 'Bob Smith', 'https://avatars.githubusercontent.com/u/3?v=4', false, 'active', NOW()),
    (gen_random_uuid(), 'user3@example.com', 'Carol Davis', 'https://avatars.githubusercontent.com/u/4?v=4', false, 'free', NOW()),
    (gen_random_uuid(), 'user4@example.com', 'David Wilson', 'https://avatars.githubusercontent.com/u/5?v=4', false, 'trialing', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert demo problems (only if categories exist)
DO $$
DECLARE
    tech_cat_id UUID;
    env_cat_id UUID;
    health_cat_id UUID;
    edu_cat_id UUID;
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    problem1_id UUID;
    problem2_id UUID;
    problem3_id UUID;
    problem4_id UUID;
    problem5_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO tech_cat_id FROM categories WHERE name = 'Technology';
    SELECT id INTO env_cat_id FROM categories WHERE name = 'Environment';
    SELECT id INTO health_cat_id FROM categories WHERE name = 'Health';
    SELECT id INTO edu_cat_id FROM categories WHERE name = 'Education';
    
    -- Get user IDs
    SELECT id INTO user1_id FROM users WHERE email = 'user1@example.com';
    SELECT id INTO user2_id FROM users WHERE email = 'user2@example.com';
    SELECT id INTO user3_id FROM users WHERE email = 'user3@example.com';
    
    -- Temporarily disable auto-vote trigger for seeding
    ALTER TABLE problems DISABLE TRIGGER trigger_auto_vote_on_problem_creation;
    
    -- Insert problems if categories and users exist
    IF tech_cat_id IS NOT NULL AND user1_id IS NOT NULL THEN
        problem1_id := gen_random_uuid();
        INSERT INTO problems (id, proposer_id, title, description, category_id, status, vote_count, created_at) VALUES
            (problem1_id, user1_id, 'Better Password Management for Everyone', 'Most people struggle with creating and remembering secure passwords. We need a simple, free solution that works across all devices and doesn''t require technical knowledge.', tech_cat_id, 'Proposed', 0, NOW() - INTERVAL '2 days');
    END IF;
    
    IF env_cat_id IS NOT NULL AND user2_id IS NOT NULL THEN
        problem2_id := gen_random_uuid();
        INSERT INTO problems (id, proposer_id, title, description, category_id, status, vote_count, created_at) VALUES
            (problem2_id, user2_id, 'Reduce Food Waste in Restaurants', 'Restaurants throw away tons of perfectly good food daily. We need a system to connect restaurants with food banks and individuals who could use surplus food.', env_cat_id, 'In Development', 0, NOW() - INTERVAL '1 day');
    END IF;
    
    IF health_cat_id IS NOT NULL AND user3_id IS NOT NULL THEN
        problem3_id := gen_random_uuid();
        INSERT INTO problems (id, proposer_id, title, description, category_id, status, vote_count, created_at) VALUES
            (problem3_id, user3_id, 'Mental Health Support for Remote Workers', 'Remote workers often struggle with isolation and mental health issues. We need accessible, affordable mental health resources specifically designed for remote work challenges.', health_cat_id, 'Proposed', 0, NOW() - INTERVAL '3 hours');
    END IF;
    
    IF edu_cat_id IS NOT NULL AND user1_id IS NOT NULL THEN
        problem4_id := gen_random_uuid();
        INSERT INTO problems (id, proposer_id, title, description, category_id, status, vote_count, created_at) VALUES
            (problem4_id, user1_id, 'Free Coding Education for Underserved Communities', 'Many talented individuals lack access to quality coding education due to economic barriers. We need free, comprehensive coding bootcamps in underserved communities.', edu_cat_id, 'Proposed', 0, NOW() - INTERVAL '6 hours');
    END IF;
    
    IF tech_cat_id IS NOT NULL AND user2_id IS NOT NULL THEN
        problem5_id := gen_random_uuid();
        INSERT INTO problems (id, proposer_id, title, description, category_id, status, vote_count, created_at) VALUES
            (problem5_id, user2_id, 'Digital Privacy Protection Made Simple', 'Most people don''t understand how to protect their digital privacy. We need user-friendly tools and education to help regular users protect their personal data online.', tech_cat_id, 'Completed', 0, NOW() - INTERVAL '1 week');
    END IF;
    
    -- Re-enable auto-vote trigger
    ALTER TABLE problems ENABLE TRIGGER trigger_auto_vote_on_problem_creation;
END $$;

-- Add some cross-voting between users (simulating real usage)
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    user4_id UUID;
    problem_ids UUID[];
    current_problem_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO user1_id FROM users WHERE email = 'user1@example.com';
    SELECT id INTO user2_id FROM users WHERE email = 'user2@example.com';
    SELECT id INTO user3_id FROM users WHERE email = 'user3@example.com';
    SELECT id INTO user4_id FROM users WHERE email = 'user4@example.com';
    
    -- Get all problem IDs
    SELECT ARRAY(SELECT id FROM problems) INTO problem_ids;
    
    -- Add some votes (excluding self-votes which are automatically created)
    FOREACH current_problem_id IN ARRAY problem_ids LOOP
        -- User1 votes on problems not created by them
        IF NOT EXISTS (SELECT 1 FROM problems WHERE id = current_problem_id AND proposer_id = user1_id) THEN
            INSERT INTO votes (user_id, problem_id, created_at) VALUES
                (user1_id, current_problem_id, NOW() - INTERVAL '1 hour')
            ON CONFLICT (user_id, problem_id) DO NOTHING;
        END IF;
        
        -- User2 votes on some problems
        IF NOT EXISTS (SELECT 1 FROM problems WHERE id = current_problem_id AND proposer_id = user2_id) 
           AND random() > 0.5 THEN
            INSERT INTO votes (user_id, problem_id, created_at) VALUES
                (user2_id, current_problem_id, NOW() - INTERVAL '2 hours')
            ON CONFLICT (user_id, problem_id) DO NOTHING;
        END IF;
        
        -- User3 votes on most problems
        IF NOT EXISTS (SELECT 1 FROM problems WHERE id = current_problem_id AND proposer_id = user3_id) 
           AND random() > 0.3 THEN
            INSERT INTO votes (user_id, problem_id, created_at) VALUES
                (user3_id, current_problem_id, NOW() - INTERVAL '30 minutes')
            ON CONFLICT (user_id, problem_id) DO NOTHING;
        END IF;
        
        -- User4 votes on few problems
        IF NOT EXISTS (SELECT 1 FROM problems WHERE id = current_problem_id AND proposer_id = user4_id) 
           AND random() > 0.7 THEN
            INSERT INTO votes (user_id, problem_id, created_at) VALUES
                (user4_id, current_problem_id, NOW() - INTERVAL '15 minutes')
            ON CONFLICT (user_id, problem_id) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Update vote counts for all problems based on actual votes
    UPDATE problems SET vote_count = (
        SELECT COUNT(*) FROM votes WHERE votes.problem_id = problems.id
    );
END $$;

-- Create a demo app for the completed problem
DO $$
DECLARE
    completed_problem_id UUID;
BEGIN
    SELECT id INTO completed_problem_id FROM problems WHERE status = 'Completed' LIMIT 1;
    
    IF completed_problem_id IS NOT NULL THEN
        INSERT INTO apps (id, problem_id, name, description, base_features, premium_features, access_model, slug, is_published, version, created_at) VALUES
            (gen_random_uuid(), completed_problem_id, 'PrivacyGuard', 'Simple digital privacy protection for everyone', 
             '["Basic privacy scanner", "Cookie blocker", "Simple VPN"]'::jsonb, 
             '["Advanced threat detection", "Family protection", "Business features"]'::jsonb,
             'freemium', 'privacy-guard', true, '1.0.0', NOW() - INTERVAL '2 days');
    END IF;
END $$;

COMMIT;