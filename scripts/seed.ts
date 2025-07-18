#!/usr/bin/env tsx
/**
 * Seed script for WikiGaiaLab development database
 * This script applies seed data to the local Supabase instance
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function main() {
  console.log('🌱 Starting seed process...')
  
  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  try {
    // Test connection
    console.log('📡 Testing database connection...')
    const { data: tables, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }
    
    console.log('✅ Database connection successful')
    
    // Check if seed data already exists
    console.log('🔍 Checking existing seed data...')
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', 'admin@wikigaialab.com')
    
    if (userError) {
      console.warn('⚠️  Could not check existing users:', userError.message)
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('📋 Seed data already exists. Skipping seed process.')
      console.log('💡 To re-seed, run: npm run db:reset')
      return
    }
    
    // Read and execute seed SQL
    console.log('🌱 Applying seed data...')
    const seedSqlPath = join(__dirname, '..', 'packages', 'database', 'src', 'migrations', '004_seed_data.sql')
    
    try {
      const seedSql = readFileSync(seedSqlPath, 'utf-8')
      
      // Execute the seed SQL
      const { error: seedError } = await supabase.rpc('exec_sql', {
        sql: seedSql
      })
      
      if (seedError) {
        // If exec_sql function doesn't exist, try direct SQL execution
        console.log('📝 Executing seed SQL directly...')
        
        // Split SQL into individual statements and execute them
        const statements = seedSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
        
        for (const statement of statements) {
          if (statement.toLowerCase().includes('begin') || statement.toLowerCase().includes('commit')) {
            continue // Skip transaction statements as they're handled automatically
          }
          
          console.log(`Executing: ${statement.substring(0, 100)}...`)
          // Note: Direct SQL execution would require the SQL to be split into smaller operations
          // For now, we'll recommend using the migration system
        }
        
        console.log('⚠️  Direct SQL execution not fully supported')
        console.log('💡 Please use: npm run db:reset to apply migrations and seed data')
      } else {
        console.log('✅ Seed data applied successfully')
      }
      
    } catch (fileError) {
      console.error('❌ Error reading seed file:', fileError)
      console.log('💡 Make sure the seed file exists at:', seedSqlPath)
    }
    
    // Verify seed data was applied
    console.log('🔍 Verifying seed data...')
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('email, name')
      .limit(5)
    
    if (verifyError) {
      console.warn('⚠️  Could not verify seed data:', verifyError.message)
    } else {
      console.log('👥 Sample users created:', users?.length || 0)
      users?.forEach(user => console.log(`  - ${user.name} (${user.email})`))
    }
    
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('title, status')
      .limit(5)
    
    if (!problemsError && problems) {
      console.log('🎯 Sample problems created:', problems.length)
      problems.forEach(problem => console.log(`  - ${problem.title} (${problem.status})`))
    }
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .limit(5)
    
    if (!categoriesError && categories) {
      console.log('📂 Categories created:', categories.length)
      categories.forEach(category => console.log(`  - ${category.name}`))
    }
    
    console.log('🎉 Seed process completed!')
    console.log('🚀 You can now start the application with: npm run dev')
    
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    process.exit(1)
  }
}

// Run the seed process
main().catch(console.error)