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
    console.log('🔍 Debug check-email endpoint called');
    
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Check what users exist with this email
    console.log('🔍 Checking users with email:', session.user.email);
    const { data: usersWithEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email);
    
    console.log('🔍 Users with email result:', { usersWithEmail, emailError });
    
    // Check if current user ID exists at all
    console.log('🔍 Checking if current user ID exists:', session.user.id);
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    console.log('🔍 Current user check:', { currentUser, currentUserError });
    
    return NextResponse.json({
      success: true,
      debug: {
        sessionUserId: session.user.id,
        sessionUserEmail: session.user.email,
        sessionUserName: session.user.name,
        usersWithSameEmail: usersWithEmail,
        emailQueryError: emailError,
        currentUserExists: !!currentUser,
        currentUser: currentUser,
        currentUserError: currentUserError
      }
    });
    
  } catch (error) {
    console.error('❌ Debug check-email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}