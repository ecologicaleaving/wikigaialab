'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const loading = status === "loading";
  const [databaseUser, setDatabaseUser] = useState<any>(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);
  const [testUser, setTestUser] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(true);

  // Check for test authentication data on mount and storage changes
  useEffect(() => {
    const checkTestAuth = () => {
      if (typeof window === 'undefined') {
        setTestLoading(false);
        return;
      }

      try {
        const testSession = localStorage.getItem('test-session');
        if (testSession) {
          const sessionData = JSON.parse(testSession);
          
          // Check if session is not expired
          const expiresAt = new Date(sessionData.expiresAt);
          if (expiresAt > new Date()) {
            // Convert test session to AuthUser format
            const testAuthUser = {
              id: sessionData.user.id,
              email: sessionData.user.email,
              name: sessionData.user.username,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
              is_admin: sessionData.user.role === 'admin',
              role: sessionData.user.role,
              subscription_status: 'active',
              total_votes_cast: 0,
              total_problems_proposed: 0,
              isTestUser: true
            };
            
            setTestUser(testAuthUser);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🧪 Test authentication detected:', {
                id: testAuthUser.id,
                email: testAuthUser.email,
                role: testAuthUser.role,
                isAdmin: testAuthUser.is_admin
              });
            }
          } else {
            // Clean up expired test session
            localStorage.removeItem('test-session');
            localStorage.removeItem('auth-token');
            document.cookie = 'test-auth=; path=/; max-age=0';
            setTestUser(null);
          }
        } else {
          setTestUser(null);
        }
      } catch (error) {
        console.warn('Error checking test authentication:', error);
        setTestUser(null);
      } finally {
        setTestLoading(false);
      }
    };

    checkTestAuth();

    // Listen for storage changes (in case test login happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'test-session') {
        checkTestAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch user data from session API when session changes
  // UserIdentityService now handles synchronization in the session API
  useEffect(() => {
    // Only fetch if we have a new user or if the user ID changed
    if (session?.user && !fetchingUser && session.user.id !== lastFetchedUserId) {
      setFetchingUser(true);
      fetch('/api/auth/session')
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setDatabaseUser(data.user);
            setLastFetchedUserId(session.user.id); // Cache the user ID we just fetched
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 User data synchronized via UserIdentityService:', {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                isAdmin: data.user.is_admin
              });
            }
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
      setLastFetchedUserId(null); // Reset cache when user logs out
    }
  }, [session?.user?.id, session?.user?.email]);

  // Priority: Test user > NextAuth session with admin status > Database fallback
  // After our NextAuth fix, session.user should include is_admin
  // Use useMemo to prevent re-creating user object unnecessarily
  const user: AuthUser | null = useMemo(() => {
    if (testUser) return testUser;
    
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      avatar_url: session.user.image || null,
      created_at: databaseUser?.created_at || new Date().toISOString(),
      updated_at: databaseUser?.updated_at || new Date().toISOString(),
      last_login_at: databaseUser?.last_login_at || new Date().toISOString(),
      is_admin: (session.user as any).is_admin || false, // Get from session first
      role: databaseUser?.role || 'user',
      subscription_status: databaseUser?.subscription_status || 'free',
      total_votes_cast: databaseUser?.total_votes_cast || 0,
      total_problems_proposed: databaseUser?.total_problems_proposed || 0,
    };
  }, [testUser, session?.user, databaseUser]);

  // Include test loading in overall loading state
  const overallLoading = loading || testLoading;

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
      // Clear test authentication if it exists
      if (testUser) {
        localStorage.removeItem('test-session');
        localStorage.removeItem('auth-token');
        document.cookie = 'test-auth=; path=/; max-age=0';
        setTestUser(null);
        
        // For test users, just redirect without calling NextAuth signOut
        window.location.href = '/login';
        return;
      }

      // Normal NextAuth signOut for regular users
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

  const refreshUserData = async () => {
    if (!session?.user) return;
    
    try {
      setFetchingUser(true);
      
      // Force NextAuth session refresh first
      await update();
      
      // Then fetch database user data
      setLastFetchedUserId(null); // Clear cache to force refresh
      
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setDatabaseUser(data.user);
        setLastFetchedUserId(session.user.id);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Forced user data refresh:', {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            isAdmin: data.user.is_admin,
            sessionAdmin: (session.user as any).is_admin
          });
        }
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
    } finally {
      setFetchingUser(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading: overallLoading,
    error: null, // NextAuth handles errors differently
    session,
    signInWithGoogle,
    signOut,
    clearError,
    refreshSession,
    refreshUserData,
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