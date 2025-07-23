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

export async function POST() {
  try {
    console.log('🔍 Comparing current user with existing problem creators');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Get current user details
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    // Get existing problem creators
    const existingCreatorIds = [
      'b8c4af75-cd67-4c76-ac6a-00d60ead948c',
      '9756fab6-d502-4933-859b-ce8eeb56a4b2', 
      'a29f91c0-e3b7-4364-a3b2-aaaa6dcc3c9d'
    ];
    
    const { data: existingCreators, error: creatorsError } = await supabase
      .from('users')
      .select('*')
      .in('id', existingCreatorIds);
    
    // Check if current user has any existing problems
    const { data: currentUserProblems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .eq('proposer_id', session.user.id);
    
    // Try creating a problem with one of the existing creator IDs (DANGEROUS - for testing only)
    console.log('🔍 Testing problem creation with existing creator ID...');
    const testProblemData = {
      title: 'Architecture Test Problem',
      description: 'Testing if problem creation works with different user context.',
      category_id: '32750fcb-6d9d-4863-8eb5-94a315430bad',
      proposer_id: 'b8c4af75-cd67-4c76-ac6a-00d60ead948c', // Use existing creator ID
      status: 'Proposed',
      vote_count: 1
    };
    
    const { data: testProblem, error: testError } = await supabase
      .from('problems')
      .insert(testProblemData)
      .select('*')
      .single();
    
    // Clean up test problem if created
    if (testProblem?.id) {
      await supabase.from('problems').delete().eq('id', testProblem.id);
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        currentUser: {
          id: session.user.id,
          email: session.user.email,
          dbRecord: currentUser,
          error: currentUserError,
          existingProblems: currentUserProblems?.length || 0
        },
        existingCreators: existingCreators?.map(creator => ({
          id: creator.id,
          email: creator.email,
          name: creator.name,
          created_at: creator.created_at,
          role: creator.role
        })),
        creatorsError,
        testWithExistingCreatorId: {
          success: !!testProblem && !testError,
          error: testError,
          wasCreated: !!testProblem
        },
        analysis: {
          currentUserInDb: !!currentUser,
          userAccountAge: currentUser?.created_at,
          hasExistingProblems: (currentUserProblems?.length || 0) > 0,
          canCreateWithDifferentId: !!testProblem && !testError
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug compare-users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}