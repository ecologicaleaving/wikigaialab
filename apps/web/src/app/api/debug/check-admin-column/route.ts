import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Check if is_admin column exists by trying to select it
    const { data: testQuery, error: testError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .limit(1);

    if (testError) {
      console.log('is_admin column test error:', testError);
      
      // If column doesn't exist, let's add it
      if (testError.message.includes('column "is_admin" does not exist')) {
        console.log('is_admin column does not exist, attempting to add it');
        
        // Try to add the column using a raw SQL query
        const { data: alterResult, error: alterError } = await supabase.rpc(
          'add_admin_column',
          {}
        );

        if (alterError) {
          console.log('Failed to add is_admin column via RPC, trying direct SQL');
          
          // Try direct SQL execution
          const { data: sqlResult, error: sqlError } = await supabase
            .from('users')
            .select('*')
            .limit(0); // Just to test connection

          return NextResponse.json({
            success: false,
            columnExists: false,
            error: testError.message,
            suggestion: 'Need to add is_admin column to users table',
            sqlToRun: 'ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;'
          });
        }
      }
    }

    // If we get here, the column exists
    return NextResponse.json({
      success: true,
      columnExists: true,
      sampleData: testQuery,
      message: 'is_admin column exists and is accessible'
    });

  } catch (error) {
    console.error('Column check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}