import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get basic metrics
    const [
      { count: totalUsers },
      { count: totalProblems },
      { count: totalVotes },
      { count: activeUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('problems').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('votes')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Calculate activity metrics
    const votesLastHour = recentActivity?.length || 0;
    const avgResponseTime = Date.now() - startTime;

    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        name: 'WikiGaiaLab',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        totalUsers: totalUsers || 0,
        totalProblems: totalProblems || 0,
        totalVotes: totalVotes || 0,
        activeUsers: activeUsers || 0
      },
      performance: {
        responseTime: avgResponseTime,
        votesLastHour,
        healthStatus: 'healthy'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Metrics collection failed:', error);
    return NextResponse.json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value, tags } = body;

    // Log custom metrics
    console.log('Custom metric:', {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });

    // In production, you would send this to your monitoring service
    // Example: DataDog, New Relic, CloudWatch, etc.

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom metric logging failed:', error);
    return NextResponse.json({
      error: 'Failed to log metric',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}