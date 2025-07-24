/**
 * API Request Tracking and Debug Enhancement
 * Comprehensive error tracking for production debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createApiLogger } from './logger';

interface ApiMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  error?: Error;
  statusCode?: number;
  responseSize?: number;
}

interface DebugContext {
  correlationId: string;
  userId?: string;
  sessionData?: any;
  requestBody?: any;
  validationErrors?: any[];
  databaseQueries?: string[];
  externalApiCalls?: string[];
}

export class ApiTracker {
  private metrics: ApiMetrics;
  private context: DebugContext;
  private logger: ReturnType<typeof createApiLogger>;

  constructor(
    private request: NextRequest,
    private endpoint: string
  ) {
    this.context = {
      correlationId: randomUUID()
    };
    
    this.metrics = {
      startTime: Date.now(),
      memoryUsage: process.memoryUsage()
    };

    this.logger = createApiLogger(request, this.context.correlationId);
    
    // Log request start
    this.logger.info(`API Request Started: ${endpoint}`, {
      method: request.method,
      url: request.url
    });
  }

  /**
   * Set user context from authentication
   */
  setUser(userId: string, sessionData?: any) {
    this.context.userId = userId;
    this.context.sessionData = sessionData;
    this.logger.setContext({ userId });
  }

  /**
   * Track request body (sanitized)
   */
  setRequestBody(body: any) {
    // Sanitize sensitive data
    const sanitized = this.sanitizeData(body);
    this.context.requestBody = sanitized;
    
    this.logger.debug('Request body received', {}, { 
      bodyKeys: Object.keys(body || {}),
      bodySize: JSON.stringify(body || {}).length 
    });
  }

  /**
   * Track validation errors
   */
  addValidationError(error: any) {
    if (!this.context.validationErrors) {
      this.context.validationErrors = [];
    }
    this.context.validationErrors.push(error);
    
    this.logger.warn('Validation error occurred', {}, { error });
  }

  /**
   * Track database queries
   */
  addDatabaseQuery(query: string) {
    if (!this.context.databaseQueries) {
      this.context.databaseQueries = [];
    }
    this.context.databaseQueries.push(query);
    
    this.logger.debug('Database query executed', {}, { query: query.substring(0, 100) });
  }

  /**
   * Track external API calls
   */
  addExternalApiCall(url: string, method: string = 'GET') {
    if (!this.context.externalApiCalls) {
      this.context.externalApiCalls = [];
    }
    this.context.externalApiCalls.push(`${method} ${url}`);
    
    this.logger.debug('External API call made', {}, { url, method });
  }

  /**
   * Track error with full context
   */
  trackError(error: Error, statusCode: number = 500) {
    this.metrics.error = error;
    this.metrics.statusCode = statusCode;
    
    // Comprehensive error logging with full context
    this.logger.error('API Error occurred', error, {}, {
      endpoint: this.endpoint,
      requestBody: this.context.requestBody,
      validationErrors: this.context.validationErrors,
      databaseQueries: this.context.databaseQueries?.length || 0,
      externalApiCalls: this.context.externalApiCalls?.length || 0,
      userId: this.context.userId,
      memoryUsage: this.metrics.memoryUsage,
      statusCode
    });
  }

  /**
   * Complete tracking and return response
   */
  complete(response: NextResponse | any, additionalData?: any): NextResponse {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    
    const statusCode = response.status || 200;
    this.metrics.statusCode = statusCode;
    
    // Log completion
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `API Request Completed: ${this.endpoint}`;
    
    const metadata = {
      statusCode,
      duration: this.metrics.duration,
      memoryDelta: this.getMemoryDelta(),
      databaseQueries: this.context.databaseQueries?.length || 0,
      externalApiCalls: this.context.externalApiCalls?.length || 0,
      ...additionalData
    };

    if (logLevel === 'error') {
      this.logger.error(message, this.metrics.error, {}, metadata);
    } else if (logLevel === 'warn') {
      this.logger.warn(message, {}, metadata);
    } else {
      this.logger.info(message, {}, metadata);
    }

    // Add debug headers in development
    if (process.env.NODE_ENV !== 'production') {
      response.headers.set('X-Debug-Correlation-ID', this.context.correlationId);
      response.headers.set('X-Debug-Duration', this.metrics.duration.toString());
      response.headers.set('X-Debug-Queries', (this.context.databaseQueries?.length || 0).toString());
    }

    return response;
  }

  /**
   * Get correlation ID for external use
   */
  getCorrelationId(): string {
    return this.context.correlationId;
  }

  /**
   * Create debug response with full context
   */
  createDebugResponse(data: any, status: number = 200): NextResponse {
    const debugInfo = process.env.NODE_ENV !== 'production' ? {
      debug: {
        correlationId: this.context.correlationId,
        duration: this.metrics.duration,
        queries: this.context.databaseQueries?.length || 0,
        validationErrors: this.context.validationErrors?.length || 0
      }
    } : {};

    return NextResponse.json({
      ...data,
      ...debugInfo
    }, { status });
  }

  /**
   * Sanitize sensitive data for logging
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sensitive = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Calculate memory usage delta
   */
  private getMemoryDelta() {
    const current = process.memoryUsage();
    const initial = this.metrics.memoryUsage!;
    
    return {
      heapUsed: current.heapUsed - initial.heapUsed,
      heapTotal: current.heapTotal - initial.heapTotal,
      external: current.external - initial.external
    };
  }
}

/**
 * Factory function to create API tracker
 */
export function createApiTracker(request: NextRequest, endpoint: string): ApiTracker {
  return new ApiTracker(request, endpoint);
}