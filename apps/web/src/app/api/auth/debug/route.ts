import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';

/**
 * Debug endpoint to check authentication status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth debug endpoint called');
    
    const session = await auth();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : [],
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      userImage: session?.user?.image,
      headers: {
        authorization: request.headers.get('authorization'),
        cookie: request.headers.get('cookie') ? 'present' : 'missing',
        userAgent: request.headers.get('user-agent')
      }
    };
    
    console.log('🔍 Auth debug info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      authenticated: !!session?.user,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Auth debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false
    }, { status: 500 });
  }
}