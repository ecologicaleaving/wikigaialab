import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  getAuthErrorMessage,
  hasRole,
  AUTH_ERROR_MESSAGES,
} from '../../../src/lib/auth-utils';
import { AuthUser } from '../../../src/types/auth';

// Mock Supabase
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthErrorMessage', () => {
    it('should return correct Italian message for invalid credentials', () => {
      const error = 'Invalid login credentials';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should return correct Italian message for email not confirmed', () => {
      const error = 'Email not confirmed';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED);
    });

    it('should return correct Italian message for weak password', () => {
      const error = 'Password should be at least 6 characters';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.WEAK_PASSWORD);
    });

    it('should return correct Italian message for network error', () => {
      const error = 'Network request failed';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should return correct Italian message for OAuth error', () => {
      const error = 'OAuth error';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.OAUTH_ERROR);
    });

    it('should return correct Italian message for session expired', () => {
      const error = 'JWT expired';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.SESSION_EXPIRED);
    });

    it('should return generic error message for unknown error', () => {
      const error = 'Unknown error';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.GENERIC_ERROR);
    });

    it('should handle Error objects', () => {
      const error = new Error('Invalid login credentials');
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should handle case-insensitive matching', () => {
      const error = 'INVALID LOGIN CREDENTIALS';
      const result = getAuthErrorMessage(error);
      expect(result).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    });
  });

  describe('hasRole', () => {
    const mockUser: AuthUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null,
      auth_provider: 'google',
      created_at: '2023-01-01T00:00:00Z',
      last_login_at: '2023-01-01T00:00:00Z',
      total_votes_cast: 0,
      total_problems_proposed: 0,
      is_admin: false,
      stripe_customer_id: null,
      subscription_status: null,
    };

    it('should return false for null user', () => {
      expect(hasRole(null, 'user')).toBe(false);
      expect(hasRole(null, 'admin')).toBe(false);
    });

    it('should return true for user role with regular user', () => {
      expect(hasRole(mockUser, 'user')).toBe(true);
    });

    it('should return false for admin role with regular user', () => {
      expect(hasRole(mockUser, 'admin')).toBe(false);
    });

    it('should return true for admin role with admin user', () => {
      const adminUser = { ...mockUser, is_admin: true };
      expect(hasRole(adminUser, 'admin')).toBe(true);
    });

    it('should return true for user role with admin user', () => {
      const adminUser = { ...mockUser, is_admin: true };
      expect(hasRole(adminUser, 'user')).toBe(true);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return "Utente" for null user', () => {
      expect(getUserDisplayName(null)).toBe('Utente');
    });

    it('should return user name when available', () => {
      const user: AuthUser = {
        id: '123',
        email: 'test@example.com',
        name: 'John Doe',
        avatar_url: null,
        auth_provider: 'google',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
        total_votes_cast: 0,
        total_problems_proposed: 0,
        is_admin: false,
        stripe_customer_id: null,
        subscription_status: null,
      };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should return email prefix when name is not available', () => {
      const user: AuthUser = {
        id: '123',
        email: 'test@example.com',
        name: null,
        avatar_url: null,
        auth_provider: 'google',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
        total_votes_cast: 0,
        total_problems_proposed: 0,
        is_admin: false,
        stripe_customer_id: null,
        subscription_status: null,
      };
      expect(getUserDisplayName(user)).toBe('test');
    });

    it('should return "Utente" when name is empty string', () => {
      const user: AuthUser = {
        id: '123',
        email: 'test@example.com',
        name: '',
        avatar_url: null,
        auth_provider: 'google',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
        total_votes_cast: 0,
        total_problems_proposed: 0,
        is_admin: false,
        stripe_customer_id: null,
        subscription_status: null,
      };
      expect(getUserDisplayName(user)).toBe('Utente');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false for null user', () => {
      expect(isAuthenticated(null)).toBe(false);
    });

    it('should return true for valid user', () => {
      const user: AuthUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        auth_provider: 'google',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
        total_votes_cast: 0,
        total_problems_proposed: 0,
        is_admin: false,
        stripe_customer_id: null,
        subscription_status: null,
      };
      expect(isAuthenticated(user)).toBe(true);
    });
  });

  describe('createAuthError', () => {
    it('should create auth error with message only', () => {
      const error = createAuthError('Test error');
      expect(error).toEqual({
        message: 'Test error',
        code: undefined,
        statusCode: undefined,
      });
    });

    it('should create auth error with all parameters', () => {
      const error = createAuthError('Test error', 'TEST_CODE', 400);
      expect(error).toEqual({
        message: 'Test error',
        code: 'TEST_CODE',
        statusCode: 400,
      });
    });
  });

  describe('createOrUpdateUser', () => {
    const mockSupabase = require('../../../src/lib/supabase').supabase;

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn(),
          }),
        }),
      });
    });

    it('should create user successfully', async () => {
      const mockUser: SupabaseUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      } as SupabaseUser;

      const mockDbUser: AuthUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        auth_provider: 'google',
        created_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
        total_votes_cast: 0,
        total_problems_proposed: 0,
        is_admin: false,
        stripe_customer_id: null,
        subscription_status: null,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      const result = await createOrUpdateUser(mockUser);

      expect(result).toEqual(mockDbUser);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          auth_provider: 'google',
        }),
        { onConflict: 'id' }
      );
    });

    it('should handle database error', async () => {
      const mockUser: SupabaseUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      } as SupabaseUser;

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(createOrUpdateUser(mockUser)).rejects.toThrow();
    });
  });
});