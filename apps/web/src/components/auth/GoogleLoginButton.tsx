'use client';

import React from 'react';
import { useGoogleAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface GoogleLoginButtonProps {
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Google Login Button Component
 * Handles Google OAuth authentication with proper styling and loading states
 */
export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  disabled = false,
  className = '',
  variant = 'default',
  size = 'md',
  children,
  onStart,
  onSuccess,
  onError,
}) => {
  const { signIn, isSigningIn, error } = useGoogleAuth();

  const handleClick = async () => {
    if (isSigningIn || disabled) return;
    
    // Call onStart callback
    if (onStart) {
      onStart();
    }
    
    try {
      await signIn();
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Call onError callback
      if (onError) {
        onError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  // Variant styles
  const variantClasses = {
    default: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
  };

  const baseClasses = `
    w-full
    flex
    items-center
    justify-center
    rounded-lg
    font-medium
    shadow-sm
    transition-all
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      onClick={handleClick}
      disabled={isSigningIn || disabled}
      className={baseClasses}
      type="button"
      aria-label="Accedi con Google"
    >
      {isSigningIn ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Accesso in corso...
        </>
      ) : (
        <>
          <GoogleIcon className="mr-3" />
          {children || 'Accedi con Google'}
        </>
      )}
    </button>
  );
};

/**
 * Google Icon Component
 */
const GoogleIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`w-5 h-5 ${className}`}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * Compact Google Login Button for smaller spaces
 */
export const CompactGoogleLoginButton: React.FC<Omit<GoogleLoginButtonProps, 'size'>> = (props) => (
  <GoogleLoginButton {...props} size="sm" />
);

/**
 * Large Google Login Button for prominent placement
 */
export const LargeGoogleLoginButton: React.FC<Omit<GoogleLoginButtonProps, 'size'>> = (props) => (
  <GoogleLoginButton {...props} size="lg" />
);

export default GoogleLoginButton;