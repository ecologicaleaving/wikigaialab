-- Volantino Generator App Tables
-- These tables store data for the Volantino Generator application

-- Table for storing generated flyers
CREATE TABLE IF NOT EXISTS app_volantino_flyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_location TEXT NOT NULL,
    event_description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'business', 'party', 'community')),
    contact_info TEXT,
    design_style TEXT NOT NULL DEFAULT 'classic',
    design_data JSONB NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking downloads
CREATE TABLE IF NOT EXISTS app_volantino_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flyer_id UUID NOT NULL REFERENCES app_volantino_flyers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('png', 'pdf')),
    has_watermark BOOLEAN NOT NULL DEFAULT true,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user templates (premium feature)
CREATE TABLE IF NOT EXISTS app_volantino_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_volantino_flyers_user_id ON app_volantino_flyers(user_id);
CREATE INDEX IF NOT EXISTS idx_app_volantino_flyers_created_at ON app_volantino_flyers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_volantino_flyers_event_type ON app_volantino_flyers(event_type);

CREATE INDEX IF NOT EXISTS idx_app_volantino_downloads_user_id ON app_volantino_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_app_volantino_downloads_flyer_id ON app_volantino_downloads(flyer_id);
CREATE INDEX IF NOT EXISTS idx_app_volantino_downloads_downloaded_at ON app_volantino_downloads(downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_volantino_templates_user_id ON app_volantino_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_app_volantino_templates_is_public ON app_volantino_templates(is_public) WHERE is_public = true;

-- Row Level Security (RLS) policies
ALTER TABLE app_volantino_flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_volantino_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_volantino_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own flyers
CREATE POLICY "Users can view their own flyers" ON app_volantino_flyers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flyers" ON app_volantino_flyers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flyers" ON app_volantino_flyers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flyers" ON app_volantino_flyers
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own downloads
CREATE POLICY "Users can view their own downloads" ON app_volantino_downloads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads" ON app_volantino_downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see their own templates and public templates
CREATE POLICY "Users can view their own templates" ON app_volantino_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON app_volantino_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own templates" ON app_volantino_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON app_volantino_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON app_volantino_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_app_volantino_flyers_updated_at
    BEFORE UPDATE ON app_volantino_flyers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_volantino_templates_updated_at
    BEFORE UPDATE ON app_volantino_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE app_volantino_flyers IS 'Stores generated flyers from the Volantino Generator app';
COMMENT ON TABLE app_volantino_downloads IS 'Tracks downloads of generated flyers';
COMMENT ON TABLE app_volantino_templates IS 'Stores user-created templates for the Volantino Generator';

COMMENT ON COLUMN app_volantino_flyers.design_data IS 'JSON object containing the flyer design configuration';
COMMENT ON COLUMN app_volantino_flyers.event_type IS 'Type of event: birthday, business, party, or community';
COMMENT ON COLUMN app_volantino_downloads.has_watermark IS 'Whether the downloaded version included a watermark';
COMMENT ON COLUMN app_volantino_templates.is_public IS 'Whether the template is publicly available to other users';