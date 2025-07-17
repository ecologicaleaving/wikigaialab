# Manual SQL Execution for Epic 3 Story 3.3

Since Supabase Cloud doesn't allow programmatic schema changes, these SQL statements need to be executed manually in the Supabase Dashboard.

## Instructions

1. Go to: https://jgivhyalioldfelngboi.supabase.co/project/jgivhyalioldfelngboi
2. Navigate to **SQL Editor**
3. Execute the following SQL statements in order:

## Step 1: Add Content Management Fields to Problems Table

```sql
-- Add moderation and featured content fields to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint for moderated_by
ALTER TABLE problems ADD CONSTRAINT IF NOT EXISTS fk_problems_moderated_by 
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add constraint for moderation_status
ALTER TABLE problems ADD CONSTRAINT IF NOT EXISTS problems_moderation_status_valid 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'needs_changes'));
```

## Step 2: Enhance Categories Table

```sql
-- Add management fields to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'folder';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#6B7280';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE categories ADD COLUMN IF NOT EXISTS problems_count INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;
```

## Step 3: Create Content Collections Tables

```sql
-- Content collections table for featured content curation
CREATE TABLE IF NOT EXISTS content_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT content_collections_name_length CHECK (length(name) >= 2 AND length(name) <= 100)
);

-- Junction table for problems in collections
CREATE TABLE IF NOT EXISTS collection_problems (
    collection_id UUID REFERENCES content_collections(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    
    PRIMARY KEY (collection_id, problem_id)
);
```

## Step 4: Create Analytics and Audit Tables

```sql
-- Category analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS category_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    problems_added INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, date)
);

-- Category history for audit trails
CREATE TABLE IF NOT EXISTS category_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT category_history_action_valid CHECK (action IN ('created', 'updated', 'deleted', 'merged', 'migrated'))
);

-- Admin activity log for content management actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT admin_activity_action_valid CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'feature', 'moderate')),
    CONSTRAINT admin_activity_resource_valid CHECK (resource_type IN ('problem', 'category', 'collection', 'user'))
);
```

## Step 5: Create Performance Indexes

```sql
-- Problems moderation indexes
CREATE INDEX IF NOT EXISTS idx_problems_moderation_status ON problems(moderation_status);
CREATE INDEX IF NOT EXISTS idx_problems_moderated_by ON problems(moderated_by);
CREATE INDEX IF NOT EXISTS idx_problems_is_featured ON problems(is_featured);
CREATE INDEX IF NOT EXISTS idx_problems_featured_until ON problems(featured_until);

-- Categories enhancement indexes
CREATE INDEX IF NOT EXISTS idx_categories_problems_count ON categories(problems_count DESC);
CREATE INDEX IF NOT EXISTS idx_categories_last_used_at ON categories(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON categories USING GIN(keywords);

-- Content collections indexes
CREATE INDEX IF NOT EXISTS idx_content_collections_created_by ON content_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_content_collections_is_active ON content_collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collection_problems_display_order ON collection_problems(collection_id, display_order);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_category_analytics_date ON category_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_category_analytics_category_date ON category_analytics(category_id, date DESC);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_category_history_category_id ON category_history(category_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource ON admin_activity_log(resource_type, resource_id);

-- Composite indexes for complex admin queries
CREATE INDEX IF NOT EXISTS idx_problems_moderation_created ON problems(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_featured_active ON problems(is_featured, featured_until) WHERE is_featured = true;
```

## Step 6: Update Existing Data

```sql
-- Update existing problems to approved status
UPDATE problems SET moderation_status = 'approved', moderated_at = created_at WHERE moderation_status IS NULL;

-- Enhance categories with icons, colors, and keywords
UPDATE categories SET 
    icon_name = 'laptop',
    color_hex = '#3B82F6',
    keywords = ARRAY['AI', 'app', 'software', 'digital', 'automazione', 'tech', 'sviluppo', 'programmazione', 'innovazione', 'startup']
WHERE name = 'Tecnologia';

UPDATE categories SET 
    icon_name = 'leaf',
    color_hex = '#10B981',
    keywords = ARRAY['sostenibile', 'green', 'rifiuti', 'energia', 'clima', 'ambiente', 'ecologia', 'rinnovabile', 'inquinamento', 'natura']
WHERE name = 'Ambiente';

UPDATE categories SET 
    icon_name = 'users',
    color_hex = '#F59E0B',
    keywords = ARRAY['comunità', 'volontariato', 'sociale', 'charity', 'solidarietà', 'integrazione', 'inclusione', 'cittadinanza', 'partecipazione']
WHERE name = 'Sociale';

UPDATE categories SET 
    icon_name = 'trending-up',
    color_hex = '#EF4444',
    keywords = ARRAY['business', 'finanza', 'startup', 'mercato', 'impresa', 'economia', 'investimenti', 'lavoro', 'commercio', 'sviluppo']
WHERE name = 'Economia';

UPDATE categories SET 
    icon_name = 'heart',
    color_hex = '#8B5CF6',
    keywords = ARRAY['salute', 'fitness', 'medicina', 'benessere', 'sport', 'nutrizione', 'prevenzione', 'cura', 'mentale', 'fisico']
WHERE name = 'Salute';

-- Initialize category problems_count with actual counts
UPDATE categories SET problems_count = (
    SELECT COUNT(*) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);

-- Update category last_used_at with most recent problem creation
UPDATE categories SET last_used_at = (
    SELECT MAX(created_at) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);
```

## Step 7: Create Admin User and Sample Collections

```sql
-- Create an admin user for content management
INSERT INTO users (id, email, name, is_admin, created_at, last_login_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@wikigaialab.com',
    'WikiGaiaLab Admin',
    true,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Create featured content collections
INSERT INTO content_collections (name, description, created_by, is_active) VALUES
('Problemi in Evidenza', 'Selezione curata dei problemi più innovativi e impattanti della piattaforma', '00000000-0000-0000-0000-000000000001', true),
('Startup del Mese', 'Problemi con potenziale di diventare startup di successo', '00000000-0000-0000-0000-000000000001', true),
('Soluzioni Verdi', 'Raccolta di problemi focalizzati sulla sostenibilità ambientale', '00000000-0000-0000-0000-000000000001', true);
```

## Verification

After executing all the steps, verify the changes by running:

```sql
-- Check new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'problems' 
AND column_name IN ('moderation_status', 'is_featured', 'moderated_by');

-- Check category enhancements
SELECT name, icon_name, color_hex, problems_count
FROM categories;

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('content_collections', 'category_analytics', 'admin_activity_log');
```

## Next Steps

Once these schema changes are applied, we can:
1. Update the TypeScript types
2. Build the admin dashboard UI
3. Implement content management API endpoints
4. Add rich seed data with diverse problems

Let me know when you've executed these SQL statements in the Supabase dashboard!