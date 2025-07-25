import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth-nextauth';

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

    // Get user data directly from database
    let user = null;
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      
      // Query database directly by user ID (which comes from session callback)
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (dbUser) {
        // Use full database user data
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatar_url: dbUser.avatar_url,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at,
          last_login_at: dbUser.last_login_at,
          is_admin: dbUser.is_admin,
          role: dbUser.role || 'user',
          subscription_status: dbUser.subscription_status || 'free',
          total_votes_cast: dbUser.total_votes_cast || 0,
          total_problems_proposed: dbUser.total_problems_proposed || 0,
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ User fetched directly from database:', {
            id: user.id,
            email: user.email,
            is_admin: user.is_admin,
            role: user.role
          });
        }
      } else {
        throw new Error(`User not found in database: ${session.user.id}`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user from database:', error);
      
      // Fallback: use session data if available, including is_admin from session
      user = {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        avatar_url: session.user.image || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        is_admin: (session.user as any).is_admin || false, // Get from session if available
        role: 'user' as const,
        subscription_status: 'free',
        total_votes_cast: 0,
        total_problems_proposed: 0,
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Using session fallback data:', {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin,
          sessionHasAdmin: !!(session.user as any).is_admin
        });
      }
    }

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

