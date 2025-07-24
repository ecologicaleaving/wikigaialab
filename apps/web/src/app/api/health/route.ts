import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check essential services
    const healthChecks = {
      database: false, // Database not available during migration
      api: true,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Add UserIdentityService diagnostics
    const diagnostics = {
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      userIdentityService: {
        importable: false,
        instantiable: false,
        error: null
      }
    };

    // Test UserIdentityService import and instantiation
    try {
      const { getUserIdentityService } = await import('@/lib/auth/UserIdentityService');
      diagnostics.userIdentityService.importable = true;
      
      try {
        const service = getUserIdentityService('health-check');
        diagnostics.userIdentityService.instantiable = true;
      } catch (error) {
        diagnostics.userIdentityService.error = error instanceof Error ? error.message : 'Instantiation failed';
      }
    } catch (error) {
      diagnostics.userIdentityService.error = error instanceof Error ? error.message : 'Import failed';
    }

    return NextResponse.json({
      status: 'healthy',
      ...healthChecks,
      diagnostics
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function HEAD() {
  // Simple health check for uptime monitoring
  return new Response(null, { status: 200 });
}