import { User as SupabaseUser, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { supabase, User as DatabaseUser } from './supabase';
import { AuthUser, AuthError, SessionRefreshResult, UserProfileUpdate } from '../types/auth';

/**
 * Authentication error messages in Italian
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Credenziali non valide. Riprova.',
  EMAIL_NOT_CONFIRMED: 'Email non confermata. Controlla la tua casella di posta.',
  WEAK_PASSWORD: 'Password troppo debole. Usa almeno 8 caratteri.',
  EMAIL_ALREADY_REGISTERED: 'Email già registrata. Prova ad accedere.',
  NETWORK_ERROR: 'Errore di connessione. Controlla la tua connessione internet.',
  OAUTH_ERROR: 'Errore durante l\'accesso con Google. Riprova.',
  OAUTH_CANCELLED: 'Accesso con Google annullato.',
  SESSION_EXPIRED: 'Sessione scaduta. Effettua nuovamente l\'accesso.',
  PERMISSION_DENIED: 'Non hai i permessi necessari per accedere a questa risorsa.',
  TOO_MANY_ATTEMPTS: 'Troppi tentativi di accesso. Riprova più tardi.',
  GENERIC_ERROR: 'Si è verificato un errore. Riprova più tardi.',
  USER_NOT_FOUND: 'Utente non trovato.',
  SERVER_ERROR: 'Errore del server. Riprova più tardi.',
  VALIDATION_ERROR: 'Dati non validi. Controlla i campi inseriti.',
} as const;

/**
 * Maps Supabase auth errors to user-friendly Italian messages
 */
export const getAuthErrorMessage = (error: SupabaseAuthError | Error | string): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Map common Supabase auth errors to Italian messages
  const errorMappings: Record<string, string> = {
    'Invalid login credentials': AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
    'Email not confirmed': AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED,
    'Password should be at least 6 characters': AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
    'User already registered': AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
    'Network request failed': AUTH_ERROR_MESSAGES.NETWORK_ERROR,
    'OAuth error': AUTH_ERROR_MESSAGES.OAUTH_ERROR,
    'OAuth cancelled': AUTH_ERROR_MESSAGES.OAUTH_CANCELLED,
    'JWT expired': AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
    'Invalid JWT': AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
    'User not found': AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
    'Too many requests': AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
    'Permission denied': AUTH_ERROR_MESSAGES.PERMISSION_DENIED,
  };

  // Check for specific error patterns
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Default error message
  return AUTH_ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Creates or updates a user in our database after successful authentication
 */
export const createOrUpdateUser = async (supabaseUser: SupabaseUser): Promise<AuthUser> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata.full_name || supabaseUser.user_metadata.name,
        avatar_url: supabaseUser.user_metadata.avatar_url,
        auth_provider: 'google',
        last_login_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating user:', error);
      throw new Error(getAuthErrorMessage(error.message));
    }

    return data;
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error);
    throw error;
  }
};

/**
 * Signs in with Google OAuth provider
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Refreshes the current session
 */
export const refreshSession = async (): Promise<SessionRefreshResult> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        session: null,
        user: null,
        error: { message: getAuthErrorMessage(error) },
      };
    }

    let user: AuthUser | null = null;
    if (data.user) {
      user = await createOrUpdateUser(data.user);
    }

    return {
      session: data.session,
      user,
      error: null,
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return {
      session: null,
      user: null,
      error: { message: getAuthErrorMessage(error as Error) },
    };
  }
};

/**
 * Gets the current user from the database
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return null;
    }

    // Create basic user from auth session immediately to avoid delays
    const basicUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || 'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url || null,
      role: 'user' as const,
      is_admin: false,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at || supabaseUser.created_at,
    };

    // Try to get enhanced user data from database, but don't wait too long
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (dbError) {
        console.warn('Database user query failed, using basic auth data:', dbError.message);
        return basicUser;
      }

      return dbUser || basicUser;
    } catch (dbError) {
      console.warn('Database query failed, using basic auth data:', dbError);
      return basicUser;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Updates user profile information
 */
export const updateUserProfile = async (
  userId: string,
  updates: UserProfileUpdate
): Promise<AuthUser> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(getAuthErrorMessage(error.message));
    }

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Checks if user has required role
 */
export const hasRole = (user: AuthUser | null, requiredRole: 'user' | 'admin'): boolean => {
  if (!user) return false;
  
  if (requiredRole === 'admin') {
    return user.is_admin;
  }
  
  return true; // All authenticated users have 'user' role
};

/**
 * Gets user's display name
 */
export const getUserDisplayName = (user: AuthUser | null): string => {
  if (!user) return 'Utente';
  
  return user.name || user.email.split('@')[0] || 'Utente';
};

/**
 * Checks if user is authenticated
 */
export const isAuthenticated = (user: AuthUser | null): boolean => {
  return user !== null;
};

/**
 * Validates session and returns user
 */
export const validateSession = async (): Promise<{ user: AuthUser | null; session: Session | null }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { user: null, session: null };
    }

    const user = await getCurrentUser();
    return { user, session };
  } catch (error) {
    console.error('Error validating session:', error);
    return { user: null, session: null };
  }
};

/**
 * Handles authentication state changes
 */
export const handleAuthStateChange = async (
  event: string,
  session: Session | null
): Promise<AuthUser | null> => {
  try {
    if (event === 'SIGNED_IN' && session?.user) {
      // Create or update user in database
      return await createOrUpdateUser(session.user);
    }
    
    if (event === 'SIGNED_OUT') {
      return null;
    }
    
    if (event === 'TOKEN_REFRESHED' && session?.user) {
      return await getCurrentUser();
    }
    
    return null;
  } catch (error) {
    console.error('Error handling auth state change:', error);
    return null;
  }
};

/**
 * Logs authentication events for debugging
 */
export const logAuthEvent = (event: string, user: AuthUser | null, error?: Error): void => {
  const logData = {
    event,
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message,
    timestamp: new Date().toISOString(),
  };
  
  console.log('Auth Event:', logData);
};

/**
 * Creates auth error object
 */
export const createAuthError = (message: string, code?: string, statusCode?: number): AuthError => {
  return {
    message,
    code,
    statusCode,
  };
};

/**
 * Utility to handle auth operations with consistent error handling
 */
export const withAuthErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorContext: string = 'Authentication operation'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = getAuthErrorMessage(error as Error);
    console.error(`${errorContext} failed:`, error);
    throw createAuthError(errorMessage);
  }
};