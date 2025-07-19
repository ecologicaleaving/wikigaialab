'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { createOrUpdateUser, getAuthErrorMessage } from '../../../lib/auth';
import { AuthLoadingSpinner } from '../../../components/auth/AuthLoadingSpinner';
import { safeLocation, getBrowserStatus } from '../../../lib/browser-utils';

/**
 * Auth Callback Component that uses search params
 */
function AuthCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration detection effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only run auth callback processing after hydration
    if (!isHydrated) return;

    const handleAuthCallback = async () => {
      try {
        setStatus('processing');
        
        // Get the URL hash/fragment safely using browser utils
        const hash = safeLocation.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors in the callback
        if (errorParam) {
          console.error('OAuth callback error:', errorParam, errorDescription);
          setErrorMessage(getAuthErrorMessage(errorDescription || errorParam));
          setStatus('error');
          
          // Redirect to login with error after a delay
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(errorParam)}`);
          }, 3000);
          return;
        }

        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setErrorMessage(getAuthErrorMessage(sessionError));
          setStatus('error');
          
          setTimeout(() => {
            router.push('/login?error=session_error');
          }, 3000);
          return;
        }

        if (!session || !session.user) {
          console.error('No session or user found');
          setErrorMessage('Nessuna sessione valida trovata');
          setStatus('error');
          
          setTimeout(() => {
            router.push('/login?error=no_session');
          }, 3000);
          return;
        }

        // Create or update user in our database
        try {
          await createOrUpdateUser(session.user);
          setStatus('success');
          
          // Get redirect URL from state or default to dashboard
          const redirectTo = searchParams.get('redirect') || '/dashboard';
          
          // Redirect to the intended page
          setTimeout(() => {
            router.push(redirectTo);
          }, 1000);
          
        } catch (dbError) {
          console.error('Database error:', dbError);
          setErrorMessage(getAuthErrorMessage(dbError as Error));
          setStatus('error');
          
          setTimeout(() => {
            router.push('/login?error=db_error');
          }, 3000);
        }
        
      } catch (error) {
        console.error('Callback handling error:', error);
        setErrorMessage(getAuthErrorMessage(error as Error));
        setStatus('error');
        
        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, isHydrated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {!isHydrated && (
            <>
              <AuthLoadingSpinner message="Inizializzazione..." />
              <p className="mt-4 text-sm text-gray-600">
                Preparazione dell'ambiente di autenticazione...
              </p>
            </>
          )}
          
          {isHydrated && status === 'processing' && (
            <>
              <AuthLoadingSpinner message="Completamento accesso..." />
              <p className="mt-4 text-sm text-gray-600">
                Stiamo completando il processo di autenticazione...
              </p>
            </>
          )}
          
          {isHydrated && status === 'success' && (
            <>
              <div className="mx-auto h-12 w-12 text-green-600">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Accesso completato!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Reindirizzamento in corso...
              </p>
            </>
          )}
          
          {isHydrated && status === 'error' && (
            <>
              <div className="mx-auto h-12 w-12 text-red-600">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Errore durante l'accesso
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {errorMessage || 'Si è verificato un errore durante l\'autenticazione.'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Reindirizzamento alla pagina di accesso...
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Riprova
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * OAuth Callback Page with Suspense boundary
 * Handles the OAuth callback from Google and processes the authentication result
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AuthLoadingSpinner message="Caricamento..." />
            <p className="mt-4 text-sm text-gray-600">
              Preparazione dell'autenticazione...
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackComponent />
    </Suspense>
  );
}