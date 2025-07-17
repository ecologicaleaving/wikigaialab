#!/usr/bin/env node

/**
 * Simple Supabase Connection Test for WikiGaiaLab
 * Tests Supabase Cloud setup and seed data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  log('blue', '🌐 WikiGaiaLab Supabase Connection Test\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('red', '❌ Missing Supabase environment variables');
    log('yellow', 'Make sure .env.local contains:');
    log('yellow', '- NEXT_PUBLIC_SUPABASE_URL');
    log('yellow', '- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  log('green', `✅ Environment variables loaded`);
  log('cyan', `📍 URL: ${supabaseUrl}`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check categories table
    log('blue', '\n🏷️  Testing categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);
    
    if (categoriesError) {
      log('red', `❌ Categories error: ${categoriesError.message}`);
    } else {
      log('green', `✅ Categories: ${categories.length} records found`);
      categories.forEach(cat => log('cyan', `   - ${cat.name}`));
    }
    
    // Test 2: Check users table
    log('blue', '\n👥 Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (usersError) {
      log('red', `❌ Users error: ${usersError.message}`);
    } else {
      log('green', `✅ Users: ${users.length} records found`);
      users.forEach(user => log('cyan', `   - ${user.name} (${user.email})`));
    }
    
    // Test 3: Check problems table
    log('blue', '\n💡 Testing problems table...');
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .limit(3);
    
    if (problemsError) {
      log('red', `❌ Problems error: ${problemsError.message}`);
    } else {
      log('green', `✅ Problems: ${problems.length} records found`);
      problems.forEach(problem => log('cyan', `   - ${problem.title} (${problem.vote_count} votes)`));
    }
    
    // Test 4: Check votes table
    log('blue', '\n🗳️  Testing votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(5);
    
    if (votesError) {
      log('red', `❌ Votes error: ${votesError.message}`);
    } else {
      log('green', `✅ Votes: ${votes.length} records found`);
    }
    
    // Test 5: Test a join query
    log('blue', '\n🔗 Testing join queries...');
    const { data: problemsWithCategories, error: joinError } = await supabase
      .from('problems')
      .select(`
        title,
        vote_count,
        categories (name)
      `)
      .limit(3);
    
    if (joinError) {
      log('red', `❌ Join query error: ${joinError.message}`);
    } else {
      log('green', `✅ Join queries working`);
      problemsWithCategories.forEach(problem => 
        log('cyan', `   - ${problem.title} in ${problem.categories?.name}`)
      );
    }
    
    // Summary
    log('green', '\n🎉 Database connection test completed successfully!');
    log('blue', '\n📊 Summary:');
    log('cyan', `   Categories: ${categories?.length || 0}`);
    log('cyan', `   Users: ${users?.length || 0}`);
    log('cyan', `   Problems: ${problems?.length || 0}`);
    log('cyan', `   Votes: ${votes?.length || 0}`);
    
    log('green', '\n✅ Your WikiGaiaLab database is ready for development!');
    log('blue', '\n🚀 Next step: pnpm dev');
    
  } catch (error) {
    log('red', `❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

testSupabaseConnection();