'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { AuthLoadingSpinner } from '../../components/auth/AuthLoadingSpinner';
import Link from 'next/link';

/**
 * Login Component that uses search params
 */
function LoginComponent() {
  const { user, loading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');

  // Handle successful login redirect
  useEffect(() => {
    if (user && !loading) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Handle error from URL params
  useEffect(() => {
    if (errorParam) {
      // Clear error param from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [errorParam]);

  // Clear initial load state
  useEffect(() => {
    if (!loading) {
      setIsInitialLoad(false);
    }
  }, [loading]);

  // Show loading spinner on initial load
  if (isInitialLoad && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-teal-700">Preparando il laboratorio...</div>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-teal-700">Reindirizzamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16">
            {/* WikiGaiaLab Logo */}
            <div className="relative w-full h-full bg-teal-600 rounded-full flex items-center justify-center">
              <svg
                fill="white"
                viewBox="0 0 24 24"
                className="w-8 h-8"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 9.36 9 11 5.16-1.64 9-5.45 9-11V7l-10-5z" />
              </svg>
              {/* Heart accent for community focus */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Benvenuto nel Laboratorio
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Come in un antico laboratorio di paese, qui ci ritroviamo per creare soluzioni insieme
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 space-y-6">
          <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
            {/* Error Message */}
            {(error || errorParam) && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      {error || getErrorMessage(errorParam)}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearError}
                      className="inline-flex text-red-400 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Google Login Button */}
            <div className="space-y-4">
              {/* Development mode debug info - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-teal-800">
                        <strong>🔧 Development Mode:</strong><br/>
                        • <a href="/login?demo=true" className="underline hover:text-teal-900">Demo Mode</a> - Test with mock user<br/>
                        • <a href="/login?demo=false" className="underline hover:text-teal-900">Real OAuth</a> - Use Google authentication
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <GoogleLoginButton />
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-teal-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Cosa puoi fare nel Laboratorio:
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Porta i tuoi problemi quotidiani al banco del laboratorio</span>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Riconosci i problemi degli altri e dona il tuo cuore</span>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Collabora con i maestri artigiani per costruire soluzioni</span>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Usa tutti gli attrezzi del laboratorio gratuitamente</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            Continuando, accetti i nostri{' '}
            <Link href="/terms" className="text-teal-600 hover:text-teal-800">
              Termini di Servizio
            </Link>{' '}
            e la{' '}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-800">
              Privacy Policy
            </Link>
            .
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link
              href="/"
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              ← Torna al Laboratorio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Login Page with Suspense boundary
 * Handles user authentication with Google OAuth
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-teal-700">Preparando il laboratorio...</div>
        </div>
      </div>
    }>
      <LoginComponent />
    </Suspense>
  );
}

/**
 * Maps error parameters to user-friendly messages
 */
function getErrorMessage(errorParam: string | null): string {
  if (!errorParam) return '';
  
  const errorMessages: Record<string, string> = {
    'auth_failed': 'Autenticazione fallita. Riprova.',
    'callback_failed': 'Errore durante il callback di autenticazione.',
    'oauth_error': 'Errore durante l\'accesso con Google.',
    'oauth_cancelled': 'Accesso con Google annullato.',
    'session_expired': 'Sessione scaduta. Effettua nuovamente l\'accesso.',
    'access_denied': 'Accesso negato.',
  };

  return errorMessages[errorParam] || 'Si è verificato un errore durante l\'accesso.';
}

/**
 * Check Icon Component
 */
const CheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);