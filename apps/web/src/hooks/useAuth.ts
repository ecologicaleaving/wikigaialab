'use client';

import { useAuth as useAuthContext } from '../contexts/AuthContextNextAuth';
import { hasRole } from '../lib/auth-utils';

/**
 * Main authentication hook (optimized for performance)
 * Provides core auth functionality with minimal re-renders
 * 
 * For specialized use cases, import specific hooks from './auth/'
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
    
    /**
     * Force refresh user data from database
     */
    refreshUserData: context.refreshUserData,
  };
};

// Legacy exports - use specific hooks from ./auth/ for better performance
export { useUserProfile, useUserStats } from './auth/useUserProfile';
export { useAuthState } from './auth/useAuthState';
export { useRoleAccess } from './auth/useRoleAccess';
export { useSession, useLogout } from './auth/useSession';
export { useGoogleAuth, useAuthErrorHandler } from './auth/useGoogleAuth';