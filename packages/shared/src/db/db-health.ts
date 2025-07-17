// Import will be available once database package is built
// import { supabase } from '@wikigaialab/database';

// Temporary mock for compilation
const supabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      limit: (n: number) => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null })
      }),
      order: (column: string, options: any) => ({
        limit: (n: number) => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: null, error: null }),
    signInWithOAuth: (options: any) => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  channel: (name: string) => ({
    subscribe: (callback: (status: string) => void) => {
      callback('SUBSCRIBED');
      return {};
    }
  }),
  removeChannel: (channel: any) => Promise.resolve()
};

export interface DatabaseHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  timestamp: string;
  checks: {
    connection: boolean;
    authentication: boolean;
    queries: boolean;
    realtime: boolean;
  };
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  const checks = {
    connection: false,
    authentication: false,
    queries: false,
    realtime: false,
  };

  try {
    // 1. Basic connection test
    const { data: connectionData, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    if (!connectionError) {
      checks.connection = true;
    }

    // 2. Authentication test
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (!authError) {
      checks.authentication = true;
    }

    // 3. Query performance test
    const queryStart = Date.now();
    const { data: queryData, error: queryError } = await supabase
      .from('problems')
      .select('id, title, vote_count')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const queryTime = Date.now() - queryStart;
    if (!queryError && queryTime < 5000) { // 5 second timeout
      checks.queries = true;
    }

    // 4. Real-time connection test
    try {
      const channel = supabase.channel('health-check');
      const subscription = channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          checks.realtime = true;
        }
      });
      
      // Wait for subscription
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Cleanup
      await supabase.removeChannel(channel);
    } catch (realtimeError) {
      console.warn('Real-time health check failed:', realtimeError);
    }

    const latency = Date.now() - startTime;
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    
    let status: DatabaseHealthCheck['status'] = 'unhealthy';
    if (healthyChecks === 4) {
      status = 'healthy';
    } else if (healthyChecks >= 2) {
      status = 'degraded';
    }

    return {
      status,
      latency,
      timestamp,
      checks,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      timestamp,
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Connection pool configuration
export const connectionConfig = {
  poolSize: 10,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Database health monitoring
export class DatabaseMonitor {
  private intervalId?: NodeJS.Timeout;
  private healthHistory: DatabaseHealthCheck[] = [];
  private readonly maxHistory = 100;

  startMonitoring(intervalMs: number = 60000) {
    this.intervalId = setInterval(async () => {
      const health = await checkDatabaseHealth();
      this.addHealthRecord(health);
      
      if (health.status === 'unhealthy') {
        console.error('🚨 Database is unhealthy:', health);
        // Trigger alerts/notifications here
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private addHealthRecord(health: DatabaseHealthCheck) {
    this.healthHistory.push(health);
    if (this.healthHistory.length > this.maxHistory) {
      this.healthHistory.shift();
    }
  }

  getHealthHistory(): DatabaseHealthCheck[] {
    return [...this.healthHistory];
  }

  getLatestHealth(): DatabaseHealthCheck | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  getAverageLatency(samples: number = 10): number {
    const recentHealths = this.healthHistory.slice(-samples);
    if (recentHealths.length === 0) return 0;
    
    const totalLatency = recentHealths.reduce((sum, health) => sum + health.latency, 0);
    return totalLatency / recentHealths.length;
  }
}

// Export singleton instance
export const dbMonitor = new DatabaseMonitor();

// Connection retry logic
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}