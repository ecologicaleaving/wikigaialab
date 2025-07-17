import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { useAuth, useUserProfile, useAuthState, useRoleAccess } from '../../../src/hooks/useAuth';
import { AuthUser } from '../../../src/types/auth';

// Mock Supabase
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock auth utilities
jest.mock('../../../src/lib/auth', () => ({
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
  handleAuthStateChange: jest.fn(),
  logAuthEvent: jest.fn(),
  getCurrentUser: jest.fn(),
  withAuthErrorHandling: jest.fn(),
  getAuthErrorMessage: jest.fn(),
  updateUserProfile: jest.fn(),
  hasRole: jest.fn(),
}));

describe('useAuth hooks', () => {
  const mockSupabase = require('../../../src/lib/supabase').supabase;
  const mockAuth = require('../../../src/lib/auth');

  const mockUser: AuthUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    auth_provider: 'google',
    created_at: '2023-01-01T00:00:00Z',
    last_login_at: '2023-01-01T00:00:00Z',
    total_votes_cast: 5,
    total_problems_proposed: 3,
    is_admin: false,
    stripe_customer_id: null,
    subscription_status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    
    mockAuth.getCurrentUser.mockResolvedValue(null);
    mockAuth.getAuthErrorMessage.mockReturnValue('Generic error');
    mockAuth.hasRole.mockReturnValue(false);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth', () => {
    it('should provide auth context with additional utilities', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('signInWithGoogle');
      expect(result.current).toHaveProperty('signOut');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('displayName');
      expect(result.current).toHaveProperty('hasRole');
    });

    it('should calculate isAuthenticated correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should calculate isAdmin correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAdmin).toBe(false);
    });

    it('should provide display name', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.displayName).toBe('Utente');
    });

    it('should provide hasRole function', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.hasRole).toBe('function');
    });
  });

  describe('useUserProfile', () => {
    it('should provide user profile management', async () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isUpdating');
      expect(result.current).toHaveProperty('updateError');
      expect(result.current).toHaveProperty('updateProfile');
      expect(result.current).toHaveProperty('clearUpdateError');
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.updateError).toBe(null);
    });

    it('should handle profile update', async () => {
      mockAuth.updateUserProfile.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(mockAuth.updateUserProfile).toHaveBeenCalledWith(
        undefined, // user is null in test
        { name: 'Updated Name' }
      );
    });

    it('should handle profile update error', async () => {
      mockAuth.updateUserProfile.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(result.current.updateError).toBe('Update failed');
    });

    it('should handle update when user is null', async () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(result.current.updateError).toBe('Utente non autenticato');
    });

    it('should clear update error', async () => {
      mockAuth.updateUserProfile.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      // First cause an error
      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(result.current.updateError).toBe('Update failed');

      // Then clear it
      act(() => {
        result.current.clearUpdateError();
      });

      expect(result.current.updateError).toBe(null);
    });
  });

  describe('useAuthState', () => {
    it('should provide simplified auth state', async () => {
      const { result } = renderHook(() => useAuthState(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('hasError');
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  describe('useRoleAccess', () => {
    it('should provide role access information', async () => {
      const { result } = renderHook(() => useRoleAccess('user'), { wrapper });

      expect(result.current).toHaveProperty('hasAccess');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should check admin role access', async () => {
      mockAuth.hasRole.mockReturnValue(true);

      const { result } = renderHook(() => useRoleAccess('admin'), { wrapper });

      expect(result.current.hasAccess).toBe(false); // user is null
    });
  });
});