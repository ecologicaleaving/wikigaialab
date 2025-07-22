import { AuthUser } from '../types/auth';

/**
 * Authentication utilities for NextAuth.js implementation
 * Migrated from legacy Supabase auth system
 */

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
 * Maps NextAuth/general auth errors to user-friendly Italian messages
 */
export const getAuthErrorMessage = (error: Error | string): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Map common auth errors to Italian messages
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
    'OAuthAccountNotLinked': 'Account Google non collegato. Prova con un altro metodo di accesso.',
    'OAuthCallback': 'Errore durante il callback OAuth. Riprova.',
    'AccessDenied': AUTH_ERROR_MESSAGES.PERMISSION_DENIED,
  };

  // Check for specific error patterns
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Return generic error message if no specific mapping found
  return AUTH_ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Checks if user has required role
 * NextAuth.js compatible version
 */
export const hasRole = (user: AuthUser | null, requiredRole: 'user' | 'admin'): boolean => {
  if (!user) return false;
  
  if (requiredRole === 'admin') {
    return user.is_admin || false;
  }
  
  return true; // All authenticated users have 'user' role
};

/**
 * User profile update interface for NextAuth.js
 */
export interface UserProfileUpdate {
  name?: string;
  avatar_url?: string;
}

/**
 * Update user profile - NextAuth.js compatible version
 * For now returns a mock implementation since profile updates
 * would need to be handled via your database/API
 */
export const updateUserProfile = async (
  userId: string,
  updates: UserProfileUpdate
): Promise<AuthUser> => {
  try {
    // TODO: Implement actual profile update via your API
    // This could be a call to your database or a dedicated API endpoint
    
    // For now, throw an error to indicate this needs implementation
    throw new Error('Profile updates not yet implemented for NextAuth.js - needs API endpoint');
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(getAuthErrorMessage(error as Error));
  }
};

/**
 * Log authentication events (development only)
 */
export const logAuthEvent = (event: string, user: AuthUser | null, error?: Error): void => {
  if (process.env.NODE_ENV === 'development') {
    const logData = {
      event,
      user: user ? { id: user.id, email: user.email } : null,
      error: error?.message,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Auth Event:', logData);
  }
};