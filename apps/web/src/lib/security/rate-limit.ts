/**
 * Advanced Rate Limiting Implementation
 * 
 * A+ Security Implementation - DoS protection and abuse prevention
 * @author BMad Orchestrator Security Team
 * @date 2025-07-22
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Initialize Redis connection (with fallback for development)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? Redis.fromEnv()
  : null;

// Multiple rate limiters for different endpoints and user types
export const rateLimiters = redis ? {
  // Problem creation - stricter limits
  problemCreation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
    prefix: 'rl:problem:create',
  }),

  // General API access - more permissive
  apiAccess: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
    prefix: 'rl:api:general',
  }),

  // Authentication endpoints - moderate limits
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '5 m'), // 10 requests per 5 minutes
    analytics: true,
    prefix: 'rl:auth',
  }),

  // Strict limits for sensitive operations
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '1 m'), // 2 requests per minute
    analytics: true,
    prefix: 'rl:sensitive',
  }),
} : null;

// Rate limit check result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
  identifier: string;
}

// Extract identifier from request
export function getRequestIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP-based identification
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectionIP = (request as any).ip; // NextRequest doesn't have ip property

  // Use the first available IP
  const ip = forwardedFor?.split(',')[0]?.trim() || realIP || connectionIP || 'unknown';
  
  return `ip:${ip}`;
}

// Check rate limit with comprehensive result
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((new Date(result.reset).getTime() - Date.now()) / 1000),
      identifier
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Fail open for Redis connectivity issues (but log the problem)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
      identifier
    };
  }
}

// Rate limit middleware for API routes
export async function rateLimitMiddleware(
  request: NextRequest,
  limiterType: 'problemCreation' | 'apiAccess' | 'auth' | 'sensitive' = 'apiAccess',
  userId?: string
): Promise<RateLimitResult> {
  const identifier = getRequestIdentifier(request, userId);
  
  // If Redis is not configured, allow all requests (development mode)
  if (!rateLimiters) {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: new Date(Date.now() + 60000),
      identifier
    };
  }
  
  const limiter = rateLimiters[limiterType];
  const result = await checkRateLimit(limiter, identifier);

  // Log rate limit violations
  if (!result.success) {
    console.warn('Rate limit exceeded', {
      identifier: result.identifier,
      limiterType,
      limit: result.limit,
      retryAfter: result.retryAfter,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }

  return result;
}

// Rate limit response headers
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.getTime().toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  };
}

// Whitelist for emergency access (admin IPs, etc.)
export function isWhitelisted(request: NextRequest): boolean {
  const adminIPs = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  if (adminIPs.length === 0) return false;

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   (request as any).ip;

  return adminIPs.includes(clientIP || '');
}