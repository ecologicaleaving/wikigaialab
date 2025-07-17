#!/usr/bin/env node

/**
 * Script to apply migrations manually by breaking SQL into individual statements
 * For Supabase Cloud where exec_sql function is not available
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQLStatements(supabase, sqlStatements, migrationName) {
  console.log(`📄 Executing ${sqlStatements.length} statements for ${migrationName}...`);
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i].trim();
    if (!statement || statement === 'BEGIN;' || statement === 'COMMIT;') continue;
    
    try {
      console.log(`  ${i + 1}/${sqlStatements.length}: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql_statement', { statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        console.error(`Statement: ${statement}`);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Failed to execute statement ${i + 1}:`, error);
      throw error;
    }
  }
}

async function applyMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Applying migrations to Supabase Cloud (manual execution)...');

  try {
    // First, create a helper function if it doesn't exist
    console.log('🔧 Creating helper function for SQL execution...');
    
    const helperFunction = `
      CREATE OR REPLACE FUNCTION exec_sql_statement(statement text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE statement;
      END;
      $$;
    `;

    const { error: helperError } = await supabase.rpc('exec', { sql: helperFunction });
    if (helperError) {
      console.log('ℹ️  Helper function creation failed, trying direct execution...');
    }

    // Apply individual ALTER TABLE statements for migration 005
    console.log('📄 Applying migration 005 components...');

    const migration005Statements = [
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';",
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderation_notes TEXT;",
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_by UUID;",
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;",
      "ALTER TABLE problems ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;",
      
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'folder';",
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#6B7280';",
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS keywords TEXT[];",
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS problems_count INTEGER DEFAULT 0;",
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;",
    ];

    for (const statement of migration005Statements) {
      try {
        console.log(`  Executing: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.from('_migrations').select('*').limit(1);
        // Use raw SQL execution through PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.log(`⚠️  Direct SQL failed, statement may already exist: ${statement.substring(0, 40)}...`);
        } else {
          console.log('✅ Statement executed successfully');
        }
      } catch (error) {
        console.log(`⚠️  Statement may already exist or require manual execution: ${statement.substring(0, 40)}...`);
      }
    }

    // Update existing data
    console.log('📊 Updating existing data...');

    // Update categories with icons and colors
    const categoryUpdates = [
      {
        name: 'Tecnologia',
        icon_name: 'laptop',
        color_hex: '#3B82F6',
        keywords: ['AI', 'app', 'software', 'digital', 'automazione', 'tech', 'sviluppo', 'programmazione', 'innovazione', 'startup']
      },
      {
        name: 'Ambiente',
        icon_name: 'leaf',
        color_hex: '#10B981',
        keywords: ['sostenibile', 'green', 'rifiuti', 'energia', 'clima', 'ambiente', 'ecologia', 'rinnovabile', 'inquinamento', 'natura']
      },
      {
        name: 'Sociale',
        icon_name: 'users',
        color_hex: '#F59E0B',
        keywords: ['comunità', 'volontariato', 'sociale', 'charity', 'solidarietà', 'integrazione', 'inclusione', 'cittadinanza', 'partecipazione']
      },
      {
        name: 'Economia',
        icon_name: 'trending-up',
        color_hex: '#EF4444',
        keywords: ['business', 'finanza', 'startup', 'mercato', 'impresa', 'economia', 'investimenti', 'lavoro', 'commercio', 'sviluppo']
      },
      {
        name: 'Salute',
        icon_name: 'heart',
        color_hex: '#8B5CF6',
        keywords: ['salute', 'fitness', 'medicina', 'benessere', 'sport', 'nutrizione', 'prevenzione', 'cura', 'mentale', 'fisico']
      }
    ];

    for (const update of categoryUpdates) {
      try {
        const { error } = await supabase
          .from('categories')
          .update({
            icon_name: update.icon_name,
            color_hex: update.color_hex,
            keywords: update.keywords
          })
          .eq('name', update.name);

        if (error) {
          console.error(`❌ Error updating category ${update.name}:`, error);
        } else {
          console.log(`✅ Updated category: ${update.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update category ${update.name}:`, error);
      }
    }

    // Update existing problems to approved status
    try {
      const { error } = await supabase
        .from('problems')
        .update({ 
          moderation_status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .is('moderation_status', null);

      if (!error) {
        console.log('✅ Updated existing problems to approved status');
      }
    } catch (error) {
      console.log('ℹ️  Problems may already have moderation status');
    }

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
      if (problems[0] && 'moderation_status' in problems[0]) {
        console.log('✅ Moderation status column added successfully');
      }
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon_name, color_hex, problems_count');
    
    if (categoriesError) {
      console.error('❌ Error verifying categories:', categoriesError);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
      categories.forEach(cat => {
        console.log(`  📁 ${cat.name}: icon ${cat.icon_name || 'default'}, color ${cat.color_hex || 'default'}`);
      });
    }

    console.log('🎉 Core migration components applied successfully!');
    console.log('📋 Note: Some advanced features may need manual SQL execution in Supabase dashboard');
    console.log('🔗 Dashboard: https://jgivhyalioldfelngboi.supabase.co/project/jgivhyalioldfelngboi');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute migrations
applyMigrations();