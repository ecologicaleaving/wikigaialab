import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const problemId = url.searchParams.get('id') || '45f25592-dbb0-4977-89c1-1c2b2e4b49f1';
    
    const supabase = getSupabaseClient();
    
    // Test 1: Basic existence check
    const { data: basicData, error: basicError } = await supabase
      .from('problems')
      .select('id, title, status, created_at')
      .eq('id', problemId)
      .single();
    
    // Test 2: Count all problems
    const { count } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true });
    
    // Test 3: Get recent problems
    const { data: recentProblems } = await supabase
      .from('problems')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      success: true,
      debug: {
        searchingFor: problemId,
        basicQuery: {
          found: !!basicData,
          error: basicError?.message || null,
          data: basicData
        },
        totalProblemsCount: count,
        recentProblems: recentProblems || []
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}