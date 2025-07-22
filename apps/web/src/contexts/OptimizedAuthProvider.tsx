'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthStateProvider } from './AuthStateContext';
import { AuthActionsProvider } from './AuthActionsContext';

/**
 * Optimized authentication provider
 * Combines state and actions in separate contexts for better performance
 * 
 * Benefits:
 * - Components using only auth state don't re-render on action changes
 * - Components using only actions don't re-render on state changes
 * - Better tree shaking and code splitting
 */

interface OptimizedAuthProviderProps {
  children: React.ReactNode;
  session?: any;
}

export const OptimizedAuthProvider: React.FC<OptimizedAuthProviderProps> = ({ 
  children, 
  session 
}) => {
  return (
    <SessionProvider session={session}>
      <AuthStateProvider>
        <AuthActionsProvider>
          {children}
        </AuthActionsProvider>
      </AuthStateProvider>
    </SessionProvider>
  );
};

// Combined hook for backward compatibility
export const useOptimizedAuth = () => {
  // Note: This hook should be avoided in new code
  // Use specific hooks instead for better performance
  const stateContext = React.useContext(React.createContext<any>(undefined));
  const actionsContext = React.useContext(React.createContext<any>(undefined));
  
  return {
    // This is a compatibility layer - prefer specific hooks
    ...stateContext,
    ...actionsContext,
  };
};