-- Community Growth Tools Schema
-- Story 4.5: Community Growth Tools

-- Referral system tables
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  source TEXT, -- 'email', 'social', 'direct', 'widget'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Referral rewards and tracking
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'premium_days', 'badges', 'features')),
  reward_value NUMERIC NOT NULL DEFAULT 0,
  reward_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'expired', 'cancelled')),
  granted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral analytics and tracking
CREATE TABLE IF NOT EXISTS referral_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('code_generated', 'link_clicked', 'page_viewed', 'signup_started', 'signup_completed', 'reward_earned')),
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social sharing optimization
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'email', 'copy', 'whatsapp')),
  share_url TEXT NOT NULL,
  share_title TEXT,
  share_description TEXT,
  share_image_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  session_id TEXT,
  referrer_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share tracking for analytics
CREATE TABLE IF NOT EXISTS share_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES social_shares(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('share_created', 'link_clicked', 'page_viewed', 'user_converted', 'engagement')),
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('votes', 'problems', 'referrals', 'engagement', 'reputation', 'streak')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  category_id UUID REFERENCES categories(id),
  category_filter TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  max_entries INTEGER DEFAULT 100,
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('sum', 'count', 'average', 'max', 'weighted')),
  weight_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  calculation_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id, period_start)
);

-- Engagement campaigns
CREATE TABLE IF NOT EXISTS engagement_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('challenge', 'contest', 'milestone', 'streak', 'referral_bonus')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'inactive_users', 'active_users', 'premium_users')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('votes', 'problems', 'referrals', 'engagement', 'retention')),
  goal_value NUMERIC NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'badges', 'premium_days', 'features', 'recognition')),
  reward_value NUMERIC NOT NULL DEFAULT 0,
  reward_data JSONB DEFAULT '{}',
  rules JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign participation tracking
CREATE TABLE IF NOT EXISTS campaign_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES engagement_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_progress NUMERIC DEFAULT 0,
  goal_reached BOOLEAN DEFAULT false,
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(campaign_id, user_id)
);

-- Email digest system
CREATE TABLE IF NOT EXISTS email_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('daily', 'weekly', 'monthly')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'disabled')),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, digest_type)
);

