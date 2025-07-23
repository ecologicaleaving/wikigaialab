-- Clean Database Script - Remove all test/fake data
-- Run this in Supabase SQL Editor

-- Step 1: Delete all votes (no foreign key dependencies)
DELETE FROM votes;

-- Step 2: Delete all problems (referenced by votes, but we deleted those)
DELETE FROM problems;

-- Step 3: Delete all users (now safe since problems are gone)
DELETE FROM users;

-- Step 4: Delete any other test data if it exists
DELETE FROM apps WHERE id IS NOT NULL;
DELETE FROM categories WHERE name LIKE '%test%' OR name IN ('Ambiente', 'Mobilità', 'Energia', 'Sociale');

-- Step 5: Insert essential categories (these are needed for the app to work)
INSERT INTO categories (id, name, description, order_index, is_active) VALUES
  ('a1b2c3d4-e5f6-4890-ab12-cd34ef567890', 'Ambiente', 'Problemi legati all''ambiente e sostenibilità', 1, true),
  ('b2c3d4e5-f6a7-4901-bc23-de45af678901', 'Mobilità', 'Trasporti e mobilità urbana', 2, true),
  ('c3d4e5f6-a7b8-4012-cd34-ef56ab789012', 'Energia', 'Efficienza energetica e fonti rinnovabili', 3, true),
  ('d4e5f6a7-b8c9-4123-de45-fa67bc890123', 'Sociale', 'Problemi sociali e comunitari', 4, true),
  ('e5f6a7b8-c9d0-4234-ef56-gb78cd901234', 'Tecnologia', 'Innovazione e soluzioni tecnologiche', 5, true),
  ('f6a7b8c9-d0e1-4345-fa67-hc89de012345', 'Economia', 'Sviluppo economico sostenibile', 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

-- Step 6: Verify the cleanup
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'problems' as table_name, COUNT(*) as count FROM problems  
UNION ALL
SELECT 'votes' as table_name, COUNT(*) as count FROM votes
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'apps' as table_name, COUNT(*) as count FROM apps;

-- Expected result: all counts should be 0 except categories should be 6