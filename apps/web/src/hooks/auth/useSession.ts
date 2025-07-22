'use client';

import { useCallback, useState } from 'react';
import { useAuth as useAuthContext } from '../../contexts/AuthContextNextAuth';

/**
 * Hook for session management
 * Optimized for session-specific operations
 */
export const useSession = () => {
  const { session, refreshSession, loading } = useAuthContext();
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
 * Isolated logout logic with loading state
 */
export const useLogout = () => {
  const { signOut, loading } = useAuthContext();
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