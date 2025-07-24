/**
 * Unified User Identity Service
 * 
 * CRITICAL: Single source of truth for all user identity management
 * Eliminates UID coordination issues through email-based deterministic UUIDs
 * 
 * @author Agent Dev
 * @date 2025-07-24
 */

import { v5 as uuidv5 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';
import { logger, createRequestLogger } from '../debug/logger';

// WikiGaiaLab namespace for deterministic UUID generation
const WIKIGAIALAB_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

// Type definitions
interface OAuthUserData {
  id: string;          // OAuth provider ID (numeric, string, etc.)
  email: string;       // Email from OAuth provider
  name?: string;       // Display name
  image?: string;      // Profile image URL
  provider: string;    // 'google', 'github', etc.
}

interface UserData {
  id: string;          // Deterministic UUID
  email: string;       // Normalized email
  name: string;        // Display name
  image?: string;      // Profile image URL
  role?: 'user' | 'admin';
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthUser extends UserData {
  isAdmin: boolean;
  role: 'user' | 'admin';
}

// Custom error classes
class UserIdentityError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'UserIdentityError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public dbError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Unified User Identity Service
 * 
 * Core principles:
 * 1. Email-based deterministic UUIDs (same email = same UUID always)
 * 2. Atomic operations with database locking
 * 3. OAuth provider agnostic
 * 4. Comprehensive error handling and logging
 */
export class UserIdentityService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private logger: ReturnType<typeof createRequestLogger>;

  constructor(correlationId?: string) {
    // Initialize logger first to ensure it's available for error logging
    this.logger = createRequestLogger(correlationId || 'user-identity-service', 'system');
    
    try {
      // Then initialize Supabase client (which may throw errors)
      this.supabase = this.getSupabaseClient();
    } catch (error) {
      this.logger.error('UserIdentityService constructor failed', error as Error, {}, {
        correlationId: correlationId || 'user-identity-service'
      });
      throw error; // Re-throw to maintain error propagation
    }
  }

  /**
   * Generate deterministic UUID from email
   * CRITICAL: Same email will ALWAYS produce the same UUID
   */
  generateDeterministicUserId(email: string): string {
    try {
      this.logger.debug('Starting UUID generation', {}, {
        hasEmail: !!email,
        emailType: typeof email,
        emailLength: email?.length || 0
      });

      if (!email || typeof email !== 'string') {
        const error = new ValidationError('Email is required for user ID generation', 'email');
        this.logger.error('UUID generation failed: invalid email input', error, {}, {
          receivedEmail: email,
          emailType: typeof email
        });
        throw error;
      }

      // Normalize email: lowercase, trim whitespace
      const normalizedEmail = email.toLowerCase().trim();
      
      this.logger.debug('Email normalized', {}, {
        originalEmail: email,
        normalizedEmail,
        changed: email !== normalizedEmail
      });
      
      // Validate email format
      if (!this.isValidEmail(normalizedEmail)) {
        const error = new ValidationError('Invalid email format', 'email');
        this.logger.error('UUID generation failed: invalid email format', error, {}, {
          normalizedEmail,
          emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        });
        throw error;
      }

      // Generate deterministic UUID using namespace and normalized email
      const userId = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);
      
      this.logger.debug('Generated deterministic user ID', {}, {
        email: normalizedEmail,
        userId,
        namespace: WIKIGAIALAB_NAMESPACE,
        uuidValid: this.validateUserId(userId)
      });

      return userId;
    } catch (error) {
      this.logger.error('UUID generation failed with unexpected error', error as Error, {}, {
        email,
        errorType: error instanceof Error ? error.constructor.name : 'unknown'
      });
      throw error;
    }
  }

  /**
   * Validate UUID format
   */
  validateUserId(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Resolve user from OAuth data
   * CRITICAL: This is the main entry point for all user resolution
   */
  async resolveUser(oauthData: OAuthUserData): Promise<AuthUser> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting user resolution', {}, {
        provider: oauthData.provider,
        email: oauthData.email,
        hasName: !!oauthData.name
      });

      // Step 1: Generate deterministic user ID from email
      const userId = this.generateDeterministicUserId(oauthData.email);

      // Step 2: Ensure user exists in database with atomic operation
      const userData: UserData = {
        id: userId,
        email: oauthData.email.toLowerCase().trim(),
        name: oauthData.name || 'Unknown User',
        image: oauthData.image,
        role: 'user' // Default role
      };

      const user = await this.ensureUserExists(userData);
      
      const duration = Date.now() - startTime;
      this.logger.info('User resolution completed', {}, {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        duration
      });

      return user;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('User resolution failed', error as Error, {}, {
        provider: oauthData.provider,
        email: oauthData.email,
        duration
      });
      
      throw new UserIdentityError('Failed to resolve user from OAuth data', {
        provider: oauthData.provider,
        email: oauthData.email,
        originalError: error
      });
    }
  }

  /**
   * Ensure user exists in database with atomic operation
   * Uses upsert with conflict resolution to prevent race conditions
   */
  async ensureUserExists(userData: UserData): Promise<AuthUser> {
    try {
      this.logger.debug('Ensuring user exists in database', {}, {
        userId: userData.id,
        email: userData.email,
        hasName: !!userData.name,
        hasImage: !!userData.image,
        role: userData.role
      });

      // Prepare upsert data
      const upsertData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: userData.role || 'user',
        is_admin: userData.role === 'admin',
        updated_at: new Date().toISOString()
      };

      this.logger.debug('Preparing database upsert', {}, {
        upsertData: { ...upsertData, image: upsertData.image ? 'present' : 'null' },
        tableName: 'users'
      });

      // Use atomic upsert operation to prevent race conditions
      const { data: user, error } = await this.supabase
        .from('users')
        .upsert(upsertData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .single();

      if (error) {
        this.logger.error('Database upsert failed', error, {}, {
          userId: userData.id,
          email: userData.email,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          upsertData: { ...upsertData, image: upsertData.image ? 'present' : 'null' }
        });
        
        throw new DatabaseError('Failed to create or update user', error);
      }

      if (!user) {
        this.logger.error('Database upsert returned no data', new Error('No user data returned'), {}, {
          userId: userData.id,
          email: userData.email,
          upsertData: { ...upsertData, image: upsertData.image ? 'present' : 'null' }
        });
        throw new DatabaseError('User upsert returned no data');
      }

      this.logger.debug('Database upsert successful', {}, {
        userId: user.id,
        email: user.email,
        returnedData: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasImage: !!user.image,
          role: user.role,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });

      // Transform to AuthUser format
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown User',
        image: user.image || undefined,
        role: (user.role as 'user' | 'admin') || 'user',
        isAdmin: user.is_admin || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      this.logger.debug('User ensured in database', {}, {
        userId: authUser.id,
        email: authUser.email,
        isAdmin: authUser.isAdmin,
        role: authUser.role
      });

      return authUser;

    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      this.logger.error('Unexpected error in ensureUserExists', error as Error, {}, {
        userId: userData.id,
        email: userData.email,
        errorType: error instanceof Error ? error.constructor.name : 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new UserIdentityError('Failed to ensure user exists', {
        userData,
        originalError: error
      });
    }
  }

  /**
   * Sync user session data
   * Updates user information from fresh OAuth data
   * Supports both UUID and email-based user resolution
   */
  async syncUserSession(userId: string, sessionData: Partial<UserData>): Promise<AuthUser> {
    try {
      this.logger.debug('Syncing user session data', {}, {
        userId,
        hasEmail: !!sessionData.email,
        hasName: !!sessionData.name
      });

      // If userId is not a valid UUID, try to resolve from email
      let resolvedUserId = userId;
      if (!this.validateUserId(userId)) {
        this.logger.debug('Invalid UUID format, attempting email-based resolution', {}, {
          providedUserId: userId,
          email: sessionData.email
        });
        
        if (!sessionData.email) {
          throw new ValidationError('Either valid user ID or email is required for session sync', 'userId');
        }
        
        // Generate deterministic UUID from email
        resolvedUserId = this.generateDeterministicUserId(sessionData.email);
        
        this.logger.debug('Generated deterministic user ID from email', {}, {
          originalId: userId,
          generatedId: resolvedUserId,
          email: sessionData.email
        });
      }

      // Get current user data using resolved user ID
      const { data: currentUser, error: fetchError } = await this.supabase
        .from('users')
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .eq('id', resolvedUserId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User not found - create user with session data
          this.logger.debug('User not found, creating new user', {}, {
            resolvedUserId,
            email: sessionData.email
          });
          
          // Create new user with session data
          const userData: UserData = {
            id: resolvedUserId,
            email: sessionData.email || '',
            name: sessionData.name || 'Unknown User',
            image: sessionData.image,
            role: 'user'
          };
          
          return await this.ensureUserExists(userData);
        }
        
        throw new DatabaseError('Failed to fetch user for session sync', fetchError);
      }

      // Update with new session data
      const updatedData = {
        name: sessionData.name || currentUser.name,
        image: sessionData.image || currentUser.image,
        updated_at: new Date().toISOString()
      };

      const { data: updatedUser, error: updateError } = await this.supabase
        .from('users')
        .update(updatedData)
        .eq('id', resolvedUserId)
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .single();

      if (updateError) {
        throw new DatabaseError('Failed to update user session data', updateError);
      }

      const authUser: AuthUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || 'Unknown User',
        image: updatedUser.image || undefined,
        role: (updatedUser.role as 'user' | 'admin') || 'user',
        isAdmin: updatedUser.is_admin || false,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      };

      this.logger.debug('User session synced successfully', {}, {
        userId: authUser.id,
        email: authUser.email
      });

      return authUser;

    } catch (error) {
      this.logger.error('User session sync failed', error as Error, {}, {
        originalUserId: userId,
        resolvedUserId: resolvedUserId || 'not-resolved',
        sessionData,
        errorType: error instanceof Error ? error.constructor.name : 'unknown'
      });
      
      // Re-throw with more context for production debugging
      if (error instanceof UserIdentityError || error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new UserIdentityError('Failed to sync user session', {
        originalUserId: userId,
        sessionData,
        originalError: error
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      if (!this.validateUserId(userId)) {
        throw new ValidationError('Invalid user ID format', 'userId');
      }

      const { data: user, error } = await this.supabase
        .from('users')
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new DatabaseError('Failed to fetch user by ID', error);
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown User',
        image: user.image || undefined,
        role: (user.role as 'user' | 'admin') || 'user',
        isAdmin: user.is_admin || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

    } catch (error) {
      this.logger.error('Get user by ID failed', error as Error, {}, { userId });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      if (!this.isValidEmail(normalizedEmail)) {
        throw new ValidationError('Invalid email format', 'email');
      }

      const { data: user, error } = await this.supabase
        .from('users')
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .eq('email', normalizedEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new DatabaseError('Failed to fetch user by email', error);
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown User',
        image: user.image || undefined,
        role: (user.role as 'user' | 'admin') || 'user',
        isAdmin: user.is_admin || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

    } catch (error) {
      this.logger.error('Get user by email failed', error as Error, {}, { email });
      throw error;
    }
  }

  /**
   * Initialize Supabase client with enhanced error handling
   */
  private getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    this.logger.debug('Initializing Supabase client', {}, {
      nodeEnv: process.env.NODE_ENV,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl?.substring(0, 50) + '...'
    });
    
    if (!supabaseUrl) {
      const error = new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
      this.logger.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable', error, {}, {
        nodeEnv: process.env.NODE_ENV,
        hasUrl: false,
        hasKey: !!supabaseKey,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      });
      throw error;
    }
    
    if (!supabaseKey) {
      const error = new Error('SUPABASE_SERVICE_KEY environment variable is required');
      this.logger.error('Missing SUPABASE_SERVICE_KEY environment variable', error, {}, {
        nodeEnv: process.env.NODE_ENV,
        hasUrl: !!supabaseUrl,
        hasKey: false,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      });
      throw error;
    }
    
    try {
      const client = createClient<Database>(supabaseUrl, supabaseKey);
      
      this.logger.debug('Supabase client initialized successfully', {}, {
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        hasServiceKey: !!supabaseKey,
        clientCreated: !!client
      });
      
      return client;
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client', error as Error, {}, {
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.constructor.name : 'unknown'
      });
      throw new Error('Failed to initialize Supabase client: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

// Export types for use in other modules
export type { OAuthUserData, UserData, AuthUser };
export { UserIdentityError, DatabaseError, ValidationError };

// Export factory function for proper instance management
export function getUserIdentityService(correlationId?: string): UserIdentityService {
  try {
    // Always create a new instance for proper correlation tracking
    // This ensures each request has its own service instance with correct correlation ID
    return new UserIdentityService(correlationId);
  } catch (error) {
    // If service creation fails, provide a more detailed error
    const serviceError = new Error(`Failed to create UserIdentityService: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('❌ getUserIdentityService factory failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw serviceError;
  }
}

// Export class for custom instances when needed
export default UserIdentityService;