/**
 * Enhanced Authentication Validation
 * 
 * A+ Security Implementation - Comprehensive auth validation
 * @author BMad Orchestrator Security Team
 * @date 2025-07-22
 */

import { auth } from '@/lib/auth-nextauth';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';
import { randomUUID } from 'crypto';

// User validation result
export interface UserValidationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
  };
  error?: string;
  shouldRefreshSession?: boolean;
}

// Session security context
export interface SecurityContext {
  sessionId: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  timestamp: string;
  riskScore: number;
}

// Initialize Supabase client for user validation
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// Enhanced user session validation
export async function validateUserSession(
  correlationId: string = randomUUID()
): Promise<UserValidationResult> {
  try {
    // Get NextAuth session
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No active session found'
      };
    }

    // Validate session structure
    if (!session.user.email || !session.user.id) {
      return {
        success: false,
        error: 'Invalid session structure',
        shouldRefreshSession: true
      };
    }

    // Verify user exists in database and is active
    const supabase = getSupabaseClient();
    
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, is_active, last_login_at, created_at')
      .eq('id', session.user.id)
      .single();

    if (dbError) {
      console.error('Database user validation failed:', {
        correlationId,
        userId: session.user.id,
        error: dbError.message
      });
      
      return {
        success: false,
        error: 'User validation failed'
      };
    }

    if (!dbUser) {
      return {
        success: false,
        error: 'User not found in database',
        shouldRefreshSession: true
      };
    }

    if (!dbUser.is_active) {
      return {
        success: false,
        error: 'User account is deactivated'
      };
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id);

    return {
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || 'Unknown User',
        isActive: dbUser.is_active,
        lastLoginAt: dbUser.last_login_at || undefined,
        createdAt: dbUser.created_at
      }
    };

  } catch (error) {
    console.error('User session validation error:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: 'Session validation failed'
    };
  }
}

// Ensure user exists in database (upsert with validation)
export async function ensureUserExists(
  sessionUser: any,
  correlationId: string = randomUUID()
): Promise<UserValidationResult> {
  try {
    if (!sessionUser?.id || !sessionUser?.email) {
      return {
        success: false,
        error: 'Invalid user session data'
      };
    }

    const supabase = getSupabaseClient();
    
    const userData = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name || 'Unknown User',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    };

    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id'
      })
      .select('id, email, name, is_active, created_at')
      .single();

    if (upsertError) {
      console.error('User upsert failed:', {
        correlationId,
        userId: sessionUser.id,
        error: upsertError.message
      });

      return {
        success: false,
        error: 'Failed to synchronize user account'
      };
    }

    return {
      success: true,
      user: {
        id: upsertedUser.id,
        email: upsertedUser.email,
        name: upsertedUser.name || 'Unknown User',
        isActive: upsertedUser.is_active,
        createdAt: upsertedUser.created_at
      }
    };

  } catch (error) {
    console.error('User synchronization error:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: 'User synchronization failed'
    };
  }
}

// Create security context for request tracking
export function createSecurityContext(
  request: Request,
  userId: string
): SecurityContext {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // Simple risk scoring based on various factors
  let riskScore = 0;
  
  // Check for suspicious user agents
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('curl')) {
    riskScore += 30;
  }
  
  // Check for missing IP
  if (ipAddress === 'unknown') {
    riskScore += 20;
  }

  return {
    sessionId: randomUUID(),
    userId,
    userAgent,
    ipAddress,
    timestamp: new Date().toISOString(),
    riskScore
  };
}

// Validate request against security context
export function validateSecurityContext(context: SecurityContext): boolean {
  // Block high-risk requests
  if (context.riskScore > 50) {
    console.warn('High-risk request blocked:', {
      userId: context.userId,
      riskScore: context.riskScore,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress
    });
    return false;
  }

  return true;
}