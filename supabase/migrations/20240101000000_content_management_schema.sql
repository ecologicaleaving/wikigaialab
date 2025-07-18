-- Content Management & Pre-population Schema
-- Story 4.2: Content Management & Pre-population

-- Content moderation flags and reports
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  flagger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'inappropriate', 'duplicate', 'misleading', 'off-topic', 'quality')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  moderator_id UUID REFERENCES users(id),
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(problem_id, flagger_id, flag_type)
);

-- Content moderation actions log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'feature', 'unfeature', 'flag', 'unflag', 'hide', 'restore')),
  reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured content management
CREATE TABLE IF NOT EXISTS featured_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  featured_by UUID NOT NULL REFERENCES users(id),
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  category_id UUID REFERENCES categories(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content quality metrics
CREATE TABLE IF NOT EXISTS content_quality_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  quality_score NUMERIC(5,2) DEFAULT 0.00 CHECK (quality_score >= 0 AND quality_score <= 100),
  readability_score NUMERIC(5,2) DEFAULT 0.00,
  engagement_score NUMERIC(5,2) DEFAULT 0.00,
  completeness_score NUMERIC(5,2) DEFAULT 0.00,
  uniqueness_score NUMERIC(5,2) DEFAULT 0.00,
  spam_probability NUMERIC(5,2) DEFAULT 0.00 CHECK (spam_probability >= 0 AND spam_probability <= 1),
  duplicate_problem_id UUID REFERENCES problems(id),
  similarity_score NUMERIC(5,2) DEFAULT 0.00,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics_version INTEGER DEFAULT 1
);

-- Bulk import logs
CREATE TABLE IF NOT EXISTS content_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_by UUID NOT NULL REFERENCES users(id),
  import_type TEXT NOT NULL CHECK (import_type IN ('csv', 'json', 'api')),
  file_name TEXT,
  file_size BIGINT,
  total_records INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  error_log JSONB DEFAULT '[]',
  success_log JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Content collections for organization
CREATE TABLE IF NOT EXISTS content_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  category_filter UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection membership
CREATE TABLE IF NOT EXISTS collection_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES content_collections(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES users(id),
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, problem_id)
);

