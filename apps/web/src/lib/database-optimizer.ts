/**
 * Database Query Optimization Utilities
 * Phase 1 Fix: Database performance optimization
 */

// Database optimization utilities - temporarily disabled during Supabase migration
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { Database } from '@wikigaialab/database';

// Query performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rowCount?: number;
  fromCache?: boolean;
}

class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  logQuery(query: string, duration: number, rowCount?: number, fromCache?: boolean): void {
    const metric: QueryMetrics = {
      query,
      duration,
      timestamp: new Date(),
      rowCount,
      fromCache
    };

    this.metrics.push(metric);

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, query);
    }

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getSlowQueries(threshold?: number): QueryMetrics[] {
    const thresholdMs = threshold || this.slowQueryThreshold;
    return this.metrics.filter(m => m.duration > thresholdMs && !m.fromCache);
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(m => m.fromCache).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  getMetrics(): {
    totalQueries: number;
    averageTime: number;
    slowQueries: number;
    cacheHitRate: number;
    recentSlowQueries: QueryMetrics[];
  } {
    return {
      totalQueries: this.metrics.length,
      averageTime: this.getAverageQueryTime(),
      slowQueries: this.getSlowQueries().length,
      cacheHitRate: this.getCacheHitRate(),
      recentSlowQueries: this.getSlowQueries().slice(-10)
    };
  }
}

export const queryMonitor = QueryPerformanceMonitor.getInstance();

// Query cache for frequently accessed data
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Remove keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

export const queryCache = new QueryCache();

// Cleanup cache periodically
setInterval(() => {
  queryCache.cleanup();
}, 60000); // Every minute

// Optimized query builder for common patterns
export class OptimizedQueryBuilder {
  private supabase = createClientComponentClient<Database>();

