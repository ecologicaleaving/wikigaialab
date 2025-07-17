'use client';

import React from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Authentication Loading Spinner Component
 * Specialized loading spinner for authentication flows
 */
export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  message = 'Autenticazione in corso...',
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-gray-600 text-center">{message}</p>
    </div>
  );
};

/**
 * Full Page Auth Loading Spinner
 */
export const FullPageAuthLoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Verifica dell\'autenticazione in corso...',
}) => (
  <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Inline Auth Loading Spinner
 */
export const InlineAuthLoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Caricamento...',
}) => (
  <div className="flex items-center justify-center space-x-2 py-4">
    <LoadingSpinner size="sm" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

export default AuthLoadingSpinner;