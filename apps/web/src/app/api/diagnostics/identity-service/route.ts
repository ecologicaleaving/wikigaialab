import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
import { getUserIdentityService } from '@/lib/auth/UserIdentityService';

/**
 * Diagnostic endpoint to test UserIdentityService functionality
 * This helps identify what exactly is failing in production
 */
export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: [] as any[]
  };

  try {
    // Test 1: Check environment variables
    diagnostics.tests.push({
      name: 'Environment Variables',
      status: 'running',
      details: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
        nodeEnv: process.env.NODE_ENV
      }
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      diagnostics.tests[0].status = 'failed';
      diagnostics.tests[0].error = 'Missing required environment variables';
      return NextResponse.json(diagnostics, { status: 500 });
    }
    diagnostics.tests[0].status = 'passed';

    // Test 2: UserIdentityService instantiation
    let userService;
    try {
      userService = getUserIdentityService('diagnostic-test');
      diagnostics.tests.push({
        name: 'UserIdentityService Instantiation',
        status: 'passed',
        details: { serviceCreated: true }
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'UserIdentityService Instantiation',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 3: UUID generation
    try {
      const testEmail = 'test@example.com';
      const generatedId = userService.generateDeterministicUserId(testEmail);
      diagnostics.tests.push({
        name: 'UUID Generation',
        status: 'passed',
        details: {
          testEmail,
          generatedId,
          isValidUuid: userService.validateUserId(generatedId)
        }
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'UUID Generation',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Test 4: Database connection test
    try {
      // Try a simple query to test database connectivity
      const testUser = await userService.getUserById('00000000-0000-0000-0000-000000000000');
      diagnostics.tests.push({
        name: 'Database Connection',
        status: 'passed',
        details: {
          queryExecuted: true,
          userFound: !!testUser
        }
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Database Connection',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Test 5: Check current session (if authenticated)
    try {
      const session = await auth();
      diagnostics.tests.push({
        name: 'Current Session',
        status: 'passed',
        details: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasEmail: !!session?.user?.email,
          hasId: !!session?.user?.id,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        }
      });

      // Test 6: If we have a session, try to sync the user
      if (session?.user?.email) {
        try {
          const syncedUser = await userService.syncUserSession(session.user.id, {
            email: session.user.email,
            name: session.user.name,
            image: session.user.image
          });
          
          diagnostics.tests.push({
            name: 'User Session Sync',
            status: 'passed',
            details: {
              syncedUserId: syncedUser.id,
              syncedUserEmail: syncedUser.email,
              syncedUserRole: syncedUser.role,
              isAdmin: syncedUser.isAdmin
            }
          });
        } catch (error) {
          diagnostics.tests.push({
            name: 'User Session Sync',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            errorType: error instanceof Error ? error.constructor.name : 'unknown'
          });
        }

        // Test 7: Try fallback approach
        try {
          const oauthData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || 'Test User',
            image: session.user.image,
            provider: 'google'
          };

          const resolvedUser = await userService.resolveUser(oauthData);
          
          diagnostics.tests.push({
            name: 'OAuth User Resolution',
            status: 'passed',
            details: {
              resolvedUserId: resolvedUser.id,
              resolvedUserEmail: resolvedUser.email,
              resolvedUserRole: resolvedUser.role,
              isAdmin: resolvedUser.isAdmin
            }
          });
        } catch (error) {
          diagnostics.tests.push({
            name: 'OAuth User Resolution',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            errorType: error instanceof Error ? error.constructor.name : 'unknown'
          });
        }
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'Current Session',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    diagnostics.tests.push({
      name: 'Diagnostic Framework',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(diagnostics, { status: 500 });
  }
}