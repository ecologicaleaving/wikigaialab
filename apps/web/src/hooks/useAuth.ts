'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth as useAuthContext, useAuthUser, useRole, useUserDisplayName, useAuthLoading, useAuthError } from '../contexts/AuthContextNextAuth';
import { AuthUser } from '../types/auth';
import { updateUserProfile, hasRole } from '../lib/auth-utils';

/**
 * Enhanced authentication hook with additional utilities
 */
export const useAuth = () => {
  const context = useAuthContext();
  
  return {
    ...context,
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated: context.user !== null,
    
    /**
     * Check if user has admin role
     */
    isAdmin: context.user?.is_admin || false,
    
    /**
     * Get user display name
     */
    displayName: context.user ? 
      (context.user.name || context.user.email.split('@')[0] || 'Utente') : 
      'Utente',
    
    /**
     * Check if user has required role
     */
    hasRole: (role: 'user' | 'admin') => hasRole(context.user, role),
  };
};

/**
 * Hook for user profile management
 */
export const useUserProfile = () => {
  const { user, refreshSession } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateProfile = useCallback(async (updates: { name?: string; avatar_url?: string }) => {
    if (!user) {
      setUpdateError('Utente non autenticato');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      await updateUserProfile(user.id, updates);
      await refreshSession(); // Refresh to get updated user data
      
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsUpdating(false);
    }
  }, [user, refreshSession]);

  const clearUpdateError = useCallback(() => {
    setUpdateError(null);
  }, []);

  return {
    user,
    isUpdating,
    updateError,
    updateProfile,
    clearUpdateError,
  };
};

/**
 * Hook for authentication state management
 */
export const useAuthState = () => {
  const { user, loading, error, session } = useAuth();
  
  return {
    user,
    loading,
    error,
    session,
    isAuthenticated: user !== null,
    isLoading: loading,
    hasError: error !== null,
  };
};

/**
 * Hook for role-based access control
 */
export const useRoleAccess = (requiredRole: 'user' | 'admin') => {
  const { user, loading } = useAuth();
  
  const hasAccess = user ? hasRole(user, requiredRole) : false;
  
  return {
    hasAccess,
    loading,
    user,
    isAuthenticated: user !== null,
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { session, refreshSession, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  return {
    session,
    isRefreshing,
    loading,
    refreshSession: handleRefresh,
    isValid: session !== null,
  };
};

/**
 * Hook for logout functionality
 */
export const useLogout = () => {
  const { signOut, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut]);

  return {
    logout,
    isLoggingOut: isLoggingOut || loading,
  };
};

/**
 * Hook for Google authentication
 */
export const useGoogleAuth = () => {
  const { signInWithGoogle, loading, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  }, [signInWithGoogle]);

  return {
    signIn,
    isSigningIn: isSigningIn || loading,
    error,
  };
};

/**
 * Hook for authentication error handling
 */
export const useAuthErrorHandler = () => {
  const { error, clearError } = useAuth();
  
  const handleError = useCallback((callback?: (error: string) => void) => {
    if (error && callback) {
      callback(error);
    }
  }, [error]);

  useEffect(() => {
    // Auto-clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    error,
    hasError: error !== null,
    clearError,
    handleError,
  };
};

/**
 * Hook for user statistics
 */
export const useUserStats = () => {
  const { user } = useAuth();
  
  return {
    totalVotes: user?.total_votes_cast || 0,
    totalProblems: user?.total_problems_proposed || 0,
    subscriptionStatus: user?.subscription_status,
    memberSince: user?.created_at,
    lastLogin: user?.last_login_at,
  };
};

// Re-export individual hooks from context for convenience
export { useAuthUser, useRole, useUserDisplayName, useAuthLoading, useAuthError };