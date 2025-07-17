# Notification System Migration - Step by Step

Execute these SQL statements in your Supabase Dashboard SQL Editor in order:

## Step 1: Create Notification Enums

```sql
-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
    'vote_milestone',
    'admin_alert',
    'problem_approved',
    'problem_rejected',
    'featured_content',
    'welcome'
);

-- Create notification status enum
CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'cancelled'
);
```

## Step 2: Create User Notification Preferences Table

```sql
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email notification preferences
    email_vote_milestones BOOLEAN DEFAULT true,
    email_problem_updates BOOLEAN DEFAULT true,
    email_admin_notifications BOOLEAN DEFAULT true,
    email_featured_content BOOLEAN DEFAULT false,
    email_weekly_digest BOOLEAN DEFAULT true,
    
    -- Notification frequency settings
    immediate_notifications BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);
```

## Step 3: Create Notifications Queue Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient and type
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    
    -- Content and metadata
    subject TEXT NOT NULL,
    content_text TEXT NOT NULL,
    content_html TEXT,
    
    -- Related entities
    problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
    related_data JSONB DEFAULT '{}',
    
    -- Email delivery tracking
    email_provider TEXT DEFAULT 'resend',
    email_message_id TEXT,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_delivered_at TIMESTAMP WITH TIME ZONE,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    email_clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT notifications_retry_count_valid CHECK (retry_count >= 0 AND retry_count <= max_retries)
);
```

## Step 4: Create Vote Milestones Tracking Table

```sql
CREATE TABLE IF NOT EXISTS vote_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    milestone INTEGER NOT NULL, -- 50, 75, 100, etc.
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_sent BOOLEAN DEFAULT false,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    
    -- Ensure one milestone per problem
    UNIQUE(problem_id, milestone)
);
```

## Step 5: Create Email Templates Table

```sql
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type notification_type NOT NULL,
    language TEXT DEFAULT 'it',
    
    -- Template content
    subject_template TEXT NOT NULL,
    content_text_template TEXT NOT NULL,
    content_html_template TEXT,
    
    -- Template variables documentation
    variables JSONB DEFAULT '[]',
    
    -- Status and versioning
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT email_templates_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT email_templates_language_valid CHECK (language IN ('it', 'en'))
);
```

## Step 6: Create Performance Indexes

```sql
-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_problem_id ON notifications(problem_id);

-- Vote milestones indexes
CREATE INDEX IF NOT EXISTS idx_vote_milestones_problem_id ON vote_milestones(problem_id);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_milestone ON vote_milestones(milestone);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_achieved_at ON vote_milestones(achieved_at DESC);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON email_templates(language);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_status ON notifications(type, status);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_notification_sent ON vote_milestones(notification_sent, achieved_at);
```

## Step 7: Initialize Default Data

```sql
-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id, email_vote_milestones, email_problem_updates, email_admin_notifications)
SELECT id, true, true, false
FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);
```

## Step 8: Verification

```sql
-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('user_notification_preferences', 'notifications', 'vote_milestones', 'email_templates');

-- Check notification preferences were created
SELECT COUNT(*) as preference_count FROM user_notification_preferences;

-- Check enum types
SELECT typname FROM pg_type WHERE typname IN ('notification_type', 'notification_status');
```

Execute each step in order and let me know when you're ready for the next phase!