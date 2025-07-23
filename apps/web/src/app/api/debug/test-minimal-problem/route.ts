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
    console.log('🔍 Debug test-minimal-problem endpoint called');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Test 1: Create problem without vote_count field at all (let DB set default)
    console.log('🔍 Test 1: Creating problem without vote_count field');
    const minimalProblem = {
      title: 'Minimal Test Problem',
      description: 'Testing problem creation without vote_count field.',
      category_id: '32750fcb-6d9d-4863-8eb5-94a315430bad',
      proposer_id: session.user.id,
      status: 'Proposed'
      // No vote_count field - let database set default
    };
    
    const { data: problem1, error: error1 } = await supabase
      .from('problems')
      .insert(minimalProblem)
      .select('*')
      .single();

    console.log('🔍 Test 1 result:', { problem: !!problem1, error: error1, createdProblem: problem1 });

    // Test 2: If test 1 worked, try to add a vote record separately
    let voteResult = null;
    if (problem1 && !error1) {
      console.log('🔍 Test 2: Trying to create separate vote record');
      
      const voteData = {
        problem_id: problem1.id,
        user_id: session.user.id,
        vote_type: 'upvote'
      };
      
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert(voteData)
        .select('*')
        .single();

      voteResult = { vote, voteError };
      console.log('🔍 Test 2 result:', voteResult);
    }

    // Clean up test problem
    if (problem1?.id) {
      await supabase.from('problems').delete().eq('id', problem1.id);
    }

    return NextResponse.json({
      success: true,
      debug: {
        minimalProblemCreation: {
          success: !!problem1 && !error1,
          error: error1,
          problem: problem1,
          defaultVoteCount: problem1?.vote_count
        },
        separateVoteCreation: voteResult,
        recommendation: error1 ? 
          'Problem creation blocked entirely' : 
          'Create problem first, then handle voting separately'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test-minimal-problem error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}