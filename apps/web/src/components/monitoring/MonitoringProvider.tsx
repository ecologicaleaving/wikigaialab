'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { monitoring } from '@/lib/monitoring';

interface MonitoringContextType {
  recordUserAction: (action: string, metadata?: Record<string, any>) => void;
  recordError: (error: Error, context?: Record<string, any>) => void;
  recordBusinessMetric: (event: string, value?: number, metadata?: Record<string, any>) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

interface MonitoringProviderProps {
  children: ReactNode;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children }) => {
  useEffect(() => {
    // Disable monitoring for development to improve performance
    if (process.env.NODE_ENV === 'development') {
      console.log('Monitoring disabled in development mode');
      return;
    }
    
    // Initialize monitoring service
    monitoring.initialize();
    
    // Start health checks
    monitoring.startHealthCheck();
    
    // Record page view
    monitoring.recordPageView(window.location.pathname);
    
    // Cleanup on unmount
    return () => {
      monitoring.destroy();
    };
  }, []);

  const recordUserAction = (action: string, metadata?: Record<string, any>) => {
    monitoring.recordUserAction(action, metadata);
  };

  const recordError = (error: Error, context?: Record<string, any>) => {
    monitoring.recordError(error, context);
  };

  const recordBusinessMetric = (event: string, value?: number, metadata?: Record<string, any>) => {
    monitoring.recordBusinessMetric(event, value, metadata);
  };

  return (
    <MonitoringContext.Provider value={{
      recordUserAction,
      recordError,
      recordBusinessMetric
    }}>
      {children}
    </MonitoringContext.Provider>
  );
};