import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Database health check
    const { data: dbHealth, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.error('Database health check failed:', dbError);
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      }, { status: 503 });
    }

    // Check essential services
    const healthChecks = {
      database: true,
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