import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple diagnostic endpoint to test basic functionality
 */
export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: []
  };

  try {
    // Test 1: Basic environment
    diagnostics.tests.push({
      name: 'Basic Environment',
      status: 'passed',
      details: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...'
      }
    });

    // Test 2: Import test
    try {
      const { getUserIdentityService } = await import('@/lib/auth/UserIdentityService');
      diagnostics.tests.push({
        name: 'UserIdentityService Import',
        status: 'passed',
        details: { imported: true }
      });

      // Test 3: Service instantiation
      try {
        const service = getUserIdentityService('test');
        diagnostics.tests.push({
          name: 'Service Instantiation',
          status: 'passed',
          details: { instantiated: true }
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'Service Instantiation',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'UserIdentityService Import',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}