import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import LoginPage from '../../../src/app/login/page';
import DashboardPage from '../../../src/app/dashboard/page';
import { AuthUser } from '../../../src/types/auth';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

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

describe('Authentication Flow Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

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
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (require('next/navigation').useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
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
    mockAuth.withAuthErrorHandling.mockImplementation((fn) => fn());
    mockSearchParams.get.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should render login page when user is not authenticated', async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Benvenuto in WikiGaiaLab')).toBeInTheDocument();
        expect(screen.getByText('Accedi con Google')).toBeInTheDocument();
      });
    });

    it('should handle successful Google OAuth login', async () => {
      mockAuth.signInWithGoogle.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Accedi con Google')).toBeInTheDocument();
      });

      const googleButton = screen.getByText('Accedi con Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockAuth.signInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should handle login error', async () => {
      mockAuth.signInWithGoogle.mockRejectedValue(new Error('Login failed'));
      mockAuth.getAuthErrorMessage.mockReturnValue('Login failed');

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Accedi con Google')).toBeInTheDocument();
      });

      const googleButton = screen.getByText('Accedi con Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('should redirect authenticated user to dashboard', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle redirect URL from query params', async () => {
      mockSearchParams.get.mockReturnValue('/profile');
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/profile');
      });
    });

    it('should display error from URL params', async () => {
      mockSearchParams.get.mockReturnValue('auth_failed');

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Autenticazione fallita. Riprova.')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Access', () => {
    it('should redirect unauthenticated user to login', async () => {
      // Mock window.location for the redirect logic
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=%2Fdashboard');
      });
    });

    it('should render dashboard for authenticated user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);
      mockAuth.hasRole.mockReturnValue(true);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Benvenuto, Test User!')).toBeInTheDocument();
      });
    });

    it('should display user stats correctly', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);
      mockAuth.hasRole.mockReturnValue(true);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // votes cast
        expect(screen.getByText('3')).toBeInTheDocument(); // problems proposed
        expect(screen.getByText('Attivo')).toBeInTheDocument(); // subscription status
      });
    });
  });

  describe('Authentication State Management', () => {
    it('should handle auth state changes correctly', async () => {
      let authStateChangeCallback: (event: string, session: any) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      mockAuth.handleAuthStateChange.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Accedi con Google')).toBeInTheDocument();
      });

      // Simulate successful login
      await authStateChangeCallback('SIGNED_IN', { user: { id: '123' } });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle sign out correctly', async () => {
      // Start with authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);
      mockAuth.hasRole.mockReturnValue(true);

      let authStateChangeCallback: (event: string, session: any) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      mockAuth.handleAuthStateChange.mockResolvedValue(null);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Benvenuto, Test User!')).toBeInTheDocument();
      });

      // Simulate sign out
      await authStateChangeCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=%2Fdashboard');
      });
    });

    it('should handle session refresh', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });
      mockAuth.getCurrentUser.mockResolvedValue(mockUser);
      mockAuth.refreshSession.mockResolvedValue({
        session: { user: { id: '123' } },
        user: mockUser,
        error: null,
      });

      let authStateChangeCallback: (event: string, session: any) => void;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      mockAuth.handleAuthStateChange.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Benvenuto, Test User!')).toBeInTheDocument();
      });

      // Simulate token refresh
      await authStateChangeCallback('TOKEN_REFRESHED', { user: { id: '123' } });

      await waitFor(() => {
        expect(mockAuth.handleAuthStateChange).toHaveBeenCalledWith('TOKEN_REFRESHED', { user: { id: '123' } });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });
      mockAuth.getAuthErrorMessage.mockReturnValue('Session error');

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Session error')).toBeInTheDocument();
      });
    });

    it('should handle network errors during authentication', async () => {
      mockAuth.signInWithGoogle.mockRejectedValue(new Error('Network error'));
      mockAuth.getAuthErrorMessage.mockReturnValue('Errore di connessione. Controlla la tua connessione internet.');

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Accedi con Google')).toBeInTheDocument();
      });

      const googleButton = screen.getByText('Accedi con Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Errore di connessione. Controlla la tua connessione internet.')).toBeInTheDocument();
      });
    });
  });
});