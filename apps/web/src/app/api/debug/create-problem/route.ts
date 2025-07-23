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
    console.log('🔍 Debug create-problem endpoint called');
    
    // Test authentication
    const session = await auth();
    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        sessionInfo: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id
        }
      }, { status: 401 });
    }
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const supabase = getSupabaseClient();
    
    // Ensure user exists in database (robust logic)
    console.log('🔍 Ensuring user exists in database...');
    let userSyncSuccess = false;
    let userSyncError = null;
    
    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
        // User doesn't exist, create them
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email || 'unknown@email.com',
            name: session.user.name || 'Unknown User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError && insertError.code === '23505') {
          // Email conflict, try update
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: session.user.name || 'Unknown User',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
          
          userSyncError = updateError;
          userSyncSuccess = !updateError;
        } else {
          userSyncError = insertError;
          userSyncSuccess = !insertError;
        }
      } else {
        userSyncSuccess = true; // User already exists
      }
    } catch (syncError) {
      userSyncError = syncError;
      userSyncSuccess = false;
    }
    
    console.log('🔍 User sync result:', { userSyncSuccess, userSyncError });
    
    // Test category access
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
    
    console.log('🔍 Category test:', { categories, catError });
    
    // Test problem creation with minimal data
    const testProblem = {
      title: 'Debug Test Problem',
      description: 'This is a test problem created by the debug endpoint.',
      category_id: '32750fcb-6d9d-4863-8eb5-94a315430bad', // Economics
      proposer_id: session.user.id,
      status: 'Proposed',
      vote_count: 1
    };
    
    console.log('🔍 Attempting to create test problem:', testProblem);
    
    const { data: problem, error: insertError } = await supabase
      .from('problems')
      .insert(testProblem)
      .select('*')
      .single();
    
    console.log('🔍 Insert result:', { problem, insertError });
    
    return NextResponse.json({
      success: true,
      debug: {
        authenticated: true,
        userId: session.user.id,
        userSynced: userSyncSuccess,
        userSyncError: userSyncError,
        categoriesWork: !catError,
        problemCreated: !insertError,
        problem: problem,
        insertError: insertError
      }
    });
    
  } catch (error) {
    console.error('❌ Debug create-problem error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}