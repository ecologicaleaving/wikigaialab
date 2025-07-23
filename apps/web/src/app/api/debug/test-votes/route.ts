import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug test-votes endpoint called');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Test 1: Create problem with vote_count: 0
    console.log('🔍 Test 1: Creating problem with vote_count: 0');
    const problemData0 = {
      title: 'Test Problem - No Initial Vote',
      description: 'Testing problem creation with 0 initial votes.',
      category_id: '32750fcb-6d9d-4863-8eb5-94a315430bad',
      proposer_id: session.user.id,
      status: 'Proposed',
      vote_count: 0
    };
    
    const { data: problem0, error: error0 } = await supabase
      .from('problems')
      .insert(problemData0)
      .select('*')
      .single();

    console.log('🔍 Test 1 result:', { problem: !!problem0, error: error0 });

    // Test 2: Try to create problem with vote_count: 1 (should fail)
    console.log('🔍 Test 2: Creating problem with vote_count: 1');
    const problemData1 = {
      title: 'Test Problem - With Initial Vote',
      description: 'Testing problem creation with 1 initial vote.',
      category_id: '32750fcb-6d9d-4863-8eb5-94a315430bad',
      proposer_id: session.user.id,
      status: 'Proposed',
      vote_count: 1
    };
    
    const { data: problem1, error: error1 } = await supabase
      .from('problems')
      .insert(problemData1)
      .select('*')
      .single();

    console.log('🔍 Test 2 result:', { problem: !!problem1, error: error1 });

    // Test 3: If test 1 succeeded, try to update vote_count to 1
    let updateResult = null;
    if (problem0 && !error0) {
      console.log('🔍 Test 3: Updating vote_count from 0 to 1');
      const { data: updatedProblem, error: updateError } = await supabase
        .from('problems')
        .update({ vote_count: 1 })
        .eq('id', problem0.id)
        .select('*')
        .single();

      updateResult = { updatedProblem, updateError };
      console.log('🔍 Test 3 result:', updateResult);
    }

    // Clean up test problems
    if (problem0?.id) {
      await supabase.from('problems').delete().eq('id', problem0.id);
    }
    if (problem1?.id) {
      await supabase.from('problems').delete().eq('id', problem1.id);
    }

    return NextResponse.json({
      success: true,
      debug: {
        test1_createWith0Votes: {
          success: !!problem0 && !error0,
          error: error0,
          problemId: problem0?.id
        },
        test2_createWith1Vote: {
          success: !!problem1 && !error1,
          error: error1,
          problemId: problem1?.id
        },
        test3_updateTo1Vote: updateResult,
        conclusion: error1 ? 'Database prevents creating problems with vote_count > 0' : 'No restriction found'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test-votes error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}