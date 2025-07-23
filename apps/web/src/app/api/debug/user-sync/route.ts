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
    console.log('🔍 Debug user-sync endpoint called');
    
    // Test authentication
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    console.log('🔍 Existing user check:', { existingUser, checkError });
    
    // Try to upsert user
    console.log('🔍 Attempting user upsert...');
    const userData = {
      id: session.user.id,
      email: session.user.email || 'unknown@email.com',
      name: session.user.name || 'Unknown User',
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 User data to upsert:', userData);
    
    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id'
      })
      .select('*')
      .single();
    
    console.log('🔍 Upsert result:', { upsertedUser, upsertError });
    
    // Try a simple insert if upsert fails
    let insertResult = null;
    if (upsertError) {
      console.log('🔍 Trying simple insert...');
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select('*')
        .single();
      
      insertResult = { insertedUser, insertError };
      console.log('🔍 Insert result:', insertResult);
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        existingUser: existingUser,
        checkError: checkError,
        upsertedUser: upsertedUser,
        upsertError: upsertError,
        insertResult: insertResult
      }
    });
    
  } catch (error) {
    console.error('❌ Debug user-sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}