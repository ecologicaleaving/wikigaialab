import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContextNextAuth';
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
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, error, signInWithGoogle, signOut, clearError } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.name || user.email : 'No User'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <button onClick={signInWithGoogle} data-testid="signin-button">
        Sign In
      </button>
      <button onClick={signOut} data-testid="signout-button">
        Sign Out
      </button>
      <button onClick={clearError} data-testid="clear-error-button">
        Clear Error
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockSupabase = require('../../../src/lib/supabase').supabase;
  const mockAuth = require('../../../src/lib/auth');

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider initialization', () => {
    it('should render children and initialize auth state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    });

    it('should handle session restoration', async () => {
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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });
    });

    it('should handle session restoration error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('error')).toHaveTextContent('Generic error');
      });
    });
  });

  describe('Authentication actions', () => {
    it('should handle Google sign in', async () => {
      mockAuth.withAuthErrorHandling.mockImplementation((fn) => fn());
      mockAuth.signInWithGoogle.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      fireEvent.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(mockAuth.signInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should handle Google sign in error', async () => {
      const error = new Error('Sign in failed');
      mockAuth.withAuthErrorHandling.mockRejectedValue(error);
      mockAuth.getAuthErrorMessage.mockReturnValue('Sign in failed');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      fireEvent.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign in failed');
      });
    });

    it('should handle sign out', async () => {
      mockAuth.withAuthErrorHandling.mockImplementation((fn) => fn());
      mockAuth.signOut.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      fireEvent.click(screen.getByTestId('signout-button'));

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled();
      });
    });

    it('should handle sign out error', async () => {
      const error = new Error('Sign out failed');
      mockAuth.withAuthErrorHandling.mockRejectedValue(error);
      mockAuth.getAuthErrorMessage.mockReturnValue('Sign out failed');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      fireEvent.click(screen.getByTestId('signout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign out failed');
      });
    });

    it('should clear error', async () => {
      mockAuth.getAuthErrorMessage.mockReturnValue('Test error');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First trigger an error
      mockAuth.withAuthErrorHandling.mockRejectedValue(new Error('Test error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      fireEvent.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Then clear it
      fireEvent.click(screen.getByTestId('clear-error-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });
    });
  });

  describe('Auth state changes', () => {
    it('should handle SIGNED_IN event', async () => {
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

      mockAuth.handleAuthStateChange.mockResolvedValue(mockUser);

      let authStateChangeCallback: (event: string, session: any) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Simulate auth state change
      await authStateChangeCallback('SIGNED_IN', { user: { id: '123' } });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });
    });

    it('should handle SIGNED_OUT event', async () => {
      mockAuth.handleAuthStateChange.mockResolvedValue(null);

      let authStateChangeCallback: (event: string, session: any) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Simulate auth state change
      await authStateChangeCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Hook usage outside provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});