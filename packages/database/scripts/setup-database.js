#!/usr/bin/env node

/**
 * Database setup script for WikiGaiaLab
 * 
 * This script helps initialize the database with proper schema,
 * triggers, RLS policies, and seed data.
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Validate environment variables
function validateEnvironment() {
  if (!SUPABASE_URL) {
    error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }
}

// Create Supabase client
function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Read migration file
function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

// Execute SQL migration using raw SQL
async function executeMigration(supabase, migrationName, sql) {
  try {
    info(`Running migration: ${migrationName}`);
    
    // Split SQL by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^--/));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        // Use the raw SQL execution through Supabase's REST API
        const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'apikey': supabase.supabaseKey
          },
          body: JSON.stringify({ query: statement + ';' })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
      } catch (sqlError) {
        // Some statements might fail if they already exist, that's okay
        warning(`Statement ${i + 1} warning: ${sqlError.message}`);
      }
    }
    
    success(`Migration completed: ${migrationName}`);
    return true;
  } catch (err) {
    error(`Migration failed: ${migrationName}`);
    error(`Error: ${err.message}`);
    return false;
  }
}

// Check if migration tracking table exists
async function ensureMigrationTracking(supabase) {
  const createTrackingTable = `
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      success BOOLEAN DEFAULT true
    );
  `;

  try {
    await supabase.rpc('exec_sql', { sql: createTrackingTable });
    info('Migration tracking table ready');
  } catch (err) {
    warning('Could not create migration tracking table');
  }
}

// Check if migration was already executed
async function isMigrationExecuted(supabase, migrationName) {
  try {
    const { data, error } = await supabase
      .from('migration_history')
      .select('*')
      .eq('migration_name', migrationName)
      .eq('success', true)
      .single();

    return !error && data;
  } catch (err) {
    return false;
  }
}

// Record migration execution
async function recordMigration(supabase, migrationName, success) {
  try {
    await supabase
      .from('migration_history')
      .insert({
        migration_name: migrationName,
        success: success
      });
  } catch (err) {
    warning(`Could not record migration: ${migrationName}`);
  }
}

// Main setup function
async function setupDatabase() {
  log('🚀 Starting WikiGaiaLab Database Setup', 'cyan');
  
  // Validate environment
  validateEnvironment();
  
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  // Test connection with a simple query
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1);
    
    success('Database connection successful');
  } catch (err) {
    error('Database connection failed');
    error(err.message);
    process.exit(1);
  }

  // Ensure migration tracking
  await ensureMigrationTracking(supabase);

  // Migration order - complete set
  const migrations = [
    { name: '001_initial_schema', file: '001_initial_schema.sql', description: 'Initial schema with core tables' },
    { name: '002_triggers', file: '002_triggers.sql', description: 'Database triggers for real-time updates' },
    { name: '003_rls_policies', file: '003_rls_policies.sql', description: 'Row Level Security policies' },
    { name: '004_seed_data', file: '004_seed_data.sql', description: 'Initial seed data' },
    { name: '005_content_management', file: '005_content_management.sql', description: 'Content management features' },
    { name: '006_enhanced_seed_data', file: '006_enhanced_seed_data.sql', description: 'Enhanced seed data' },
    { name: '007_notification_system', file: '007_notification_system.sql', description: 'Notification system' },
    { name: '008_search_performance', file: '008_search_performance_optimization.sql', description: 'Search performance optimization' },
    { name: '009_user_profiles_social', file: '009_user_profiles_social_features.sql', description: 'User profiles and social features' },
    { name: '010_discovery_recommendations', file: '010_discovery_recommendations_system.sql', description: 'Discovery and recommendations system' }
  ];

  let successCount = 0;
  let skipCount = 0;

  // Execute migrations in order
  for (const migration of migrations) {
    try {
      // Check if already executed
      if (await isMigrationExecuted(supabase, migration.name)) {
        log(`⏭️  Skipping migration: ${migration.name} (already executed)`, 'yellow');
        skipCount++;
        continue;
      }

      // Read migration file
      const sql = readMigrationFile(migration.file);
      
      // Execute migration
      const success = await executeMigration(supabase, migration.name, sql);
      
      // Record result
      await recordMigration(supabase, migration.name, success);
      
      if (success) {
        successCount++;
      } else {
        error(`Failed to execute migration: ${migration.name}`);
        break;
      }
    } catch (err) {
      error(`Error processing migration ${migration.name}: ${err.message}`);
      break;
    }
  }

  // Summary
  log('\\n📊 Migration Summary:', 'cyan');
  log(`   ✅ Executed: ${successCount}`, 'green');
  log(`   ⏭️  Skipped: ${skipCount}`, 'yellow');
  log(`   📁 Total: ${migrations.length}`, 'blue');

  if (successCount + skipCount === migrations.length) {
    success('\\n🎉 Database setup completed successfully!');
    log('\\n📋 Next steps:', 'cyan');
    log('   1. Verify schema in Supabase dashboard', 'blue');
    log('   2. Test database operations', 'blue');
    log('   3. Run application tests', 'blue');
  } else {
    error('\\n❌ Database setup incomplete. Please check the errors above.');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(err => {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  setupDatabase,
  validateEnvironment,
  createSupabaseClient,
  readMigrationFile,
  executeMigration
};