import { useCallback } from 'react';
import { monitoring } from '@/lib/monitoring';

export const useApiMonitoring = () => {
  const monitoredFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      // Record API call metrics
      monitoring.recordAPICall(url, method, duration, response.status);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed API call
      monitoring.recordAPICall(url, method, duration, 0);
      
      // Record error
      monitoring.recordError(error as Error, {
        url,
        method,
        duration
      });
      
      throw error;
    }
  }, []);

  return { monitoredFetch };
};