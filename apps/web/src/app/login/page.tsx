'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { AuthLoadingSpinner } from '../../components/auth/AuthLoadingSpinner';
import Link from 'next/link';

/**
 * Login Page Component
 * Handles user authentication with Google OAuth
 */
export default function LoginPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthLoadingSpinner message="Caricamento..." />
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthLoadingSpinner message="Reindirizzamento..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-600">
            {/* WikiGaiaLab Logo */}
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 9.36 9 11 5.16-1.64 9-5.45 9-11V7l-10-5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Benvenuto in WikiGaiaLab
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Partecipa alla comunità e contribuisci al cambiamento
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
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>🔧 Setup in Corso:</strong> Google OAuth non ancora configurato. 
                      Per testare l'app, esplora la homepage e le altre funzionalità.
                    </p>
                  </div>
                </div>
              </div>
              <GoogleLoginButton />
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Cosa puoi fare con WikiGaiaLab:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                  Proponi soluzioni innovative per i problemi del mondo
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                  Vota e supporta le migliori idee
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                  Collabora con una comunità globale
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                  Monitora l'impatto delle tue proposte
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            Continuando, accetti i nostri{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">
              Termini di Servizio
            </Link>{' '}
            e la{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
            .
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
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