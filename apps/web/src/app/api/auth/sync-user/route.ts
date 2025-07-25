import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';

export async function POST(request: NextRequest) {
  const correlationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('🔄 User sync API called');
    
    const session = await auth();
    if (!session?.user || !session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        correlationId
      }, { status: 401 });
    }

    // User sync now handled automatically by session callback
    console.log('🔄 User sync handled by session callback:', {
      sessionUserId: session.user.id,
      email: session.user.email,
      correlationId
    });

    return NextResponse.json({
      success: true,
      message: 'User sync handled by session callback - no action needed',
      action: 'session_managed',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      },
      metadata: {
        correlationId,
        service: 'SessionCallback',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ User sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
      service: 'SessionCallback'
    }, { status: 500 });
  }
}