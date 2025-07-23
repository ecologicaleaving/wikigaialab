import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      });
    }

    // Try the same database lookup the session API does
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    console.log('Searching for user with ID:', session.user.id);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    console.log('Database lookup result:', {
      userData,
      error: error?.message,
      searchedId: session.user.id
    });

    // Also try searching by email as backup
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        userEmail: session.user.email
      },
      databaseLookup: {
        byId: {
          found: !!userData,
          data: userData,
          error: error?.message
        },
        byEmail: {
          found: !!userByEmail,
          data: userByEmail,
          error: emailError?.message
        }
      },
      debug: {
        message: userData ? 'User found by ID' : userByEmail ? 'User found by email only' : 'User not found',
        shouldReturnAdmin: userData?.is_admin || userByEmail?.is_admin || false
      }
    });

  } catch (error) {
    console.error('Session DB lookup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}