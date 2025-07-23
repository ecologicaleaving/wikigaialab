'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { AuthUser } from '../types/auth';

/**
 * NextAuth.js Authentication Context
 * 
 * This context provides authentication state and functions using NextAuth.js
 * which solves the network connectivity issues with Supabase
 */

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  session: any;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const loading = status === "loading";
  const [databaseUser, setDatabaseUser] = useState<any>(null);
  const [fetchingUser, setFetchingUser] = useState(false);

  // Fetch user data from session API when session changes
  useEffect(() => {
    if (session?.user && !fetchingUser) {
      setFetchingUser(true);
      fetch('/api/auth/session')
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setDatabaseUser(data.user);
          }
        })
        .catch(error => {
          console.warn('Failed to fetch user data:', error);
        })
        .finally(() => {
          setFetchingUser(false);
        });
    } else if (!session?.user) {
      setDatabaseUser(null);
    }
  }, [session?.user?.id, session?.user?.email]);

  // Convert NextAuth session to our AuthUser type with real database data
  const user: AuthUser | null = session?.user ? {
    id: session.user.id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name || '',
    avatar_url: session.user.image || null,
    created_at: databaseUser?.created_at || new Date().toISOString(),
    updated_at: databaseUser?.updated_at || new Date().toISOString(),
    last_login_at: databaseUser?.last_login_at || new Date().toISOString(),
    is_admin: databaseUser?.is_admin || false, // Use real database value
    role: databaseUser?.role || 'user' as const,
    subscription_status: databaseUser?.subscription_status || 'free',
    total_votes_cast: databaseUser?.total_votes_cast || 0,
    total_problems_proposed: databaseUser?.total_problems_proposed || 0,
  } : null;

  const signInWithGoogle = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting Google OAuth sign-in...');
        console.log('Client Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          hasPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
          callbackUrl: '/dashboard',
          currentUrl: window.location.href
        });
      }
      
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Google sign-in result:', result);
      }
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error signing in with Google:', error);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await nextAuthSignOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      await update();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing session:', error);
      }
    }
  };

  const clearError = () => {
    // NextAuth handles errors internally, so this is mostly for compatibility
  };

  const value: AuthContextType = {
    user,
    loading,
    error: null, // NextAuth handles errors differently
    session,
    signInWithGoogle,
    signOut,
    clearError,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simplified utility hooks for backward compatibility
export const useAuthUser = (): AuthUser | null => {
  const { user } = useAuth();
  return user;
};

export const useAuthLoading = (): boolean => {
  const { loading } = useAuth();
  return loading;
};

export const useAuthError = (): string | null => {
  const { error } = useAuth();
  return error;
};

// Additional utility hooks for backward compatibility
export const useRole = (requiredRole: 'user' | 'admin'): boolean => {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (requiredRole === 'admin') {
    return user.is_admin || false;
  }
  
  return true; // All authenticated users have 'user' role
};

export const useUserDisplayName = (): string => {
  const { user } = useAuth();
  
  if (!user) return 'Utente';
  
  return user.name || user.email?.split('@')[0] || 'Utente';
};