-- Content analytics tracking
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('view', 'vote', 'share', 'comment', 'flag', 'feature_click')),
  metric_value NUMERIC DEFAULT 1,
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_flags_problem_id ON content_flags(problem_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_created_at ON content_flags(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_problem_id ON moderation_actions(problem_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_featured_content_active ON featured_content(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_content_category ON featured_content(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_content_order ON featured_content(display_order);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_problem_id ON content_quality_metrics(problem_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_quality_score ON content_quality_metrics(quality_score);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_spam ON content_quality_metrics(spam_probability);

CREATE INDEX IF NOT EXISTS idx_content_imports_status ON content_imports(status);
CREATE INDEX IF NOT EXISTS idx_content_imports_created_at ON content_imports(started_at);

CREATE INDEX IF NOT EXISTS idx_content_analytics_problem_id ON content_analytics(problem_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_metric_type ON content_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_recorded_at ON content_analytics(recorded_at);

-- Add moderation_status to problems if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE problems ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add is_featured to problems if it doesn't exist  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE problems ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add quality_score to problems if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE problems ADD COLUMN quality_score NUMERIC(5,2) DEFAULT 0.00;
  END IF;
END $$;

-- Update existing problems to have approved status
UPDATE problems 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL OR moderation_status = '';

-- Functions for content management

-- Function to calculate content quality score
CREATE OR REPLACE FUNCTION calculate_content_quality_score(problem_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  title_length INTEGER;
  description_length INTEGER;
  vote_count INTEGER;
  days_since_creation INTEGER;
  quality_score NUMERIC := 0;
BEGIN
  SELECT 
    LENGTH(title),
    LENGTH(description),
    COALESCE(vote_count, 0),
    EXTRACT(DAYS FROM NOW() - created_at)
  INTO title_length, description_length, vote_count, days_since_creation
  FROM problems WHERE id = problem_id;
  
  -- Base score from content completeness
  quality_score := CASE 
    WHEN title_length >= 10 AND description_length >= 50 THEN 40
    WHEN title_length >= 5 AND description_length >= 20 THEN 25
    ELSE 10
  END;
  
  -- Add engagement score
  quality_score := quality_score + LEAST(vote_count * 2, 30);
  
  -- Add freshness score
  IF days_since_creation <= 7 THEN
    quality_score := quality_score + 10;
  ELSIF days_since_creation <= 30 THEN
    quality_score := quality_score + 5;
  END IF;
  
  -- Ensure score is between 0-100
  RETURN LEAST(GREATEST(quality_score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Function to detect potential duplicates
CREATE OR REPLACE FUNCTION detect_content_duplicates(problem_id UUID)
RETURNS TABLE(duplicate_id UUID, similarity_score NUMERIC) AS $$
DECLARE
  target_title TEXT;
  target_description TEXT;
BEGIN
  SELECT title, description INTO target_title, target_description
  FROM problems WHERE id = problem_id;
  
  RETURN QUERY
  SELECT 
    p.id,
    -- Simple similarity based on title matching (can be enhanced with full-text search)
    CASE 
      WHEN SIMILARITY(p.title, target_title) > 0.6 THEN SIMILARITY(p.title, target_title)
      WHEN SIMILARITY(p.description, target_description) > 0.5 THEN SIMILARITY(p.description, target_description)
      ELSE 0
    END as similarity_score
  FROM problems p
  WHERE p.id != problem_id
    AND p.moderation_status = 'approved'
    AND (
      SIMILARITY(p.title, target_title) > 0.6 
      OR SIMILARITY(p.description, target_description) > 0.5
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update quality metrics when problems change
CREATE OR REPLACE FUNCTION update_quality_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_quality_metrics (
    problem_id,
    quality_score,
    calculated_at
  ) VALUES (
    NEW.id,
    calculate_content_quality_score(NEW.id),
    NOW()
  ) ON CONFLICT (problem_id) DO UPDATE SET
    quality_score = calculate_content_quality_score(NEW.id),
    calculated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quality_metrics_trigger') THEN
    CREATE TRIGGER update_quality_metrics_trigger
      AFTER INSERT OR UPDATE OF title, description, vote_count
      ON problems
      FOR EACH ROW
      EXECUTE FUNCTION update_quality_metrics();
  END IF;
END $$;

-- RLS Policies for content management tables

-- Content flags policies
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flags" ON content_flags
  FOR SELECT USING (auth.uid() = flagger_id);

CREATE POLICY "Users can create flags" ON content_flags
  FOR INSERT WITH CHECK (auth.uid() = flagger_id);

CREATE POLICY "Admins can view all flags" ON content_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Moderation actions policies
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation actions" ON moderation_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Featured content policies
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active featured content" ON featured_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage featured content" ON featured_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Content quality metrics policies
ALTER TABLE content_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view quality metrics" ON content_quality_metrics
  FOR SELECT USING (true);

CREATE POLICY "System can update quality metrics" ON content_quality_metrics
  FOR ALL USING (true);

-- Content imports policies
ALTER TABLE content_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage imports" ON content_imports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Content collections policies
ALTER TABLE content_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active collections" ON content_collections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage collections" ON content_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Collection problems policies
ALTER TABLE collection_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view collection problems" ON collection_problems
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collection problems" ON collection_problems
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Content analytics policies
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON content_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics" ON content_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" ON content_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Enable the pg_trgm extension for similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Seed data for initial content collections
INSERT INTO content_collections (name, description, created_by, is_featured, display_order) 
SELECT 
  'Featured Problems',
  'Curated collection of high-quality, engaging problems',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1),
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM content_collections WHERE name = 'Featured Problems');

INSERT INTO content_collections (name, description, created_by, is_featured, display_order)
SELECT 
  'New & Trending',
  'Recently submitted problems gaining traction',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1),
  true,
  2
WHERE NOT EXISTS (SELECT 1 FROM content_collections WHERE name = 'New & Trending');

INSERT INTO content_collections (name, description, created_by, is_featured, display_order)
SELECT 
  'Community Favorites',
  'Most voted and discussed problems',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1),
  true,
  3
WHERE NOT EXISTS (SELECT 1 FROM content_collections WHERE name = 'Community Favorites');