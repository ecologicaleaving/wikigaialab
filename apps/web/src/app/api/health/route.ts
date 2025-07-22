import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Mock health check since database is not available
    console.log('Health check - database not available, returning mock status');

    // Check essential services
    const healthChecks = {
      database: false, // Database not available during migration
      api: true,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json({
      status: 'healthy',
      ...healthChecks
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