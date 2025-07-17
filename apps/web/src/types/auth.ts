import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User as DatabaseUser } from '../lib/supabase';

/**
 * Enhanced user type combining Supabase auth user with our database user
 */
export interface AuthUser extends DatabaseUser {
  session?: Session;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  session: Session | null;
}

/**
 * Authentication context interface
 */
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

/**
 * User role types
 */
export type UserRole = 'user' | 'admin';

/**
 * Authentication error types
 */
export interface AuthError {
  message: string;
  statusCode?: number;
  code?: string;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google';

/**
 * Authentication action types for reducer
 */
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_OUT' };

/**
 * Protected route props interface
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * User profile update interface
 */
export interface UserProfileUpdate {
  name?: string;
  avatar_url?: string;
}

/**
 * Authentication event types
 */
export type AuthEventType = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

/**
 * Authentication event interface
 */
export interface AuthEvent {
  type: AuthEventType;
  session: Session | null;
  user: SupabaseUser | null;
  timestamp: Date;
}

/**
 * Auth middleware options
 */
export interface AuthMiddlewareOptions {
  redirectTo?: string;
  requiredRole?: UserRole;
  allowUnauthenticated?: boolean;
}

/**
 * Session refresh result
 */
export interface SessionRefreshResult {
  session: Session | null;
  user: AuthUser | null;
  error: AuthError | null;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
  defaultRedirectTo: string;
  loginRedirectTo: string;
  logoutRedirectTo: string;
}