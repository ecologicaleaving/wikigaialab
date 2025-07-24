import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
import { createUserIdentityService } from '@/lib/auth/UserIdentityService';

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

    console.log('🔄 Syncing user via UserIdentityService:', {
      sessionUserId: session.user.id,
      email: session.user.email,
      correlationId
    });

    // Use UserIdentityService for atomic user synchronization
    const userIdentityService = createUserIdentityService(correlationId);
    const syncedUser = await userIdentityService.syncUserSession(session);

    console.log('✅ User sync completed via UserIdentityService:', {
      id: syncedUser.id,
      email: syncedUser.email,
      role: syncedUser.role,
      isAdmin: syncedUser.is_admin,
      correlationId
    });

    return NextResponse.json({
      success: true,
      message: 'User sync completed via UserIdentityService',
      action: 'synced',
      user: syncedUser,
      metadata: {
        correlationId,
        service: 'UserIdentityService',
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
      service: 'UserIdentityService'
    }, { status: 500 });
  }
}