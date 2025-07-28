import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get basic metrics (with error handling for database unavailability)
    let totalUsers = 0, totalProblems = 0, totalVotes = 0, activeUsers = 0;
    let recentActivity: any[] = [];

    try {
      const [
        usersResult,
        problemsResult,
        votesResult,
        activeUsersResult
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('problems').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      totalUsers = usersResult.count || 0;
      totalProblems = problemsResult.count || 0;
      totalVotes = votesResult.count || 0;
      activeUsers = activeUsersResult.count || 0;

      // Get recent activity
      const { data: activityData } = await supabase
        .from('votes')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      recentActivity = activityData || [];
    } catch (dbError) {
      console.warn('Database metrics unavailable during migration:', dbError);
    }

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
    
    // Handle both single metric and batch metrics formats
    if (body.metrics && Array.isArray(body.metrics)) {
      // Batch format from monitoring service
      const validMetrics = body.metrics.filter(m => 
        m.name && (m.value !== undefined && m.value !== null)
      );
      
      if (validMetrics.length === 0) {
        console.warn('No valid metrics in batch');
        return NextResponse.json({
          success: true,
          processed: 0,
          timestamp: new Date().toISOString()
        });
      }

      // Log valid metrics
      validMetrics.forEach(metric => {
        console.log('Custom metric:', {
          metric: metric.name,
          value: metric.value,
          tags: metric.tags,
          timestamp: metric.timestamp || new Date().toISOString()
        });
      });

      return NextResponse.json({
        success: true,
        processed: validMetrics.length,
        timestamp: new Date().toISOString()
      });
    } else {
      // Single metric format
      const { metric, value, tags } = body;

      // Validate that required fields are present
      if (!metric || value === undefined || value === null) {
        console.warn('Invalid metric data received:', { metric, value, tags });
        return NextResponse.json({
          error: 'Invalid metric data: metric name and value are required',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      // Log custom metrics only if valid
      console.log('Custom metric:', {
        metric,
        value,
        tags,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Custom metric logging failed:', error);
    return NextResponse.json({
      error: 'Failed to log metric',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}