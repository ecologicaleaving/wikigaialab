/**
 * Comprehensive Error Monitoring and Logging System
 * Phase 1 Fix: Add comprehensive error monitoring
 */

import { config, isProduction, debugConfig } from './env';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  DATABASE = 'database',
  API = 'api',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  EXTERNAL_SERVICE = 'external_service',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_INTERFACE = 'ui',
  BUSINESS_LOGIC = 'business_logic'
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

// Error report interface
export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  fingerprint: string; // For deduplication
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  tags: string[];
}

// Error monitoring class
class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: Map<string, ErrorReport> = new Map();
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 1000;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  constructor() {
    // Start batch processing
    setInterval(() => {
      this.flushErrors();
    }, this.flushInterval);

    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Capture unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          ErrorCategory.BUSINESS_LOGIC,
          ErrorSeverity.HIGH,
          { source: 'unhandledrejection' }
        );
      });

      // Capture unhandled errors
      window.addEventListener('error', (event) => {
        this.captureError(
          event.error || new Error(event.message),
          ErrorCategory.USER_INTERFACE,
          ErrorSeverity.MEDIUM,
          {
            source: 'window.error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );
      });

      // Capture resource loading errors
      window.addEventListener('error', (event) => {
        if (event.target && event.target !== window) {
          this.captureError(
            new Error(`Resource loading failed: ${(event.target as any).src || (event.target as any).href}`),
            ErrorCategory.NETWORK,
            ErrorSeverity.LOW,
            { source: 'resource_error', target: event.target }
          );
        }
      }, true);
    }

    // Node.js error handlers
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.captureError(
          error,
          ErrorCategory.BUSINESS_LOGIC,
          ErrorSeverity.CRITICAL,
          { source: 'uncaughtException' }
        );
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.captureError(
          reason instanceof Error ? reason : new Error(String(reason)),
          ErrorCategory.BUSINESS_LOGIC,
          ErrorSeverity.HIGH,
          { source: 'unhandledRejection', promise }
        );
      });
    }
  }

  // Generate fingerprint for error deduplication
  private generateFingerprint(error: Error, category: ErrorCategory, context: Partial<ErrorContext>): string {
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';
    const location = context.url || 'unknown';
    
    // Create a stable hash based on error characteristics
    const combined = `${category}:${message}:${stack.split('\n')[0]}:${location}`;
    
    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Capture and process error
  captureError(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity,
    additionalContext: Record<string, any> = {}
  ): string {
    try {
      const now = new Date();
      const context: ErrorContext = {
        timestamp: now,
        ...this.getRequestContext(),
        ...additionalContext
      };

      const fingerprint = this.generateFingerprint(error, category, context);
      const errorId = `${fingerprint}-${now.getTime()}`;

      // Check if we've seen this error before
      const existingError = this.errors.get(fingerprint);
      
      if (existingError) {
        // Update existing error
        existingError.count++;
        existingError.lastSeen = now;
        existingError.context = context; // Update with latest context
      } else {
        // Create new error report
        const errorReport: ErrorReport = {
          id: errorId,
          message: error.message || 'Unknown error',
          stack: error.stack,
          severity,
          category,
          context,
          fingerprint,
          count: 1,
          firstSeen: now,
          lastSeen: now,
          resolved: false,
          tags: this.generateTags(error, category, context)
        };

        this.errors.set(fingerprint, errorReport);
        this.errorQueue.push(errorReport);
      }

      // Log error based on configuration
      this.logError(this.errors.get(fingerprint)!);

      // Immediate flush for critical errors
      if (severity === ErrorSeverity.CRITICAL) {
        this.flushErrors();
      }

      // Alert for security errors
      if (category === ErrorCategory.SECURITY) {
        this.sendSecurityAlert(this.errors.get(fingerprint)!);
      }

      return errorId;
    } catch (captureError) {
      console.error('Error monitoring failed:', captureError);
      return 'monitor-error';
    }
  }

  // Generate relevant tags for error categorization
  private generateTags(error: Error, category: ErrorCategory, context: ErrorContext): string[] {
    const tags: string[] = [category];

    // Add environment tag
    tags.push(config.NODE_ENV);

    // Add severity-based tags
    if (context.userId) tags.push('authenticated');
    else tags.push('anonymous');

    // Add error type tags
    if (error.name) tags.push(error.name.toLowerCase());

    // Add URL-based tags
    if (context.url) {
      if (context.url.includes('/api/')) tags.push('api');
      if (context.url.includes('/admin/')) tags.push('admin');
    }

    // Add user agent tags
    if (context.userAgent) {
      if (context.userAgent.includes('Mobile')) tags.push('mobile');
      if (context.userAgent.includes('Chrome')) tags.push('chrome');
      if (context.userAgent.includes('Safari')) tags.push('safari');
      if (context.userAgent.includes('Firefox')) tags.push('firefox');
    }

    return tags;
  }

  // Get current request context
  private getRequestContext(): Partial<ErrorContext> {
    const context: Partial<ErrorContext> = {};

    // Browser context
    if (typeof window !== 'undefined') {
      context.url = window.location.href;
      context.userAgent = navigator.userAgent;
      
      // Try to get user ID from local storage or cookies
      try {
        const userSession = localStorage.getItem('sb-user-session');
        if (userSession) {
          const session = JSON.parse(userSession);
          context.userId = session.user?.id;
        }
      } catch (e) {
        // Ignore storage errors
      }
    }

    return context;
  }

  // Log error based on severity and configuration
  private logError(error: ErrorReport): void {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨', logMessage, error);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌', logMessage, debugConfig.enabled ? error : error.message);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️', logMessage, debugConfig.enabled ? error : error.message);
        break;
      case ErrorSeverity.LOW:
        if (debugConfig.enabled) {
          console.log('ℹ️', logMessage, error);
        }
        break;
    }
  }

  // Send security alert for security-related errors
  private async sendSecurityAlert(error: ErrorReport): Promise<void> {
    try {
      // In production, this would send to a security monitoring service
      console.error('🔒 SECURITY ALERT:', error);
      
      // Send to security endpoint
      if (isProduction) {
        await fetch('/api/security/alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      }
    } catch (alertError) {
      console.error('Failed to send security alert:', alertError);
    }
  }

  // Flush error queue to external services
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const batch = this.errorQueue.splice(0, this.batchSize);
    
    try {
      // Send to external monitoring service (Sentry, DataDog, etc.)
      await this.sendToMonitoringService(batch);
      
      // Store in database for internal analytics
      await this.storeInDatabase(batch);
    } catch (flushError) {
      console.error('Failed to flush errors:', flushError);
      // Put errors back in queue for retry
      this.errorQueue.unshift(...batch);
    }
  }

  // Send errors to external monitoring service
  private async sendToMonitoringService(errors: ErrorReport[]): Promise<void> {
    if (!isProduction) return; // Only send in production

    try {
      // This would integrate with Sentry, DataDog, or similar service
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      console.warn('Failed to send to monitoring service:', error);
    }
  }

  // Store errors in database for internal analytics
  private async storeInDatabase(errors: ErrorReport[]): Promise<void> {
    try {
      await fetch('/api/internal/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      console.warn('Failed to store errors in database:', error);
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorReport[];
    unresolvedErrors: number;
  } {
    const errors = Array.from(this.errors.values());
    
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    
    // Initialize counters
    Object.values(ErrorCategory).forEach(cat => errorsByCategory[cat] = 0);
    Object.values(ErrorSeverity).forEach(sev => errorsBySeverity[sev] = 0);
    
    // Count errors
    errors.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: errors
        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
        .slice(0, 10),
      unresolvedErrors: errors.filter(e => !e.resolved).length
    };
  }

  // Mark error as resolved
  resolveError(fingerprint: string): boolean {
    const error = this.errors.get(fingerprint);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  // Clear resolved errors
  clearResolvedErrors(): number {
    const resolved = Array.from(this.errors.entries())
      .filter(([_, error]) => error.resolved);
    
    resolved.forEach(([fingerprint]) => {
      this.errors.delete(fingerprint);
    });
    
    return resolved.length;
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Convenience functions for common error types
export function captureApiError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.API, ErrorSeverity.MEDIUM, context);
}

export function captureDatabaseError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.DATABASE, ErrorSeverity.HIGH, context);
}

