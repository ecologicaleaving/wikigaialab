-- WikiGaiaLab Database Schema v1.0
-- Migration 007: Notification System
-- Epic 3, Story 3.1: Email notifications for vote milestones and admin alerts
-- Author: Claude (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- Notification types and status enums
CREATE TYPE notification_type AS ENUM (
    'vote_milestone',
    'admin_alert',
    'problem_approved',
    'problem_rejected',
    'featured_content',
    'welcome'
);

CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'cancelled'
);

-- User notification preferences
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

-- Notification queue for tracking all notifications
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

-- Vote milestones tracking to prevent duplicate notifications
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

-- Email templates for different notification types
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
    variables JSONB DEFAULT '[]', -- Array of available variables
    
    -- Status and versioning
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT email_templates_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT email_templates_language_valid CHECK (language IN ('it', 'en'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_problem_id ON notifications(problem_id);

CREATE INDEX IF NOT EXISTS idx_vote_milestones_problem_id ON vote_milestones(problem_id);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_milestone ON vote_milestones(milestone);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_achieved_at ON vote_milestones(achieved_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON email_templates(language);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_status ON notifications(type, status);
CREATE INDEX IF NOT EXISTS idx_vote_milestones_notification_sent ON vote_milestones(notification_sent, achieved_at);

-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id, email_vote_milestones, email_problem_updates, email_admin_notifications)
SELECT id, true, true, false
FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);

-- Insert default email templates
INSERT INTO email_templates (name, type, subject_template, content_text_template, content_html_template, variables) VALUES

-- Vote milestone template
('vote_milestone_50', 'vote_milestone', 
 'Il tuo problema "{{problem_title}}" ha raggiunto {{milestone}} voti! 🎉',
 'Ciao {{user_name}},

Ottime notizie! Il tuo problema "{{problem_title}}" ha appena raggiunto {{milestone}} voti sulla piattaforma WikiGaiaLab.

Questo è un traguardo importante che dimostra l''interesse della comunità per la tua proposta. La tua idea sta guadagnando trazione e potrebbe presto essere considerata per lo sviluppo.

Dettagli del problema:
- Titolo: {{problem_title}}
- Categoria: {{category_name}}
- Voti attuali: {{current_votes}}
- Data pubblicazione: {{created_at}}

Cosa succede ora?
- Continua a condividere il tuo problema per ottenere più visibilità
- A 100 voti, il team di WikiGaiaLab verrà notificato per una valutazione prioritaria
- Potresti essere contattato per discutere lo sviluppo della soluzione

Visualizza il tuo problema: {{problem_url}}

Grazie per contribuire alla comunità WikiGaiaLab!

Il Team WikiGaiaLab
https://wikigaialab.com',
 '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">🎉 Traguardo raggiunto!</h1>
  
  <p>Ciao <strong>{{user_name}}</strong>,</p>
  
  <p>Ottime notizie! Il tuo problema "<strong>{{problem_title}}</strong>" ha appena raggiunto <strong>{{milestone}} voti</strong> sulla piattaforma WikiGaiaLab.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1f2937;">Dettagli del problema:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Titolo:</strong> {{problem_title}}</li>
      <li><strong>Categoria:</strong> {{category_name}}</li>
      <li><strong>Voti attuali:</strong> {{current_votes}}</li>
      <li><strong>Data pubblicazione:</strong> {{created_at}}</li>
    </ul>
  </div>
  
  <h3 style="color: #1f2937;">Cosa succede ora?</h3>
  <ul>
    <li>Continua a condividere il tuo problema per ottenere più visibilità</li>
    <li>A 100 voti, il team di WikiGaiaLab verrà notificato per una valutazione prioritaria</li>
    <li>Potresti essere contattato per discutere lo sviluppo della soluzione</li>
  </ul>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{problem_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visualizza il tuo problema</a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
    Grazie per contribuire alla comunità WikiGaiaLab!<br>
    Il Team WikiGaiaLab<br>
    <a href="https://wikigaialab.com">https://wikigaialab.com</a>
  </p>
</div>
</body></html>',
 '["user_name", "problem_title", "milestone", "category_name", "current_votes", "created_at", "problem_url"]'),

-- Admin alert template
('admin_alert_100_votes', 'admin_alert',
 '🚨 Problema prioritario: "{{problem_title}}" ha raggiunto 100 voti',
 'Alert Amministratore WikiGaiaLab,

Un problema ha raggiunto la soglia di priorità di 100 voti e richiede attenzione immediata.

Dettagli del problema:
- Titolo: {{problem_title}}
- Autore: {{proposer_name}} ({{proposer_email}})
- Categoria: {{category_name}}
- Voti totali: {{current_votes}}
- Data pubblicazione: {{created_at}}

Descrizione:
{{problem_description}}

Azioni raccomandate:
1. Rivedi il problema per qualità e fattibilità
2. Contatta l''autore per discussioni approfondite
3. Considera per roadmap di sviluppo prioritario
4. Aggiorna lo status del problema nel dashboard admin

Accedi al dashboard admin: {{admin_url}}
Visualizza problema: {{problem_url}}

Questo messaggio è stato generato automaticamente dal sistema di notifiche WikiGaiaLab.',
 '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
    <h1 style="color: #dc2626; margin: 0;">🚨 Problema Prioritario</h1>
  </div>
  
  <p>Alert Amministratore WikiGaiaLab,</p>
  
  <p>Un problema ha raggiunto la <strong>soglia di priorità di 100 voti</strong> e richiede attenzione immediata.</p>
  
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1f2937;">Dettagli del problema:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Titolo:</strong> {{problem_title}}</li>
      <li><strong>Autore:</strong> {{proposer_name}} ({{proposer_email}})</li>
      <li><strong>Categoria:</strong> {{category_name}}</li>
      <li><strong>Voti totali:</strong> {{current_votes}}</li>
      <li><strong>Data pubblicazione:</strong> {{created_at}}</li>
    </ul>
  </div>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h4 style="margin-top: 0;">Descrizione:</h4>
    <p>{{problem_description}}</p>
  </div>
  
  <h3 style="color: #1f2937;">Azioni raccomandate:</h3>
  <ol>
    <li>Rivedi il problema per qualità e fattibilità</li>
    <li>Contatta l''autore per discussioni approfondite</li>
    <li>Considera per roadmap di sviluppo prioritario</li>
    <li>Aggiorna lo status del problema nel dashboard admin</li>
  </ol>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{admin_url}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Dashboard Admin</a>
    <a href="{{problem_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visualizza Problema</a>
  </div>
  
  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
    Questo messaggio è stato generato automaticamente dal sistema di notifiche WikiGaiaLab.
  </p>
</div>
</body></html>',
 '["problem_title", "proposer_name", "proposer_email", "category_name", "current_votes", "created_at", "problem_description", "admin_url", "problem_url"]');

COMMIT;