  // Optimized problem queries with proper indexing
  async getProblemsWithPagination(options: {
    page?: number;
    limit?: number;
    sortBy?: 'vote_count' | 'created_at' | 'trending';
    sortOrder?: 'asc' | 'desc';
    status?: string;
    category?: string;
    useCache?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      category,
      useCache = true
    } = options;

    const cacheKey = `problems:${JSON.stringify(options)}`;
    
    if (useCache) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        queryMonitor.logQuery(cacheKey, 0, cached.data?.length, true);
        return cached;
      }
    }

    const start = Date.now();
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        status,
        vote_count,
        created_at,
        updated_at,
        user_id,
        user_profiles!inner(
          full_name,
          avatar_url
        )
      `, { count: 'exact' });

    // Apply filters with indexed columns first
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply sorting with indexed columns
    if (sortBy === 'trending') {
      // Use composite index for trending sort
      query = query.order('vote_count', { ascending: false })
                   .order('created_at', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Add secondary sort for consistency
      if (sortBy !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    const duration = Date.now() - start;

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    const result = {
      data: data || [],
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPrevPage: page > 1
    };

    queryMonitor.logQuery(`getProblemsWithPagination:${cacheKey}`, duration, data?.length);

    if (useCache && duration < 5000) { // Only cache if query was fast
      queryCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes TTL
    }

    return result;
  }

  // Optimized search with full-text search
  async searchProblems(options: {
    query: string;
    page?: number;
    limit?: number;
    includeDescription?: boolean;
    useCache?: boolean;
  }) {
    const {
      query: searchQuery,
      page = 1,
      limit = 20,
      includeDescription = true,
      useCache = true
    } = options;

    if (!searchQuery || searchQuery.length < 2) {
      return { data: [], count: 0, page, totalPages: 0, hasNextPage: false, hasPrevPage: false };
    }

    const cacheKey = `search:${JSON.stringify(options)}`;
    
    if (useCache) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        queryMonitor.logQuery(cacheKey, 0, cached.data?.length, true);
        return cached;
      }
    }

    const start = Date.now();
    const offset = (page - 1) * limit;
    const sanitizedQuery = searchQuery.replace(/['"\\]/g, '');

    let query = this.supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        status,
        vote_count,
        created_at,
        user_id,
        user_profiles!inner(
          full_name,
          avatar_url
        )
      `, { count: 'exact' });

    // Use PostgreSQL full-text search with ranking
    if (includeDescription) {
      query = query.textSearch('title,description', sanitizedQuery, {
        config: 'english'
      });
    } else {
      query = query.textSearch('title', sanitizedQuery, {
        config: 'english'
      });
    }

    // Sort by relevance (vote_count as proxy) and recency
    query = query.order('vote_count', { ascending: false })
                 .order('created_at', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    const duration = Date.now() - start;

    if (error) {
      console.error('Search query error:', error);
      throw error;
    }

    const result = {
      data: data || [],
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPrevPage: page > 1
    };

    queryMonitor.logQuery(`searchProblems:${cacheKey}`, duration, data?.length);

    if (useCache && duration < 3000) { // Cache if search was fast
      queryCache.set(cacheKey, result, 1 * 60 * 1000); // 1 minute TTL for searches
    }

    return result;
  }

  // Optimized user activity feed
  async getUserActivityFeed(userId: string, options: {
    page?: number;
    limit?: number;
    useCache?: boolean;
  }) {
    const { page = 1, limit = 20, useCache = true } = options;
    const cacheKey = `activity:${userId}:${page}:${limit}`;

    if (useCache) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        queryMonitor.logQuery(cacheKey, 0, cached.data?.length, true);
        return cached;
      }
    }

    const start = Date.now();
    const offset = (page - 1) * limit;

    // Use composite index for efficient activity feed queries
    const { data, error, count } = await this.supabase
      .from('activity_feed')
      .select(`
        id,
        activity_type,
        target_type,
        target_id,
        created_at,
        metadata,
        user_profiles!inner(
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const duration = Date.now() - start;

    if (error) {
      console.error('Activity feed query error:', error);
      throw error;
    }

    const result = {
      data: data || [],
      count: count || 0,
      page,
      hasMore: (count || 0) > offset + limit
    };

    queryMonitor.logQuery(`getUserActivityFeed:${userId}`, duration, data?.length);

    if (useCache && duration < 2000) {
      queryCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
    }

    return result;
  }

  // Optimized vote count updates with conflict resolution
  async updateVoteCount(problemId: string, increment: boolean) {
    const start = Date.now();

    try {
      // Use atomic update to prevent race conditions
      const { data, error } = await this.supabase.rpc('update_vote_count_atomic', {
        problem_id: problemId,
        increment_by: increment ? 1 : -1
      });

      const duration = Date.now() - start;
      queryMonitor.logQuery(`updateVoteCount:${problemId}`, duration);

      // Invalidate related caches
      queryCache.invalidate('problems:');
      queryCache.invalidate(`problem:${problemId}`);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Vote count update error:', error);
      throw error;
    }
  }

  // Batch operations for efficiency
  async batchInsertActivities(activities: Array<{
    user_id: string;
    activity_type: string;
    target_type: string;
    target_id: string;
    metadata?: any;
  }>) {
    const start = Date.now();

    try {
      const { data, error } = await this.supabase
        .from('activity_feed')
        .insert(activities);

      const duration = Date.now() - start;
      queryMonitor.logQuery(`batchInsertActivities:${activities.length}`, duration);

      // Invalidate activity caches
      queryCache.invalidate('activity:');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Batch insert error:', error);
      throw error;
    }
  }
}

export const optimizedQueries = new OptimizedQueryBuilder();

// Database health check utilities
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: any;
  recommendations: string[];
}> {
  const supabase = createClientComponentClient<Database>();
  const start = Date.now();

  try {
    // Simple connection test
    const { data, error } = await supabase
      .from('problems')
      .select('id')
      .limit(1);

    const connectionTime = Date.now() - start;
    const queryMetrics = queryMonitor.getMetrics();
    const cacheStats = queryCache.getStats();

    const recommendations: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Analyze performance
    if (connectionTime > 1000) {
      status = 'degraded';
      recommendations.push('Database connection is slow (>1s)');
    }

    if (queryMetrics.averageTime > 500) {
      status = 'degraded';
      recommendations.push('Average query time is high (>500ms)');
    }

    if (queryMetrics.slowQueries > queryMetrics.totalQueries * 0.1) {
      status = 'unhealthy';
      recommendations.push('Too many slow queries (>10% of total)');
    }

    if (cacheStats.size > 1000) {
      recommendations.push('Consider increasing cache cleanup frequency');
    }

    if (error) {
      status = 'unhealthy';
      recommendations.push(`Database error: ${error.message}`);
    }

    return {
      status,
      metrics: {
        connectionTime,
        query: queryMetrics,
        cache: cacheStats
      },
      recommendations
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      metrics: { error: (error as Error).message },
      recommendations: ['Database connection failed']
    };
  }
}

// Preload commonly accessed data
export async function preloadCriticalData() {
  console.log('🔄 Preloading critical data...');

  try {
    // Preload popular problems
    await optimizedQueries.getProblemsWithPagination({
      page: 1,
      limit: 20,
      sortBy: 'vote_count',
      useCache: true
    });

    // Preload recent problems
    await optimizedQueries.getProblemsWithPagination({
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      useCache: true
    });

    console.log('✅ Critical data preloaded');
  } catch (error) {
    console.error('❌ Failed to preload critical data:', error);
  }
}