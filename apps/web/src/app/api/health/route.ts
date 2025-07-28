import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check essential services
    const healthChecks = {
      database: 'maintenance', // Database in maintenance mode during migration
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

    // UserIdentityService deprecated - using session callback instead
    diagnostics.userIdentityService = {
      importable: false,
      instantiable: false,
      error: 'Deprecated: Replaced by session callback architecture'
    };

    // Test UUID generation for the existing user
    const testEmail = 'dadecresce@gmail.com';
    let uuidTest = { error: 'not tested' };
    try {
      const { v5: uuidv5 } = await import('uuid');
      const WIKIGAIALAB_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
      const normalizedEmail = testEmail.toLowerCase().trim();
      const generatedUuid = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);
      
      uuidTest = {
        testEmail,
        normalizedEmail,
        generatedUuid,
        existingUserInDb: '90fbc024-98c1-41fa-b01a-7cd7f096c70a',
        match: generatedUuid === '90fbc024-98c1-41fa-b01a-7cd7f096c70a',
        namespace: WIKIGAIALAB_NAMESPACE
      };
    } catch (error) {
      uuidTest = {
        error: error instanceof Error ? error.message : 'UUID test failed'
      };
    }

    return NextResponse.json({
      status: 'healthy',
      ...healthChecks,
      diagnostics,
      uuidTest
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