export function captureAuthError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context);
}

export function captureSecurityError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.SECURITY, ErrorSeverity.CRITICAL, context);
}

export function captureValidationError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
}

export function captureNetworkError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, context);
}

export function capturePerformanceError(error: Error, context: Record<string, any> = {}): string {
  return errorMonitor.captureError(error, ErrorCategory.PERFORMANCE, ErrorSeverity.MEDIUM, context);
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, {
    duration: number;
    timestamp: Date;
  }[]> = new Map();

  static startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const metrics = this.metrics.get(label) || [];
      
      metrics.push({
        duration,
        timestamp: new Date()
      });
      
      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      this.metrics.set(label, metrics);
      
      // Log slow operations
      if (duration > 1000) {
        capturePerformanceError(
          new Error(`Slow operation: ${label} took ${duration.toFixed(2)}ms`),
          { label, duration }
        );
      }
    };
  }

  static getMetrics(label: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) return null;
    
    const durations = metrics.map(m => m.duration);
    
    return {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }

  static getAllMetrics(): Record<string, ReturnType<typeof PerformanceMonitor.getMetrics>> {
    const result: Record<string, any> = {};
    
    for (const [label] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }
}

// Health check for error monitoring system
export function getErrorMonitoringHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: any;
} {
  try {
    const stats = errorMonitor.getErrorStats();
    const criticalErrors = stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0;
    const highErrors = stats.errorsBySeverity[ErrorSeverity.HIGH] || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalErrors > 0) {
      status = 'unhealthy';
    } else if (highErrors > 10) {
      status = 'degraded';
    }
    
    return {
      status,
      metrics: {
        ...stats,
        performanceMetrics: PerformanceMonitor.getAllMetrics()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      metrics: { error: 'Error monitoring system failure' }
    };
  }
}