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

    // Convert NextAuth session to our AuthUser format
    const user = {
      id: session.user.id || session.user.email || '',
      email: session.user.email || '',
      name: session.user.name || '',
      avatar_url: session.user.image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      is_admin: false,
      role: 'user' as const,
      subscription_status: 'free',
      total_votes_cast: 0,
      total_problems_proposed: 0,
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

