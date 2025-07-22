/**
 * Secure Error Handling System
 * 
 * A+ Security Implementation - Prevents information disclosure
 * @author BMad Orchestrator Security Team
 * @date 2025-07-22
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better classification
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

// Structured error interface
export interface SecureError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  statusCode: number;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

// Error logging service (replace with your preferred logger)
class ErrorLogger {
  static log(error: SecureError): void {
    const logEntry = {
      ...error,
      environment: process.env.NODE_ENV,
      service: 'wikigaialab-api'
    };

    // In production, send to your logging service (DataDog, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURE_ERROR:', JSON.stringify(logEntry));
      // TODO: Send to external logging service
    } else {
      console.error('Development Error:', logEntry);
    }

    // Alert on critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      // TODO: Send to alerting system (PagerDuty, Slack, etc.)
      console.error('CRITICAL ERROR ALERT:', error.code);
    }
  }
}

// Create secure error with sanitized user message
export function createSecureError(
  originalError: any,
  category: ErrorCategory,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  correlationId?: string
): SecureError {
  const errorCode = randomUUID().slice(0, 8).toUpperCase();
  
  const secureError: SecureError = {
    code: errorCode,
    category,
    severity,
    message: originalError?.message || 'Unknown error occurred',
    userMessage: getUserFriendlyMessage(category, severity),
    statusCode: getStatusCodeForCategory(category),
    timestamp: new Date().toISOString(),
    correlationId,
    metadata: {
      stack: originalError?.stack,
      name: originalError?.name,
      cause: originalError?.cause
    }
  };

  // Log the error securely
  ErrorLogger.log(secureError);

  return secureError;
}

// Get user-friendly message without exposing internals
function getUserFriendlyMessage(category: ErrorCategory, severity: ErrorSeverity): string {
  const messages = {
    [ErrorCategory.VALIDATION]: 'Invalid input provided. Please check your data and try again.',
    [ErrorCategory.AUTHENTICATION]: 'Authentication required. Please sign in and try again.',
    [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ErrorCategory.DATABASE]: 'A temporary service issue occurred. Please try again later.',
    [ErrorCategory.EXTERNAL_SERVICE]: 'External service unavailable. Please try again later.',
    [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please wait before trying again.',
    [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again later.'
  };

  if (severity === ErrorSeverity.CRITICAL) {
    return 'A critical system error occurred. Our team has been notified.';
  }

  return messages[category];
}

// Map error categories to appropriate HTTP status codes
function getStatusCodeForCategory(category: ErrorCategory): number {
  const statusCodes = {
    [ErrorCategory.VALIDATION]: 400,
    [ErrorCategory.AUTHENTICATION]: 401,
    [ErrorCategory.AUTHORIZATION]: 403,
    [ErrorCategory.DATABASE]: 503,
    [ErrorCategory.EXTERNAL_SERVICE]: 502,
    [ErrorCategory.RATE_LIMIT]: 429,
    [ErrorCategory.UNKNOWN]: 500
  };

  return statusCodes[category];
}

// Create secure API response
export function createSecureResponse(
  error: SecureError,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const responseBody = {
    success: false,
    error: {
      code: error.code,
      message: error.userMessage,
      category: error.category
    },
    timestamp: error.timestamp,
    ...(error.correlationId && { correlationId: error.correlationId })
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Error-Code': error.code,
    'X-Request-ID': error.correlationId || 'unknown',
    ...additionalHeaders
  };

  return NextResponse.json(responseBody, {
    status: error.statusCode,
    headers
  });
}

// Validation error handler
export function handleValidationError(
  validationError: any,
  correlationId?: string
): SecureError {
  return createSecureError(
    validationError,
    ErrorCategory.VALIDATION,
    ErrorSeverity.LOW,
    correlationId
  );
}

// Database error handler
export function handleDatabaseError(
  dbError: any,
  correlationId?: string
): SecureError {
  // Check for specific database error types
  if (dbError?.code === '23505') { // Unique constraint violation
    return createSecureError(
      new Error('Duplicate entry'),
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      correlationId
    );
  }

  if (dbError?.code === '23503') { // Foreign key constraint violation
    return createSecureError(
      new Error('Referenced record not found'),
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      correlationId
    );
  }

  // Generic database error
  return createSecureError(
    dbError,
    ErrorCategory.DATABASE,
    ErrorSeverity.HIGH,
    correlationId
  );
}

// Authentication error handler
export function handleAuthError(
  authError: any,
  correlationId?: string
): SecureError {
  return createSecureError(
    authError,
    ErrorCategory.AUTHENTICATION,
    ErrorSeverity.MEDIUM,
    correlationId
  );
}

// Rate limit error handler
export function handleRateLimitError(
  retryAfter: number,
  correlationId?: string
): SecureError {
  return createSecureError(
    new Error(`Rate limit exceeded, retry after ${retryAfter} seconds`),
    ErrorCategory.RATE_LIMIT,
    ErrorSeverity.MEDIUM,
    correlationId
  );
}