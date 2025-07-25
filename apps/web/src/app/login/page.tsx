'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="text-4xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🛠️
          </motion.div>
          <motion.div 
            className="text-lg text-teal-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Preparando il laboratorio...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-4xl mb-4"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🛠️
          </motion.div>
          <motion.div 
            className="text-lg text-teal-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Reindirizzamento...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating background elements */}
      <motion.div 
        className="absolute top-20 left-20 w-16 h-16 bg-teal-200/20 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 right-24 w-12 h-12 bg-emerald-200/30 rounded-full"
        animate={{ 
          y: [0, 15, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute top-1/3 right-12 w-6 h-6 bg-teal-300/25 rounded-full"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      <motion.div 
        className="max-w-md w-full space-y-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            className="mx-auto h-16 w-16"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.4,
              type: "spring",
              stiffness: 200
            }}
          >
            {/* WikiGaiaLab Logo */}
            <motion.div 
              className="relative w-full h-full bg-teal-600 rounded-full flex items-center justify-center group cursor-pointer"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(0, 184, 148, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.svg
                fill="white"
                viewBox="0 0 24 24"
                className="w-8 h-8"
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 9.36 9 11 5.16-1.64 9-5.45 9-11V7l-10-5z" />
              </motion.svg>
              {/* Heart accent for community focus */}
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.h2 
            className="mt-6 text-3xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Benvenuto nel Laboratorio
          </motion.h2>
          <motion.p 
            className="mt-2 text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Come in un antico laboratorio di paese, qui ci ritroviamo per creare soluzioni insieme
          </motion.p>
        </motion.div>

        {/* Login Form */}
        <motion.div 
          className="mt-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <motion.div 
            className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            whileHover={{ 
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
            }}
          >
            {/* Error Message */}
            <AnimatePresence>
              {(error || errorParam) && (
                <motion.div 
                  className="mb-6 bg-red-50 border border-red-200 rounded-md p-4"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex">
                    <motion.div 
                      className="flex-shrink-0"
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      transition={{ delay: 0.1 }}
                    >
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
                    </motion.div>
                    <motion.div 
                      className="ml-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm text-red-800">
                        {error || getErrorMessage(errorParam)}
                      </p>
                    </motion.div>
                    <div className="ml-auto pl-3">
                      <motion.button
                        onClick={clearError}
                        className="inline-flex text-red-400 hover:text-red-600"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Login Button */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              {/* Development mode debug info - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div 
                  className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.6 }}
                >
                  <div className="flex">
                    <motion.div 
                      className="flex-shrink-0"
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      transition={{ delay: 1.7 }}
                    >
                      <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.div>
                    <motion.div 
                      className="ml-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.8 }}
                    >
                      <p className="text-sm text-teal-800">
                        <strong>🔧 Development Mode:</strong><br/>
                        • <motion.a 
                          href="/login?demo=true" 
                          className="underline hover:text-teal-900"
                          whileHover={{ scale: 1.05 }}
                        >
                          Demo Mode
                        </motion.a> - Test with mock user<br/>
                        • <motion.a 
                          href="/login?demo=false" 
                          className="underline hover:text-teal-900"
                          whileHover={{ scale: 1.05 }}
                        >
                          Real OAuth
                        </motion.a> - Use Google authentication
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                <GoogleLoginButton />
              </motion.div>
            </motion.div>

            {/* Features */}
            <motion.div 
              className="mt-8 pt-6 border-t border-teal-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <motion.h3 
                className="text-sm font-medium text-gray-900 mb-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 }}
              >
                Cosa puoi fare nel Laboratorio:
              </motion.h3>
              <motion.ul 
                className="space-y-3 text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 }}
              >
                {[
                  {
                    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                    bgColor: "bg-teal-100",
                    iconColor: "text-teal-600",
                    text: "Porta i tuoi problemi quotidiani al banco del laboratorio"
                  },
                  {
                    icon: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
                    bgColor: "bg-rose-100",
                    iconColor: "text-rose-600",
                    text: "Riconosci i problemi degli altri e dona il tuo cuore",
                    fillRule: "evenodd",
                    clipRule: "evenodd"
                  },
                  {
                    icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z",
                    bgColor: "bg-teal-100",
                    iconColor: "text-teal-600",
                    text: "Collabora con i maestri artigiani per costruire soluzioni"
                  },
                  {
                    icon: "M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z",
                    bgColor: "bg-emerald-100",
                    iconColor: "text-emerald-600",
                    text: "Usa tutti gli attrezzi del laboratorio gratuitamente",
                    fillRule: "evenodd",
                    clipRule: "evenodd"
                  }
                ].map((feature, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-center group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2 + (index * 0.1) }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className={`flex-shrink-0 w-5 h-5 ${feature.bgColor} rounded-full flex items-center justify-center mr-3`}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <svg 
                        className={`w-3 h-3 ${feature.iconColor}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        {...(feature.fillRule && { fillRule: feature.fillRule })}
                        {...(feature.clipRule && { clipRule: feature.clipRule })}
                      >
                        <path d={feature.icon} />
                      </svg>
                    </motion.div>
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="text-center text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            Continuando, accetti i nostri{' '}
            <motion.div className="inline">
              <Link 
                href="/terms" 
                className="text-teal-600 hover:text-teal-800 transition-colors"
              >
                Termini di Servizio
              </Link>
            </motion.div>{' '}
            e la{' '}
            <motion.div className="inline">
              <Link 
                href="/privacy" 
                className="text-teal-600 hover:text-teal-800 transition-colors"
              >
                Privacy Policy
              </Link>
            </motion.div>
            .
          </motion.div>

          {/* Navigation */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.8 }}
          >
            <motion.div
              whileHover={{ x: -3 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                href="/"
                className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
              >
                ← Torna al Laboratorio
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
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