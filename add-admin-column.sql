-- Add is_admin column to users table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set dadecrescente@gmail.com as admin
UPDATE users 
SET is_admin = true 
WHERE email = 'dadecrescente@gmail.com';

-- Verify the changes
SELECT id, email, name, is_admin, created_at 
FROM users 
ORDER BY created_at DESC;