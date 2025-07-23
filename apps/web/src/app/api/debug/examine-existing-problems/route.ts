import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    console.log('🔍 Examining existing problems in database');
    
    const supabase = getSupabaseClient();
    
    // Get sample of existing problems
    const { data: existingProblems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .limit(5);
    
    console.log('🔍 Existing problems:', { existingProblems, problemsError });
    
    // Check if there are any database functions or triggers related to voting
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_function_list')
      .select('*');
    
    console.log('🔍 Database functions check:', { functions, functionsError });
    
    // Try to get schema information about the problems table
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'problems')
      .eq('table_schema', 'public');
    
    console.log('🔍 Problems table schema:', { tableInfo, tableError });
    
    return NextResponse.json({
      success: true,
      debug: {
        existingProblems: existingProblems?.map(p => ({
          id: p.id,
          title: p.title,
          proposer_id: p.proposer_id,
          vote_count: p.vote_count,
          status: p.status,
          created_at: p.created_at
        })),
        problemsError,
        databaseFunctions: functions,
        functionsError,
        tableSchema: tableInfo,
        tableError,
        analysis: {
          hasExistingProblems: existingProblems && existingProblems.length > 0,
          existingProblemsCount: existingProblems?.length || 0,
          sampleVoteCounts: existingProblems?.map(p => p.vote_count) || []
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug examine-existing-problems error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}