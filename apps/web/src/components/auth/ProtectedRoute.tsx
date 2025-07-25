'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRoleAccess } from '../../hooks/useAuth';
import { ProtectedRouteProps } from '../../types/auth';
import { AuthLoadingSpinner } from './AuthLoadingSpinner';

/**
 * Protected Route Component
 * Wraps components that require authentication and/or specific roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
  fallback,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();
  const { hasAccess } = useRoleAccess(requiredRole);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-teal-700">Preparando il laboratorio...</div>
        </div>
      </div>
    );
  }

  // User not authenticated - redirect immediately without showing UI
  if (!user) {
    // Silent redirect to avoid flash
    if (typeof window !== 'undefined') {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
    
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-teal-700">Reindirizzamento...</div>
        </div>
      </div>
    );
  }

  // User authenticated but lacks required role
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accesso negato
          </h2>
          <p className="text-gray-600 mb-6">
            {requiredRole === 'admin' 
              ? 'Sono richiesti privilegi di amministratore per accedere a questa pagina.'
              : 'Non hai i permessi necessari per accedere a questa pagina.'
            }
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Vai al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User authenticated and has required role
  return <>{children}</>;
};

/**
 * Higher-Order Component for protecting routes
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;

  return ProtectedComponent;
};

/**
 * Admin Only Route Component
 */
export const AdminOnlyRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="admin" />
);

/**
 * User Only Route Component (for clarity)
 */
export const UserRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="user" />
);

/**
 * Conditional Protected Route
 * Shows different content based on authentication state
 */
interface ConditionalProtectedRouteProps {
  authenticatedContent: React.ReactNode;
  unauthenticatedContent: React.ReactNode;
  loadingContent?: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export const ConditionalProtectedRoute: React.FC<ConditionalProtectedRouteProps> = ({
  authenticatedContent,
  unauthenticatedContent,
  loadingContent,
  requiredRole = 'user',
}) => {
  const { user, loading } = useAuth();
  const { hasAccess } = useRoleAccess(requiredRole);

  if (loading) {
    return loadingContent || (
      <div className="flex items-center justify-center py-8">
        <AuthLoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <>{unauthenticatedContent}</>;
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {requiredRole === 'admin' 
            ? 'Privilegi di amministratore richiesti.'
            : 'Permessi insufficienti.'
          }
        </p>
      </div>
    );
  }

  return <>{authenticatedContent}</>;
};

/**
 * Route Guard Hook
 * For more complex protection logic
 */
export const useRouteGuard = (
  requiredRole: 'user' | 'admin' = 'user',
  redirectTo: string = '/login'
) => {
  const { user, loading } = useAuth();
  const { hasAccess } = useRoleAccess(requiredRole);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, loading, router, redirectTo]);

  return {
    user,
    loading,
    hasAccess,
    isAuthenticated: !!user,
    canAccess: !!user && hasAccess,
  };
};

export default ProtectedRoute;