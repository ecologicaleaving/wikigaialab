'use client';

import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

/**
 * Loading Spinner Component
 * Animated loading spinner with multiple sizes and colors
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'primary',
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Caricamento in corso"
    >
      <span className="sr-only">Caricamento in corso...</span>
    </div>
  );
};

/**
 * Centered Loading Spinner
 */
export const CenteredLoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => (
  <div className="flex items-center justify-center">
    <LoadingSpinner {...props} />
  </div>
);

/**
 * Loading Spinner with Text
 */
interface LoadingSpinnerWithTextProps extends LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinnerWithText: React.FC<LoadingSpinnerWithTextProps> = ({
  text = 'Caricamento in corso...',
  ...props
}) => (
  <div className="flex items-center justify-center space-x-2">
    <LoadingSpinner {...props} />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

/**
 * Full Page Loading Spinner
 */
export const FullPageLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Caricamento in corso...' 
}) => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;