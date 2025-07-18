/**
 * Advanced Rate Limiting System
 * Implements multiple rate limiting strategies with Redis support
 */

import { NextRequest } from 'next/server';
import { config, securityConfig } from './env';
import { apiErrors } from './api-middleware';

// Rate limit configuration types
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// Default rate limit configurations for different endpoints
export const rateLimitConfigs = {
  default: {
    windowMs: securityConfig.rateLimit.windowMs, // 15 minutes
    maxRequests: securityConfig.rateLimit.maxRequests, // 100 requests
    message: 'Too many requests, please try again later',
  },
  
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts
    message: 'Too many authentication attempts, please try again later',
  },
  
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // 200 API calls
    message: 'API rate limit exceeded, please try again later',
  },
  
  voting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 votes per minute
    message: 'Too many votes, please slow down',
  },
  
  problemCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 problems per hour
    message: 'Too many problems created, please try again later',
  },
  
  emailNotifications: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 emails per hour
    message: 'Email rate limit exceeded',
  },
  
  aiRequests: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 AI requests per hour
    message: 'AI service rate limit exceeded',
  },
} as const;

// In-memory store for development (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

class InMemoryStore {
  private store = new Map<string, RateLimitEntry>();
  
  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Clean up expired entries
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }
  
  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }
  
  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = await this.get(key);
    
    if (!existing) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequestTime: now,
      };
      await this.set(key, newEntry);
      return newEntry;
    }
    
    existing.count++;
    await this.set(key, existing);
    return existing;
  }
  
  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Redis store for production (implement when Redis is available)
class RedisStore {
  // TODO: Implement Redis-based rate limiting for production
  // This would use Redis commands like INCR, EXPIRE for atomic operations
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_key: string): Promise<RateLimitEntry | null> {
    // Implement Redis GET
    throw new Error('Redis store not implemented yet');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async increment(_key: string, _windowMs: number): Promise<RateLimitEntry> {
    // Implement Redis INCR with expiry
    throw new Error('Redis store not implemented yet');
  }
}

// Store singleton
const store = config.NODE_ENV === 'production' && process.env.REDIS_URL 
  ? new RedisStore() 
  : new InMemoryStore();

// Cleanup task for in-memory store
if (store instanceof InMemoryStore) {
  setInterval(() => {
    store.cleanup();
  }, 60000); // Cleanup every minute
}

// Default key generator
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get IP from various headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `rate_limit:${ip}`;
}

// User-specific key generator (when authenticated)
function userKeyGenerator(request: NextRequest): string {
  // Extract user ID from session/token with proper JWT validation
  const sessionCookie = request.cookies.get('sb-access-token');
  const authHeader = request.headers.get('authorization');
  
  if (sessionCookie || authHeader) {
    try {
      // Extract and validate JWT token
      const token = authHeader?.replace('Bearer ', '') || sessionCookie?.value;
      if (token) {
        // Basic JWT structure validation (proper implementation should verify signature)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.sub && payload.exp && Date.now() / 1000 < payload.exp) {
            return `rate_limit:user:${payload.sub}`;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to extract user ID from token:', error);
    }
  }
  
  return defaultKeyGenerator(request);
}

// Create rate limiter middleware
export function createRateLimit(configName: keyof typeof rateLimitConfigs | RateLimitConfig) {
  const limitConfig = typeof configName === 'string' 
    ? rateLimitConfigs[configName] 
    : configName;
    
  const {
    windowMs,
    maxRequests,
    message = 'Rate limit exceeded',
    keyGenerator = defaultKeyGenerator,
  } = limitConfig;

  return async (request: NextRequest): Promise<void> => {
    try {
      const key = keyGenerator(request);
      const entry = await store.increment(key, windowMs);
      
      // Add rate limit headers
      const remainingRequests = Math.max(0, maxRequests - entry.count);
      const resetTime = Math.ceil(entry.resetTime / 1000);
      
      // Check if limit exceeded
      if (entry.count > maxRequests) {
        throw apiErrors.rateLimitExceeded(message);
      }
      
      // Store rate limit info for response headers
      (request as any).rateLimit = {
        limit: maxRequests,
        remaining: remainingRequests,
        reset: resetTime,
        retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      
      // If rate limiting fails, log but don't block the request
      console.error('Rate limiting error:', error);
    }
  };
}

// Middleware to add rate limit headers to response
export function addRateLimitHeaders(request: NextRequest, response: Response): Response {
  const rateLimit = (request as any).rateLimit;
  
  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
    
    if (rateLimit.remaining === 0) {
      response.headers.set('Retry-After', rateLimit.retryAfter.toString());
    }
  }
  
  return response;
}

// Specialized rate limiters
export const authRateLimit = createRateLimit('auth');
export const apiRateLimit = createRateLimit('api');
export const votingRateLimit = createRateLimit('voting');
export const problemCreationRateLimit = createRateLimit('problemCreation');
export const emailRateLimit = createRateLimit('emailNotifications');
export const aiRateLimit = createRateLimit('aiRequests');

// Premium user rate limiter (higher limits)
export const premiumRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 5x higher limit for premium users
  message: 'Premium rate limit exceeded',
  keyGenerator: userKeyGenerator,
});

