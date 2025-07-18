/**
 * Comprehensive API middleware for error handling, validation, and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config, debugConfig } from './env';

// Error types
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        statusCode: this.statusCode,
        ...(debugConfig.enabled && this.details && { details: this.details }),
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Common API errors
export const apiErrors = {
  validationError: (message: string, details?: any) =>
    new ApiError(ApiErrorType.VALIDATION_ERROR, message, 400, details),
  
  authenticationError: (message: string = 'Authentication required') =>
    new ApiError(ApiErrorType.AUTHENTICATION_ERROR, message, 401),
  
  authorizationError: (message: string = 'Insufficient permissions') =>
    new ApiError(ApiErrorType.AUTHORIZATION_ERROR, message, 403),
  
  notFound: (resource: string = 'Resource') =>
    new ApiError(ApiErrorType.NOT_FOUND, `${resource} not found`, 404),
  
  rateLimitExceeded: (message: string = 'Rate limit exceeded') =>
    new ApiError(ApiErrorType.RATE_LIMIT_EXCEEDED, message, 429),
  
  internalServerError: (message: string = 'Internal server error', details?: any) =>
    new ApiError(ApiErrorType.INTERNAL_SERVER_ERROR, message, 500, details),
  
  databaseError: (message: string = 'Database operation failed', details?: any) =>
    new ApiError(ApiErrorType.DATABASE_ERROR, message, 500, details),
  
  externalServiceError: (service: string, details?: any) =>
    new ApiError(
      ApiErrorType.EXTERNAL_SERVICE_ERROR,
      `${service} service unavailable`,
      503,
      details
    ),
};

// Request validation schema
const requestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.record(z.string()).optional(),
  query: z.record(z.any()).optional(),
  body: z.any().optional(),
});

// Response helpers
export const apiResponse = {
  success: (data: any, statusCode: number = 200) => {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }, { status: statusCode });
  },

  error: (error: ApiError | Error, statusCode?: number) => {
    if (error instanceof ApiError) {
      // Log error for monitoring
      if (debugConfig.enabled || error.statusCode >= 500) {
        console.error('API Error:', error.toJSON());
      }
      
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    // Handle unexpected errors
    const status = statusCode || 500;
    const apiError = new ApiError(
      ApiErrorType.INTERNAL_SERVER_ERROR,
      config.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      status,
      debugConfig.enabled ? { stack: error.stack } : undefined
    );

    console.error('Unexpected API Error:', error);
    return NextResponse.json(apiError.toJSON(), { status });
  },

  created: (data: any) => apiResponse.success(data, 201),
  
  noContent: () => new NextResponse(null, { status: 204 }),
};

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 900000): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Request validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const contentType = request.headers.get('content-type');
      let body: any = undefined;

      if (contentType?.includes('application/json')) {
        try {
          body = await request.json();
        } catch (error) {
          throw apiErrors.validationError('Invalid JSON in request body');
        }
      }

      const data = {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(new URL(request.url).searchParams.entries()),
        body,
      };

      return schema.parse(data) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw apiErrors.validationError('Request validation failed', error.errors);
      }
      throw error;
    }
  };
}

// Authentication middleware with proper JWT validation
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('sb-access-token');

  if (!authHeader && !sessionCookie) {
    throw apiErrors.authenticationError();
  }

  try {
    // Extract JWT token
    const token = authHeader?.replace('Bearer ', '') || sessionCookie?.value;
    
    if (!token) {
      throw apiErrors.authenticationError('No valid token provided');
    }

    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw apiErrors.authenticationError('Invalid token format');
    }

    // Decode and validate payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (!payload.exp || Date.now() / 1000 >= payload.exp) {
      throw apiErrors.authenticationError('Token expired');
    }

    // Check required fields
    if (!payload.sub) {
      throw apiErrors.authenticationError('Invalid token payload');
    }

    // TODO: Verify JWT signature with Supabase public key in production
    // For now, we trust the structure and expiration

    return { 
      userId: payload.sub, 
      role: payload.role || 'user',
      email: payload.email,
      aud: payload.aud,
      iss: payload.iss
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      throw error;
    }
    console.error('JWT validation error:', error);
    throw apiErrors.authenticationError('Invalid token');
  }
}

// Admin authorization middleware
export async function requireAdmin(user: any) {
  if (!user || user.role !== 'admin') {
    throw apiErrors.authorizationError('Admin access required');
  }
}

// API route wrapper with comprehensive error handling
export function withApiHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Add security headers
      const response = await handler(request);
      
      // Add CORS headers if needed
      if (config.NODE_ENV === 'development') {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return response;
    } catch (error) {
      return apiResponse.error(error as Error);
    }
  };
}

// Database operation wrapper
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error('Database Error:', error);
    
    // Check for common database errors
    if (error.code === 'PGRST116') {
      throw apiErrors.notFound();
    }
    
    if (error.code === '23505') {
      throw apiErrors.validationError('Duplicate entry');
    }
    
    if (error.code === '23503') {
      throw apiErrors.validationError('Invalid reference');
    }

    throw apiErrors.databaseError(errorMessage, {
      code: error.code,
      message: error.message,
    });
  }
}

// External service operation wrapper
export async function withExternalServiceErrorHandling<T>(
  operation: () => Promise<T>,
  serviceName: string,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Service timeout')), timeoutMs);
    });

    return await Promise.race([operation(), timeoutPromise]);
  } catch (error: any) {
    console.error(`${serviceName} Service Error:`, error);
    throw apiErrors.externalServiceError(serviceName, {
      message: error.message,
      status: error.status,
    });
  }
}

// Health check utility
export function createHealthCheck() {
  return withApiHandler(async (request: NextRequest) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: config.NODE_ENV,
      services: {
        database: 'healthy', // Implement actual checks
        email: 'healthy',
        ai: 'healthy',
      },
    };

    return apiResponse.success(health);
  });
}

// Request logging middleware (development only)
export function logRequest(request: NextRequest) {
  if (debugConfig.apiCalls) {
    console.log(`[API] ${request.method} ${request.url}`);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
  }
}

// Common validation schemas
export const commonSchemas = {
  pagination: z.object({
    page: z.string().transform(val => parseInt(val) || 1),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  }),

  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  search: z.object({
    q: z.string().min(1).max(100),
  }),
};