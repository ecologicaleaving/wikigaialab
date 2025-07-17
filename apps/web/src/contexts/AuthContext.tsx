'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { 
  AuthContextType, 
  AuthState, 
  AuthAction, 
  AuthUser 
} from '../types/auth';
import { 
  signInWithGoogle as signInWithGoogleAuth,
  signOut as signOutAuth,
  refreshSession as refreshSessionAuth,
  handleAuthStateChange,
  logAuthEvent,
  getCurrentUser,
  withAuthErrorHandling,
  getAuthErrorMessage,
} from '../lib/auth';

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  session: null,
};

/**
 * Authentication state reducer
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SIGN_OUT':
      return { ...state, user: null, session: null, error: null };
    
    default:
      return state;
  }
};

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await withAuthErrorHandling(signInWithGoogleAuth, 'Google sign in');
      
      logAuthEvent('GOOGLE_SIGNIN_INITIATED', null);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as Error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logAuthEvent('GOOGLE_SIGNIN_FAILED', null, error as Error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await withAuthErrorHandling(signOutAuth, 'Sign out');
      
      dispatch({ type: 'SIGN_OUT' });
      logAuthEvent('SIGNED_OUT', state.user);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as Error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logAuthEvent('SIGNOUT_FAILED', state.user, error as Error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const result = await refreshSessionAuth();
      
      if (result.error) {
        dispatch({ type: 'SET_ERROR', payload: result.error.message });
        logAuthEvent('SESSION_REFRESH_FAILED', null, new Error(result.error.message));
      } else {
        dispatch({ type: 'SET_USER', payload: result.user });
        dispatch({ type: 'SET_SESSION', payload: result.session });
        logAuthEvent('SESSION_REFRESHED', result.user);
      }
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as Error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logAuthEvent('SESSION_REFRESH_FAILED', null, error as Error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        dispatch({ type: 'SET_ERROR', payload: getAuthErrorMessage(error) });
        return;
      }

      dispatch({ type: 'SET_SESSION', payload: session });

      // Get current user if session exists
      if (session) {
        const user = await getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
        logAuthEvent('SESSION_RESTORED', user);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch({ type: 'SET_ERROR', payload: getAuthErrorMessage(error as Error) });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_SESSION', payload: session });
        
        const user = await handleAuthStateChange(event, session);
        dispatch({ type: 'SET_USER', payload: user });
        
        logAuthEvent(event, user);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        dispatch({ type: 'SET_ERROR', payload: getAuthErrorMessage(error as Error) });
        logAuthEvent('AUTH_STATE_CHANGE_ERROR', null, error as Error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  /**
   * Clear error when user changes
   */
  useEffect(() => {
    if (state.user) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, [state.user]);

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    session: state.session,
    signInWithGoogle,
    signOut,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook to check if user is authenticated
 */
export const useAuthUser = (): AuthUser | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user has specific role
 */
export const useRole = (requiredRole: 'user' | 'admin'): boolean => {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (requiredRole === 'admin') {
    return user.is_admin;
  }
  
  return true; // All authenticated users have 'user' role
};

/**
 * Hook to get user display name
 */
export const useUserDisplayName = (): string => {
  const { user } = useAuth();
  
  if (!user) return 'Utente';
  
  return user.name || user.email.split('@')[0] || 'Utente';
};

/**
 * Hook to check authentication loading state
 */
export const useAuthLoading = (): boolean => {
  const { loading } = useAuth();
  return loading;
};

/**
 * Hook to get authentication error
 */
export const useAuthError = (): string | null => {
  const { error } = useAuth();
  return error;
};