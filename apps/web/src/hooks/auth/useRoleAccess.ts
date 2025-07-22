'use client';

import { useAuth as useAuthContext } from '../../contexts/AuthContextNextAuth';
import { hasRole } from '../../lib/auth-utils';

/**
 * Hook for role-based access control
 * Optimized for permission checking without unnecessary re-renders
 */
export const useRoleAccess = (requiredRole: 'user' | 'admin') => {
  const { user, loading } = useAuthContext();
  
  const hasAccess = user ? hasRole(user, requiredRole) : false;
  
  return {
    hasAccess,
    loading,
    user,
    isAuthenticated: user !== null,
  };
};

/**
 * Hook for admin access check
 * Specialized hook for admin-only features
 */
export const useIsAdmin = () => {
  const { user, loading } = useAuthContext();
  
  return {
    isAdmin: user?.is_admin || false,
    loading,
    user,
  };
};

/**
 * Hook for user role utilities
 * Provides role checking functions
 */
export const useUserRole = () => {
  const { user } = useAuthContext();
  
  return {
    user,
    hasRole: (role: 'user' | 'admin') => hasRole(user, role),
    isAdmin: user?.is_admin || false,
    isUser: user !== null,
  };
};