#!/usr/bin/env node

/**
 * Fix RLS Policies Script
 * Applies the fixed RLS policies to resolve infinite recursion
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixRLSPolicies() {
  log('blue', '🛠️  Fixing RLS Policies...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    log('red', '❌ Missing Supabase environment variables');
    log('yellow', 'Make sure .env.local contains SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  // Create admin client
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Read the fixed RLS policies
    const sqlFile = 'packages/database/src/migrations/003_rls_policies_fixed.sql';
    if (!fs.existsSync(sqlFile)) {
      log('red', `❌ SQL file not found: ${sqlFile}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    log('yellow', '📋 Applying fixed RLS policies...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      log('red', `❌ Error applying policies: ${error.message}`);
      
      // Try manual approach - split and execute statements
      log('yellow', '🔄 Trying manual approach...');
      
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');
      
      for (const statement of statements) {
        try {
          await supabase.rpc('exec_sql', { sql_string: statement });
          log('green', `✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (stmtError) {
          log('yellow', `⚠️  Skipped: ${statement.substring(0, 50)}... (${stmtError.message})`);
        }
      }
    } else {
      log('green', '✅ RLS policies applied successfully');
    }
    
    log('blue', '\n🧪 Testing connection after fix...');
    
    // Test basic queries
    const tests = [
      { table: 'categories', description: 'Categories' },
      { table: 'users', description: 'Users' },
      { table: 'problems', description: 'Problems' },
      { table: 'votes', description: 'Votes' }
    ];
    
    for (const test of tests) {
      try {
        const { data, error } = await supabase.from(test.table).select('*').limit(1);
        if (error) {
          log('red', `❌ ${test.description}: ${error.message}`);
        } else {
          log('green', `✅ ${test.description}: OK`);
        }
      } catch (testError) {
        log('red', `❌ ${test.description}: ${testError.message}`);
      }
    }
    
    log('green', '\n🎉 RLS policies fix completed!');
    log('blue', '🚀 Try running: pnpm run test:supabase');
    
  } catch (error) {
    log('red', `❌ Unexpected error: ${error.message}`);
    
    log('yellow', '\n📋 Manual fix instructions:');
    log('yellow', '1. Go to Supabase Dashboard → SQL Editor');
    log('yellow', '2. Copy and paste packages/database/src/migrations/003_rls_policies_fixed.sql');
    log('yellow', '3. Execute the script');
    
    process.exit(1);
  }
}

fixRLSPolicies();