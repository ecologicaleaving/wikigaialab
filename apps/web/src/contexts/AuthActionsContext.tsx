'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { signIn, signOut as nextAuthSignOut, getSession } from 'next-auth/react';

/**
 * Authentication actions context
 * Provides auth methods separate from state
 * Optimized to minimize re-renders when actions change
 */

interface AuthActionsContextType {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  error: string | null;
}

const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

export const AuthActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting Google OAuth sign-in...');
      }
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        setError('Errore durante l\'autenticazione con Google');
        if (process.env.NODE_ENV === 'development') {
          console.error('Google Auth Error:', result.error);
        }
      }
    } catch (error) {
      const errorMessage = 'Errore durante l\'autenticazione';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign-in error:', error);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('🚪 Signing out...');
      }
      
      await nextAuthSignOut({
        redirect: false,
        callbackUrl: '/'
      });
    } catch (error) {
      const errorMessage = 'Errore durante la disconnessione';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign-out error:', error);
      }
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await getSession();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Session refresh error:', error);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthActionsContextType = {
    signInWithGoogle,
    signOut,
    refreshSession,
    clearError,
    error,
  };

  return (
    <AuthActionsContext.Provider value={value}>
      {children}
    </AuthActionsContext.Provider>
  );
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthActionsProvider');
  }
  return context;
};