import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    console.log('Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session found',
        session: null
      });
    }

    const supabase = getSupabaseClient();
    
    // Check if user exists in database
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id);

    console.log('Database query result:', {
      userCount: users?.length || 0,
      queryError: queryError?.message,
      users: users
    });

    // Also check by email as fallback
    const { data: usersByEmail, error: emailQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email);

    console.log('Email query result:', {
      userCount: usersByEmail?.length || 0,
      queryError: emailQueryError?.message,
      users: usersByEmail
    });

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name
      },
      database: {
        usersByIdCount: users?.length || 0,
        usersByEmailCount: usersByEmail?.length || 0,
        usersById: users,
        usersByEmail: usersByEmail,
        queryError: queryError?.message,
        emailQueryError: emailQueryError?.message
      },
      debug: {
        message: 'Use this info to understand why admin grant is failing'
      }
    });

  } catch (error) {
    console.error('User status debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}