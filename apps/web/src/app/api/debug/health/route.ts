/**
 * Debug Health Check Endpoint
 * Comprehensive system status for production debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';
import { createApiTracker } from '@/lib/debug/api-tracker';
import { logger } from '@/lib/debug/logger';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  checks: HealthCheck[];
  metadata: {
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const tracker = createApiTracker(request, 'GET /api/debug/health');
  
  try {
    const systemHealth: SystemHealth = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: [],
      metadata: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Check 1: Environment Variables
    const envCheck = await performEnvironmentCheck();
    systemHealth.checks.push(envCheck);

    // Check 2: Database Connection
    const dbCheck = await performDatabaseCheck();
    systemHealth.checks.push(dbCheck);
    
    // Check 3: Authentication System
    const authCheck = await performAuthCheck();
    systemHealth.checks.push(authCheck);

    // Check 4: Database Schema Validation
    const schemaCheck = await performSchemaCheck();
    systemHealth.checks.push(schemaCheck);

    // Determine overall health
    const unhealthyChecks = systemHealth.checks.filter(c => c.status === 'unhealthy');
    const degradedChecks = systemHealth.checks.filter(c => c.status === 'degraded');
    
    if (unhealthyChecks.length > 0) {
      systemHealth.overall = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      systemHealth.overall = 'degraded';
    }

    const statusCode = systemHealth.overall === 'healthy' ? 200 : 
                      systemHealth.overall === 'degraded' ? 206 : 503;

    return tracker.complete(NextResponse.json(systemHealth, { status: statusCode }));

  } catch (error) {
    tracker.trackError(error as Error, 500);
    
    return tracker.complete(NextResponse.json({
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

async function performEnvironmentCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      return {
        service: 'environment',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `Missing environment variables: ${missing.join(', ')}`
      };
    }

    return {
      service: 'environment',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL
      }
    };
  } catch (error) {
    return {
      service: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Environment check failed'
    };
  }
}

async function performDatabaseCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = getSupabaseClient();
    
    // Test basic connectivity
    const { data, error, count } = await supabase
      .from('problems')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `Database query failed: ${error.message}`,
        details: { code: error.code, hint: error.hint }
      };
    }

    return {
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        connected: true,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function performAuthCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Test auth configuration
    const authConfig = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    };

    const missingConfigs = Object.entries(authConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingConfigs.length > 0) {
      return {
        service: 'authentication',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: `Missing auth config: ${missingConfigs.join(', ')}`,
        details: authConfig
      };
    }

    return {
      service: 'authentication',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: authConfig
    };
  } catch (error) {
    return {
      service: 'authentication',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Auth check failed'
    };
  }
}

async function performSchemaCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = getSupabaseClient();
    
    // Check key tables exist
    const tables = ['problems', 'categories', 'users'];
    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        try {
          const { error } = await supabase
            .from(table as any)
            .select('*')
            .limit(1);
          return { table, exists: !error, error: error?.message };
        } catch (err) {
          return { table, exists: false, error: err instanceof Error ? err.message : 'Unknown' };
        }
      })
    );

    const missingTables = tableChecks.filter(t => !t.exists);
    
    if (missingTables.length > 0) {
      return {
        service: 'database-schema',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `Missing tables: ${missingTables.map(t => t.table).join(', ')}`,
        details: { tableChecks }
      };
    }

    return {
      service: 'database-schema',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: { tablesChecked: tables.length, allTablesExist: true }
    };
  } catch (error) {
    return {
      service: 'database-schema',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Schema check failed'
    };
  }
}