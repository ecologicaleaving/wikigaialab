'use client';

// Main auth hook (lightweight version)
export { useAuth } from '../useAuth';

// Specialized auth hooks (split for performance)
export { useAuthState, useIsAuthenticated } from './useAuthState';
export { useUserProfile, useUserStats } from './useUserProfile';
export { useSession, useLogout } from './useSession';
export { useRoleAccess, useIsAdmin, useUserRole } from './useRoleAccess';
export { useGoogleAuth, useAuthErrorHandler } from './useGoogleAuth';

// Re-export individual hooks from context for convenience
export { 
  useAuthUser, 
  useRole, 
  useUserDisplayName, 
  useAuthLoading, 
  useAuthError 
} from '../../contexts/AuthContextNextAuth';