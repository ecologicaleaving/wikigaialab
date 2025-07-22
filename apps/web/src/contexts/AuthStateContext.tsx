'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AuthUser } from '../types/auth';

/**
 * Lightweight authentication state context
 * Only provides basic auth state without actions
 * Optimized for minimal re-renders
 */

interface AuthStateContextType {
  user: AuthUser | null;
  loading: boolean;
  session: any;
  isAuthenticated: boolean;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);

export const AuthStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // Convert NextAuth session to our AuthUser type (memoized)
  const user: AuthUser | null = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id || session.user.email || '',
      email: session.user.email || '',
      name: session.user.name || '',
      avatar_url: session.user.image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      is_admin: false,
      role: 'user' as const,
      subscription_status: 'free',
      total_votes_cast: 0,
      total_problems_proposed: 0,
    };
  }, [session]);

  const value: AuthStateContextType = useMemo(() => ({
    user,
    loading,
    session,
    isAuthenticated: user !== null,
  }), [user, loading, session]);

  return (
    <AuthStateContext.Provider value={value}>
      {children}
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthStateProvider');
  }
  return context;
};

// Individual state selectors for even better performance
export const useAuthUser = () => {
  const { user } = useAuthState();
  return user;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated, loading } = useAuthState();
  return { isAuthenticated, loading };
};

export const useAuthLoading = () => {
  const { loading } = useAuthState();
  return loading;
};