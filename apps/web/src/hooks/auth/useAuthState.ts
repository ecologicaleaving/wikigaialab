'use client';

import { useAuth as useAuthContext } from '../../contexts/AuthContextNextAuth';

/**
 * Hook for basic authentication state
 * Optimized for minimal re-renders and focused state management
 */
export const useAuthState = () => {
  const { user, loading, error } = useAuthContext();
  
  return {
    user,
    loading,
    error,
    isAuthenticated: user !== null,
    isLoading: loading,
    hasError: error !== null,
  };
};

/**
 * Hook for authentication status only (minimal state)
 * Use when you only need to know if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { user, loading } = useAuthContext();
  
  return {
    isAuthenticated: user !== null,
    loading,
  };
};