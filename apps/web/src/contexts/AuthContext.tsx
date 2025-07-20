'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types/auth';
import { getCurrentUser } from '../lib/auth';
// import { trackAuth } from '../lib/performance-monitor';
import { safeLocalStorage } from '../lib/browser-utils';

/**
 * REFACTORED: Simplified Authentication Context
 * 
 * Performance improvements:
 * - Removed complex reducer pattern (useState is sufficient)
 * - Simplified session caching (no localStorage complexity)
 * - Single useEffect for all auth operations
 * - Eliminated dependency chain issues
 * - Removed unnecessary loading states
 */

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  forceLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified session caching - SSR-safe localStorage access
  const cacheSession = useCallback((session: Session | null) => {
    try {
      if (session) {
        safeLocalStorage.setItem('auth_session', JSON.stringify(session));
      } else {
        safeLocalStorage.removeItem('auth_session');
      }
    } catch (e) {
      // Silently fail - caching is optional
    }
  }, []);

  const getCachedSession = useCallback((): Session | null => {
    try {
      const cached = safeLocalStorage.getItem('auth_session');
      if (cached) {
        const session = JSON.parse(cached);
        // Simple expiration check
        if (session.expires_at && new Date(session.expires_at).getTime() > Date.now()) {
          return session;
        }
      }
    } catch (e) {
      // Silently fail - caching is optional
    }
    return null;
  }, []);

  // Single useEffect for all auth operations
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // const authTracker = trackAuth();
      // authTracker.start();
      
      try {
        // Try cache first for instant loading
        const cachedSession = getCachedSession();
        if (cachedSession && mounted) {
          setSession(cachedSession);
          try {
            const user = await getCurrentUser();
            if (mounted) {
              setUser(user);
              setLoading(false);
              return; // Exit early on successful cache restore
            }
          } catch (e) {
            console.warn('Cached session expired');
          }
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.warn('Auth error:', error);
            
            // Check for fallback tokens when Supabase fails
            try {
              const fallbackTokensStr = safeLocalStorage.getItem('fallback_auth_tokens');
              if (fallbackTokensStr) {
                console.log('🔐 Found fallback tokens, attempting to use them');
                const fallbackTokens = JSON.parse(fallbackTokensStr);
                
                // Check if tokens are still valid (not older than 1 hour)
                const tokenAge = Date.now() - fallbackTokens.timestamp;
                if (tokenAge < 3600000) { // 1 hour
                  console.log('🔐 Using fallback authentication');
                  
                  // Create a mock session-like object
                  const mockUser: AuthUser = {
                    id: fallbackTokens.user.id,
                    email: fallbackTokens.user.email,
                    name: fallbackTokens.user.name,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    is_admin: false,
                    subscription_status: 'free',
                    total_votes_cast: 0,
                    total_problems_proposed: 0,
                  };
                  
                  const mockSession = {
                    access_token: fallbackTokens.access_token,
                    refresh_token: fallbackTokens.refresh_token,
                    expires_in: 3600,
                    expires_at: fallbackTokens.expires_at,
                    user: {
                      id: fallbackTokens.user.id,
                      email: fallbackTokens.user.email,
                      user_metadata: {
                        name: fallbackTokens.user.name,
                        avatar_url: null,
                      }
                    }
                  } as Session;
                  
                  setUser(mockUser);
                  setSession(mockSession);
                  cacheSession(mockSession);
                  
                  // Remove fallback tokens after successful use
                  safeLocalStorage.removeItem('fallback_auth_tokens');
                  
                  setLoading(false);
                  return;
                } else {
                  console.log('🔐 Fallback tokens expired, removing');
                  safeLocalStorage.removeItem('fallback_auth_tokens');
                }
              }
            } catch (e) {
              console.warn('Failed to process fallback tokens:', e);
            }
            
            setError(error.message);
          } else {
            setSession(session);
            cacheSession(session);
            
            if (session) {
              try {
                const user = await getCurrentUser();
                setUser(user);
              } catch (e) {
                console.warn('Failed to get user:', e);
                // Don't fail completely - user has valid session
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  role: 'user',
                  is_admin: false,
                  created_at: session.user.created_at,
                  updated_at: session.user.updated_at || session.user.created_at,
                });
              }
            }
          }
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Authentication failed');
          setLoading(false);
        }
      } finally {
        // authTracker.end();
      }
    };

    initAuth();

    // Simplified auth state listener - only handle essential events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Skip token refresh events to prevent unnecessary updates
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          cacheSession(session);
          return;
        }

        if (event === 'SIGNED_IN') {
          setSession(session);
          cacheSession(session);
          if (session) {
            try {
              const user = await getCurrentUser();
              setUser(user);
            } catch (e) {
              console.warn('Failed to get user on sign in:', e);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          cacheSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [cacheSession, getCachedSession]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we should use local simulation
      // Only use demo mode when explicitly requested via URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const forceDemo = urlParams.get('demo') === 'true';
      
      const useLocalAuth = forceDemo;
      
      if (useLocalAuth) {
        
        // Simulate local user login
        const mockUser: AuthUser = {
          id: 'local-user-123',
          email: 'demo@wikigaialab.com',
          name: 'Demo User',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
          is_admin: false,
          subscription_status: 'free',
          total_votes_cast: 0,
          total_problems_proposed: 0,
        };
        
        const mockSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: {
              name: mockUser.name,
              avatar_url: mockUser.avatar_url,
            }
          }
        } as Session;
        
        setUser(mockUser);
        setSession(mockSession);
        cacheSession(mockSession);
        
        // Small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }
      
      // Use real OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }, [cacheSession]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear state immediately for demo users
      if (user?.id === 'local-user-123') {
        setSession(null);
        setUser(null);
        cacheSession(null);
        window.location.href = '/login';
        return;
      }
      
      // For real users, use Supabase signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
      } else {
        setSession(null);
        setUser(null);
        cacheSession(null);
        window.location.href = '/login';
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, [cacheSession, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const forceLogout = useCallback(() => {
    // Force clear all authentication state
    setSession(null);
    setUser(null);
    cacheSession(null);
    
    // Clear localStorage completely
    try {
      safeLocalStorage.removeItem('auth_session');
      safeLocalStorage.clear();
    } catch (e) {
      // Ignore errors
    }
    
    // Force page reload to clear any cached state
    window.location.href = '/login';
  }, [cacheSession]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    clearError,
    forceLogout,
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

// Simplified utility hooks
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