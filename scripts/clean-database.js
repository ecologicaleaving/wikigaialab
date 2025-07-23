#!/usr/bin/env node

/**
 * Clean Database Script
 * Removes all test/fake data from the database and resets it to a clean state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');
    
    const supabase = getSupabaseClient();
    
    // Step 1: Delete all votes
    console.log('1️⃣ Deleting all votes...');
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (votesError) throw votesError;
    console.log('✅ Votes deleted');
    
    // Step 2: Delete all problems  
    console.log('2️⃣ Deleting all problems...');
    const { error: problemsError } = await supabase
      .from('problems')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (problemsError) throw problemsError;
    console.log('✅ Problems deleted');
    
    // Step 3: Delete all users
    console.log('3️⃣ Deleting all users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (usersError) throw usersError;
    console.log('✅ Users deleted');
    
    // Step 4: Delete all apps
    console.log('4️⃣ Deleting all apps...');
    const { error: appsError } = await supabase
      .from('apps')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (appsError && !appsError.message.includes('relation "apps" does not exist')) {
      throw appsError;
    }
    console.log('✅ Apps deleted (or table doesn\'t exist)');
    
    // Step 5: Clean categories and re-insert essential ones
    console.log('5️⃣ Cleaning and re-inserting essential categories...');
    
    // Delete existing categories
    const { error: deleteCategoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteCategoriesError) throw deleteCategoriesError;
    
    // Insert essential categories
    const essentialCategories = [
      {
        name: 'Ambiente',
        description: 'Problemi legati all\'ambiente e sostenibilità',
        order_index: 1,
        is_active: true
      },
      {
        name: 'Mobilità',
        description: 'Trasporti e mobilità urbana',
        order_index: 2,
        is_active: true
      },
      {
        name: 'Energia',
        description: 'Efficienza energetica e fonti rinnovabili',
        order_index: 3,
        is_active: true
      },
      {
        name: 'Sociale',
        description: 'Problemi sociali e comunitari',
        order_index: 4,
        is_active: true
      },
      {
        name: 'Tecnologia',
        description: 'Innovazione e soluzioni tecnologiche',
        order_index: 5,
        is_active: true
      },
      {
        name: 'Economia',
        description: 'Sviluppo economico sostenibile',
        order_index: 6,
        is_active: true
      }
    ];
    
    const { error: insertCategoriesError } = await supabase
      .from('categories')
      .insert(essentialCategories);
    
    if (insertCategoriesError) throw insertCategoriesError;
    console.log('✅ Essential categories inserted');
    
    // Step 6: Verify cleanup
    console.log('\n📊 Verifying cleanup...');
    
    const tables = ['users', 'problems', 'votes', 'categories'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }
      
      console.log(`   ${table}: ${count || 0} records`);
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Log into your app: https://wikigaialab.vercel.app');
    console.log('2. Run: fetch(\'/api/admin/grant-admin\', { method: \'POST\' }) in browser console');
    console.log('3. Access admin dashboard: https://wikigaialab.vercel.app/admin');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanDatabase();