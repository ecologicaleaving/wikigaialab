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
    this.supabase = this.getSupabaseClient();
    this.logger = createRequestLogger(correlationId || 'user-identity-service', 'system');
  }

  /**
   * Generate deterministic UUID from email
   * CRITICAL: Same email will ALWAYS produce the same UUID
   */
  generateDeterministicUserId(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required for user ID generation', 'email');
    }

    // Normalize email: lowercase, trim whitespace
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    if (!this.isValidEmail(normalizedEmail)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    // Generate deterministic UUID using namespace and normalized email
    const userId = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);
    
    this.logger.debug('Generated deterministic user ID', {}, {
      email: normalizedEmail,
      userId,
      namespace: WIKIGAIALAB_NAMESPACE
    });

    return userId;
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
        email: userData.email
      });

      // Use atomic upsert operation to prevent race conditions
      const { data: user, error } = await this.supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          image: userData.image,
          role: userData.role || 'user',
          is_admin: userData.role === 'admin',
          updated_at: new Date().toISOString()
        }, {
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
          errorMessage: error.message
        });
        
        throw new DatabaseError('Failed to create or update user', error);
      }

      if (!user) {
        throw new DatabaseError('User upsert returned no data');
      }

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
        email: userData.email
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
   */
  async syncUserSession(userId: string, sessionData: Partial<UserData>): Promise<AuthUser> {
    try {
      this.logger.debug('Syncing user session data', {}, {
        userId,
        hasEmail: !!sessionData.email,
        hasName: !!sessionData.name
      });

      // Validate user ID format
      if (!this.validateUserId(userId)) {
        throw new ValidationError('Invalid user ID format', 'userId');
      }

      // Get current user data
      const { data: currentUser, error: fetchError } = await this.supabase
        .from('users')
        .select('id, email, name, image, role, is_admin, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User not found - this shouldn't happen with deterministic IDs
          throw new UserIdentityError('User not found during session sync', {
            userId,
            errorCode: fetchError.code
          });
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
        .eq('id', userId)
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
        userId,
        sessionData
      });
      
      throw error;
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
   * Initialize Supabase client
   */
  private getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    return createClient<Database>(supabaseUrl, supabaseKey);
  }
}

// Export types for use in other modules
export type { OAuthUserData, UserData, AuthUser };
export { UserIdentityError, DatabaseError, ValidationError };

// Export singleton instance for consistent usage
let serviceInstance: UserIdentityService | null = null;

export function getUserIdentityService(correlationId?: string): UserIdentityService {
  if (!serviceInstance) {
    serviceInstance = new UserIdentityService(correlationId);
  }
  return serviceInstance;
}

// Export class for custom instances when needed
export default UserIdentityService;