// Rate limit bypass for admins
export function createAdminBypass<T extends (...args: any[]) => any>(
  rateLimiter: T
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    // Check if user is admin (implement based on your auth system)
    const isAdmin = request.headers.get('x-user-role') === 'admin';
    
    if (isAdmin) {
      return; // Bypass rate limiting for admins
    }
    
    return rateLimiter(request, ...args);
  }) as T;
}

// Rate limit analytics
export class RateLimitAnalytics {
  private static instance: RateLimitAnalytics;
  private metrics = new Map<string, {
    requests: number;
    blocked: number;
    lastReset: number;
  }>();
  
  static getInstance(): RateLimitAnalytics {
    if (!RateLimitAnalytics.instance) {
      RateLimitAnalytics.instance = new RateLimitAnalytics();
    }
    return RateLimitAnalytics.instance;
  }
  
  recordRequest(endpoint: string): void {
    const metric = this.metrics.get(endpoint) || {
      requests: 0,
      blocked: 0,
      lastReset: Date.now(),
    };
    
    metric.requests++;
    this.metrics.set(endpoint, metric);
  }
  
  recordBlock(endpoint: string): void {
    const metric = this.metrics.get(endpoint) || {
      requests: 0,
      blocked: 0,
      lastReset: Date.now(),
    };
    
    metric.blocked++;
    this.metrics.set(endpoint, metric);
  }
  
  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics.entries());
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

// Export analytics instance
export const rateLimitAnalytics = RateLimitAnalytics.getInstance();

// Middleware wrapper that includes analytics
export function withRateLimitAnalytics(
  rateLimiter: (request: NextRequest) => Promise<void>,
  endpoint: string
) {
  return async (request: NextRequest): Promise<void> => {
    rateLimitAnalytics.recordRequest(endpoint);
    
    try {
      await rateLimiter(request);
    } catch (error) {
      rateLimitAnalytics.recordBlock(endpoint);
      throw error;
    }
  };
}

// Health check for rate limiting system
export function getRateLimitHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: any;
} {
  try {
    const metrics = rateLimitAnalytics.getMetrics();
    const totalRequests = Object.values(metrics).reduce(
      (sum: number, metric: any) => sum + metric.requests, 0
    );
    const totalBlocked = Object.values(metrics).reduce(
      (sum: number, metric: any) => sum + metric.blocked, 0
    );
    
    const blockRate = totalRequests > 0 ? totalBlocked / totalRequests : 0;
    
    return {
      status: blockRate > 0.5 ? 'unhealthy' : blockRate > 0.2 ? 'degraded' : 'healthy',
      metrics: {
        totalRequests,
        totalBlocked,
        blockRate,
        endpoints: metrics,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      metrics: { error: 'Failed to collect metrics' },
    };
  }
}