-- Email digest content and tracking
CREATE TABLE IF NOT EXISTS email_digest_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  problems_included UUID[],
  personalization_data JSONB DEFAULT '{}',
  send_status TEXT NOT NULL DEFAULT 'queued' CHECK (send_status IN ('queued', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Growth metrics tracking
CREATE TABLE IF NOT EXISTS growth_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('user_acquisition', 'user_retention', 'user_engagement', 'referral_conversion', 'social_sharing', 'email_performance')),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metric_unit TEXT NOT NULL DEFAULT 'count',
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cohort_data JSONB DEFAULT '{}',
  breakdown_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_type, metric_name, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

CREATE INDEX IF NOT EXISTS idx_referral_analytics_code ON referral_analytics(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_referrer_id ON referral_analytics(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_event_type ON referral_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_created_at ON referral_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_social_shares_problem_id ON social_shares(problem_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON social_shares(created_at);

CREATE INDEX IF NOT EXISTS idx_share_analytics_share_id ON share_analytics(share_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_event_type ON share_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_share_analytics_created_at ON share_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_active ON leaderboards(is_active);
CREATE INDEX IF NOT EXISTS idx_leaderboards_featured ON leaderboards(is_featured);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON leaderboard_entries(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_engagement_campaigns_status ON engagement_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_engagement_campaigns_dates ON engagement_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_engagement_campaigns_type ON engagement_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_user_id ON campaign_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_progress ON campaign_participants(current_progress);

CREATE INDEX IF NOT EXISTS idx_email_digests_user_id ON email_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digests_frequency ON email_digests(frequency);
CREATE INDEX IF NOT EXISTS idx_email_digests_next_send ON email_digests(next_send_at);

CREATE INDEX IF NOT EXISTS idx_email_digest_sends_user_id ON email_digest_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digest_sends_status ON email_digest_sends(send_status);
CREATE INDEX IF NOT EXISTS idx_email_digest_sends_sent_at ON email_digest_sends(sent_at);

CREATE INDEX IF NOT EXISTS idx_growth_metrics_type ON growth_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_name ON growth_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_period ON growth_metrics(period_start, period_end);

-- Functions for referral system

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || user_id::text || counter::text) from 1 for 8));
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM referrals WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    
    counter := counter + 1;
    IF counter >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check if user already has an active referral code
  SELECT referral_code INTO existing_code
  FROM referrals
  WHERE referrer_id = user_id
    AND status IN ('pending', 'completed')
    AND expires_at > NOW()
  LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code(user_id);
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referral_code, status, expires_at)
  VALUES (user_id, new_code, 'pending', NOW() + INTERVAL '30 days');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Process referral conversion
CREATE OR REPLACE FUNCTION process_referral_conversion(referral_code TEXT, referee_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referral_record RECORD;
  reward_points INTEGER := 100;
  premium_days INTEGER := 7;
BEGIN
  -- Find and update referral record
  SELECT * INTO referral_record
  FROM referrals
  WHERE referral_code = referral_code
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE referrals
  SET referee_id = referee_id,
      status = 'completed',
      converted_at = NOW()
  WHERE id = referral_record.id;
  
  -- Create rewards for referrer
  INSERT INTO referral_rewards (referral_id, referrer_id, referee_id, reward_type, reward_value, status)
  VALUES 
    (referral_record.id, referral_record.referrer_id, referee_id, 'points', reward_points, 'pending'),
    (referral_record.id, referral_record.referrer_id, referee_id, 'premium_days', premium_days, 'pending');
  
  -- Create rewards for referee
  INSERT INTO referral_rewards (referral_id, referrer_id, referee_id, reward_type, reward_value, status)
  VALUES 
    (referral_record.id, referral_record.referrer_id, referee_id, 'points', reward_points / 2, 'pending');
  
  -- Update user stats
  UPDATE users
  SET reputation_score = COALESCE(reputation_score, 0) + reward_points
  WHERE id = referral_record.referrer_id;
  
  UPDATE users
  SET reputation_score = COALESCE(reputation_score, 0) + (reward_points / 2)
  WHERE id = referee_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Calculate leaderboard rankings
CREATE OR REPLACE FUNCTION calculate_leaderboard_rankings(leaderboard_id UUID, period_start TIMESTAMP WITH TIME ZONE, period_end TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  leaderboard_record RECORD;
  user_record RECORD;
  ranking INTEGER := 1;
  entries_created INTEGER := 0;
BEGIN
  -- Get leaderboard configuration
  SELECT * INTO leaderboard_record
  FROM leaderboards
  WHERE id = leaderboard_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Clear existing entries for this period
  DELETE FROM leaderboard_entries
  WHERE leaderboard_id = leaderboard_id
    AND period_start <= period_end
    AND period_end >= period_start;
  
  -- Calculate scores based on leaderboard type
  FOR user_record IN (
    SELECT DISTINCT u.id, u.name
    FROM users u
    WHERE u.created_at <= period_end
  ) LOOP
    DECLARE
      user_score NUMERIC := 0;
      calculation_data JSONB := '{}';
    BEGIN
      -- Calculate score based on leaderboard type
      CASE leaderboard_record.type
        WHEN 'votes' THEN
          SELECT COUNT(*) INTO user_score
          FROM votes v
          WHERE v.user_id = user_record.id
            AND v.created_at BETWEEN period_start AND period_end;
          
        WHEN 'problems' THEN
          SELECT COUNT(*) INTO user_score
          FROM problems p
          WHERE p.user_id = user_record.id
            AND p.created_at BETWEEN period_start AND period_end
            AND p.moderation_status = 'approved';
          
        WHEN 'referrals' THEN
          SELECT COUNT(*) INTO user_score
          FROM referrals r
          WHERE r.referrer_id = user_record.id
            AND r.converted_at BETWEEN period_start AND period_end
            AND r.status = 'completed';
          
        WHEN 'engagement' THEN
          SELECT COUNT(DISTINCT DATE(ca.recorded_at)) INTO user_score
          FROM content_analytics ca
          WHERE ca.user_id = user_record.id
            AND ca.recorded_at BETWEEN period_start AND period_end;
          
        WHEN 'reputation' THEN
          SELECT COALESCE(reputation_score, 0) INTO user_score
          FROM users
          WHERE id = user_record.id;
          
        ELSE
          user_score := 0;
      END CASE;
      
      -- Only include users with positive scores
      IF user_score > 0 THEN
        INSERT INTO leaderboard_entries (
          leaderboard_id, user_id, rank, score, period_start, period_end, calculation_data
        ) VALUES (
          leaderboard_id, user_record.id, ranking, user_score, period_start, period_end, calculation_data
        );
        
        ranking := ranking + 1;
        entries_created := entries_created + 1;
        
        -- Limit entries if configured
        IF leaderboard_record.max_entries IS NOT NULL AND entries_created >= leaderboard_record.max_entries THEN
          EXIT;
        END IF;
      END IF;
    END;
  END LOOP;
  
  RETURN entries_created;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- Referrals policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create their own referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" ON referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Referral rewards policies
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can manage referral rewards" ON referral_rewards
  FOR ALL USING (true);

-- Social shares policies
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view social shares" ON social_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can create social shares" ON social_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own social shares" ON social_shares
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboards policies
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active leaderboards" ON leaderboards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage leaderboards" ON leaderboards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Leaderboard entries policies
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view leaderboard entries" ON leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboard entries" ON leaderboard_entries
  FOR ALL USING (true);

-- Email digests policies
ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email digests" ON email_digests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email digests" ON email_digests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Growth metrics policies
ALTER TABLE growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view growth metrics" ON growth_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "System can manage growth metrics" ON growth_metrics
  FOR ALL USING (true);

-- Seed data for default leaderboards
INSERT INTO leaderboards (name, description, type, period, is_active, is_featured, max_entries, calculation_method)
VALUES
  ('Top Voters This Week', 'Users with the most votes cast this week', 'votes', 'weekly', true, true, 50, 'count'),
  ('Problem Creators This Month', 'Users who proposed the most problems this month', 'problems', 'monthly', true, true, 25, 'count'),
  ('Referral Champions', 'Users with the most successful referrals', 'referrals', 'all_time', true, true, 20, 'count'),
  ('Most Engaged Users', 'Users with the highest daily engagement', 'engagement', 'weekly', true, false, 100, 'count'),
  ('Reputation Leaders', 'Users with the highest reputation scores', 'reputation', 'all_time', true, true, 50, 'max')
ON CONFLICT DO NOTHING;

-- Add referral tracking to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'total_referrals'
  ) THEN
    ALTER TABLE users ADD COLUMN total_referrals INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;