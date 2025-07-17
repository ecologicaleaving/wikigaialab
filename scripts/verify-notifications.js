#!/usr/bin/env node

/**
 * Script to verify notification system setup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyNotificationSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Verifying notification system setup...\n');

  try {
    // Check if notification tables exist
    const tables = [
      'user_notification_preferences',
      'notifications', 
      'vote_milestones',
      'email_templates'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': OK`);
      }
    }

    // Check email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('name, type, is_active');

    if (templatesError) {
      console.log(`❌ Email templates: ${templatesError.message}`);
    } else {
      console.log(`\n📧 Email Templates: ${templates.length} found`);
      templates.forEach(template => {
        console.log(`  • ${template.name} (${template.type}) - ${template.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    // Check user notification preferences
    const { count: preferencesCount } = await supabase
      .from('user_notification_preferences')
      .select('*', { count: 'exact', head: true });

    console.log(`\n👤 User Preferences: ${preferencesCount || 0} users configured`);

    // Check notification queue
    const { count: notificationsCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    console.log(`📬 Notifications Queue: ${notificationsCount || 0} notifications`);

    // Check vote milestones
    const { count: milestonesCount } = await supabase
      .from('vote_milestones')
      .select('*', { count: 'exact', head: true });

    console.log(`🎯 Vote Milestones: ${milestonesCount || 0} milestones tracked`);

    // Check environment variables
    console.log('\n🔐 Environment Configuration:');
    console.log(`  • RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`  • NOTIFICATION_SERVICE_TOKEN: ${process.env.NOTIFICATION_SERVICE_TOKEN ? '✅ Set' : '❌ Not set'}`);

    console.log('\n🎉 Notification system verification complete!');
    
    if (!process.env.RESEND_API_KEY) {
      console.log('\n⚠️  Note: RESEND_API_KEY not set - emails will be logged but not sent');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyNotificationSetup();