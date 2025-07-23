import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth-nextauth';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';

/**
 * NextAuth Session API Route
 * Provides server-side session information with debugging
 */

/**
 * GET - Get current NextAuth session information
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Session API - Checking NextAuth session...');
      
      // Log environment configuration (server-side safe)
      console.log('🔧 Server Environment Check:', {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        timestamp: new Date().toISOString()
      });
    }

    // Get current session using NextAuth
    const session = await auth();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Session Check Result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        expires: session?.expires
      });
    }

    if (!session) {
      return NextResponse.json(
        { 
          session: null, 
          user: null,
          debug: {
            timestamp: new Date().toISOString(),
            hasNextAuthConfig: true
          }
        },
        { status: 200 }
      );
    }

    // Get user data from database to get real admin status
    let databaseUser = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);
        
        // First try by ID
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!error && userData) {
          databaseUser = userData;
        } else {
          // Fallback to email lookup if ID fails (common with Google OAuth numeric IDs)
          console.log('ID lookup failed, trying email lookup for:', session.user.email);
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          if (!emailError && userByEmail) {
            databaseUser = userByEmail;
            console.log('Found user by email with admin status:', userByEmail.is_admin);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user from database:', error);
    }

    // Convert NextAuth session to our AuthUser format with real database data
    const user = {
      id: session.user.id || session.user.email || '',
      email: session.user.email || '',
      name: session.user.name || '',
      avatar_url: session.user.image || null,
      created_at: databaseUser?.created_at || new Date().toISOString(),
      updated_at: databaseUser?.updated_at || new Date().toISOString(),
      last_login_at: databaseUser?.last_login_at || new Date().toISOString(),
      is_admin: databaseUser?.is_admin || false, // Use real database value
      role: databaseUser?.is_admin ? 'admin' : 'user' as const,
      subscription_status: databaseUser?.subscription_status || 'free',
      total_votes_cast: databaseUser?.total_votes_cast || 0,
      total_problems_proposed: databaseUser?.total_problems_proposed || 0,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Session API - Returning valid session');
    }
    
    return NextResponse.json({
      session,
      user,
      debug: {
        timestamp: new Date().toISOString(),
        sessionExpires: session.expires
      }
    });
    
  } catch (error) {
    console.error('❌ Session GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

