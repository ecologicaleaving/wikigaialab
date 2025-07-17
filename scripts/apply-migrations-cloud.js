#!/usr/bin/env node

/**
 * Script to apply new migrations to Supabase Cloud database
 * Since we're using cloud setup, we need to execute SQL directly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Applying new migrations to Supabase Cloud...');

  try {
    // Read and execute migration 005
    const migration005Path = path.join(__dirname, '../packages/database/src/migrations/005_content_management.sql');
    const migration005SQL = fs.readFileSync(migration005Path, 'utf8');
    
    console.log('📄 Applying migration 005: Content Management schema...');
    const { error: error005 } = await supabase.rpc('exec_sql', { sql: migration005SQL });
    
    if (error005) {
      console.error('❌ Error applying migration 005:', error005);
      throw error005;
    }
    
    console.log('✅ Migration 005 applied successfully');

    // Read and execute migration 006
    const migration006Path = path.join(__dirname, '../packages/database/src/migrations/006_enhanced_seed_data.sql');
    const migration006SQL = fs.readFileSync(migration006Path, 'utf8');
    
    console.log('📄 Applying migration 006: Enhanced seed data...');
    const { error: error006 } = await supabase.rpc('exec_sql', { sql: migration006SQL });
    
    if (error006) {
      console.error('❌ Error applying migration 006:', error006);
      throw error006;
    }
    
    console.log('✅ Migration 006 applied successfully');

    // Verify the changes
    console.log('🔍 Verifying applied changes...');
    
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id, title, moderation_status, is_featured')
      .limit(5);
    
    if (problemsError) {
      console.error('❌ Error verifying problems:', problemsError);
    } else {
      console.log(`✅ Found ${problems.length} problems in database`);
      console.log(`📊 Featured problems: ${problems.filter(p => p.is_featured).length}`);
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon_name, color_hex, problems_count');
    
    if (categoriesError) {
      console.error('❌ Error verifying categories:', categoriesError);
    } else {
      console.log(`✅ Found ${categories.length} enhanced categories`);
      categories.forEach(cat => {
        console.log(`  📁 ${cat.name}: ${cat.problems_count} problems, icon: ${cat.icon_name}`);
      });
    }

    const { data: collections, error: collectionsError } = await supabase
      .from('content_collections')
      .select('id, name, is_active');
    
    if (collectionsError) {
      console.error('❌ Error verifying collections:', collectionsError);
    } else {
      console.log(`✅ Found ${collections.length} content collections`);
    }

    console.log('🎉 All migrations applied successfully!');
    console.log('📈 Database is ready for Epic 3 Story 3.3 development');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute migrations
applyMigrations();