'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth as useAuthContext } from '../../contexts/AuthContextNextAuth';

/**
 * Hook for Google authentication
 * Specialized for Google OAuth flow with error handling
 */
export const useGoogleAuth = () => {
  const { signInWithGoogle, loading, error } = useAuthContext();
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
 * Centralized error management with auto-clearing
 */
export const useAuthErrorHandler = () => {
  const { error, clearError } = useAuthContext();
  
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