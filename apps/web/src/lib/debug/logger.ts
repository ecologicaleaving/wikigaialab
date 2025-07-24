/**
 * Production-Ready Structured Logger
 * Scalable debugging and monitoring solution
 */

interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  timestamp?: string;
  environment?: string;
  [key: string]: any;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  context: LogContext;
  error?: Error;
  stack?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class ProductionLogger {
  private context: LogContext = {};
  private isProduction = process.env.NODE_ENV === 'production';
  
  constructor() {
    this.context.environment = process.env.NODE_ENV || 'development';
    this.context.timestamp = new Date().toISOString();
  }

  /**
   * Set global context for all logs in this instance
   */
  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Create child logger with inherited context
   */
  child(context: Partial<LogContext>) {
    const childLogger = new ProductionLogger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Structured logging with correlation
   */
  private log(entry: LogEntry) {
    const logEntry = {
      ...entry,
      context: { ...this.context, ...entry.context },
      timestamp: new Date().toISOString(),
    };

    // Console output (structured for production parsing)
    if (this.isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      // Development-friendly output
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        critical: '🚨'
      }[entry.level];
      
      console.log(`${emoji} [${entry.level.toUpperCase()}] ${entry.message}`);
      if (Object.keys(entry.context).length > 0) {
        console.log('Context:', entry.context);
      }
      if (entry.metadata) {
        console.log('Metadata:', entry.metadata);
      }
      if (entry.error) {
        console.error('Error:', entry.error);
      }
    }

    // Send to external monitoring (implement as needed)
    this.sendToMonitoring(logEntry);
  }

  debug(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, any>) {
    this.log({ level: 'debug', message, context, metadata });
  }

  info(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, any>) {
    this.log({ level: 'info', message, context, metadata });
  }

  warn(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, any>) {
    this.log({ level: 'warn', message, context, metadata });
  }

  error(message: string, error?: Error, context: Partial<LogContext> = {}, metadata?: Record<string, any>) {
    this.log({ 
      level: 'error', 
      message, 
      context, 
      metadata,
      error,
      stack: error?.stack 
    });
  }

  critical(message: string, error?: Error, context: Partial<LogContext> = {}, metadata?: Record<string, any>) {
    this.log({ 
      level: 'critical', 
      message, 
      context, 
      metadata,
      error,
      stack: error?.stack 
    });
  }

  /**
   * Time execution and log performance
   */
  time<T>(operation: string, fn: () => Promise<T>): Promise<T>;
  time<T>(operation: string, fn: () => T): T;
  time<T>(operation: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            this.info(`Operation completed: ${operation}`, {}, { duration, status: 'success' });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.error(`Operation failed: ${operation}`, error, {}, { duration, status: 'error' });
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        this.info(`Operation completed: ${operation}`, {}, { duration, status: 'success' });
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operation}`, error as Error, {}, { duration, status: 'error' });
      throw error;
    }
  }

  /**
   * Send logs to external monitoring service
   */
  private sendToMonitoring(logEntry: LogEntry) {
    // Implement integration with monitoring services:
    // - Vercel Analytics
    // - Sentry
    // - DataDog
    // - Custom webhook
    
    // Example: Only send errors and critical logs in production
    if (this.isProduction && ['error', 'critical'].includes(logEntry.level)) {
      // Implementation would go here
    }
  }
}

// Global logger instance
export const logger = new ProductionLogger();

// Request-scoped logger factory
export function createRequestLogger(correlationId: string, userId?: string) {
  return logger.child({ correlationId, userId });
}

// API route logger factory
export function createApiLogger(req: any, correlationId: string) {
  return logger.child({
    correlationId,
    method: req.method,
    endpoint: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  });
}