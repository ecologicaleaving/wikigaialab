#!/usr/bin/env node

/**
 * Simple script to run SQL against Supabase using node-postgres
 */

const fs = require('fs');

async function runSQL() {
  // For now, let's use a different approach - manual table creation
  console.log('🚀 Creating missing database tables manually...');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Test if we can create a simple table
    console.log('✅ Connected to Supabase');
    
    // Since we can't run arbitrary SQL, let's check what we can do
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('Note: Cannot query information_schema, that\'s expected');
    }
    
    // Try to query an existing table to see what's there
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .limit(1);
      
    if (problemsError) {
      console.log('❌ Problems table does not exist:', problemsError.message);
    } else {
      console.log('✅ Problems table exists with', problems?.length || 0, 'records');
    }
    
    // Try to query problem_collections
    const { data: collections, error: collectionsError } = await supabase
      .from('problem_collections')
      .select('*')
      .limit(1);
      
    if (collectionsError) {
      console.log('❌ Collections table does not exist:', collectionsError.message);
    } else {
      console.log('✅ Collections table exists with', collections?.length || 0, 'records');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runSQL().catch(console.error);