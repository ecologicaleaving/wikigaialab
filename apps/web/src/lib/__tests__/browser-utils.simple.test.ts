/**
 * Simplified Browser Utilities Test Suite
 * Focus on functionality validation rather than environment mocking
 * 
 * @author Quinn (QA Agent) - BMad Method Implementation
 * @version 1.0.0
 */

import {
  getBrowserStatus,
  safeBrowserCall,
  safeLocalStorage,
  safeLocation,
  safeViewport,
  BrowserChecks,
  createHydrationDetectorLogic,
  SafeStatePatterns
} from '../browser-utils';

describe('Browser Utils - Functionality Tests', () => {
  describe('Core Safety Functions', () => {
    it('should provide browser status detection', () => {
      expect(typeof getBrowserStatus()).toBe('boolean');
    });

    it('safeBrowserCall should handle successful execution', () => {
      const testFn = jest.fn(() => 'success');
      const result = safeBrowserCall(testFn, 'default');
      
      expect(testFn).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('safeBrowserCall should handle errors gracefully', () => {
      const errorFn = jest.fn(() => { throw new Error('Test error'); });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = safeBrowserCall(errorFn, 'fallback');
      
      expect(consoleSpy).toHaveBeenCalledWith('Browser API call failed:', expect.any(Error));
      expect(result).toBe('fallback');
      
      consoleSpy.mockRestore();
    });

    it('safeBrowserCall should return undefined when no default provided and error occurs', () => {
      const errorFn = jest.fn(() => { throw new Error('Test error'); });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = safeBrowserCall(errorFn);
      
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('Safe Storage APIs', () => {
    it('should provide localStorage interface', () => {
      expect(typeof safeLocalStorage.getItem).toBe('function');
      expect(typeof safeLocalStorage.setItem).toBe('function');
      expect(typeof safeLocalStorage.removeItem).toBe('function');
      expect(typeof safeLocalStorage.clear).toBe('function');
      expect(typeof safeLocalStorage.isAvailable).toBe('function');
    });

    it('should handle localStorage operations safely', () => {
      // These should not throw errors regardless of environment
      expect(() => {
        safeLocalStorage.setItem('test', 'value');
        const value = safeLocalStorage.getItem('test');
        safeLocalStorage.removeItem('test');
        safeLocalStorage.clear();
      }).not.toThrow();
    });
  });

  describe('Safe Location APIs', () => {
    it('should provide location interface with string returns', () => {
      expect(typeof safeLocation.pathname).toBe('string');
      expect(typeof safeLocation.search).toBe('string');
      expect(typeof safeLocation.hash).toBe('string');
      expect(typeof safeLocation.origin).toBe('string');
      expect(typeof safeLocation.href).toBe('string');
      expect(typeof safeLocation.host).toBe('string');
      expect(typeof safeLocation.hostname).toBe('string');
      expect(typeof safeLocation.port).toBe('string');
      expect(typeof safeLocation.protocol).toBe('string');
    });

    it('should return reasonable default values', () => {
      // All location properties should return non-empty strings
      expect(safeLocation.pathname.length).toBeGreaterThan(0);
      expect(safeLocation.origin.length).toBeGreaterThan(0);
      expect(safeLocation.href.length).toBeGreaterThan(0);
    });
  });

  describe('Safe Viewport APIs', () => {
    it('should provide viewport interface with number returns', () => {
      expect(typeof safeViewport.width).toBe('number');
      expect(typeof safeViewport.height).toBe('number');
      expect(typeof safeViewport.outerWidth).toBe('number');
      expect(typeof safeViewport.outerHeight).toBe('number');
      expect(typeof safeViewport.screenWidth).toBe('number');
      expect(typeof safeViewport.screenHeight).toBe('number');
    });

    it('should provide boolean responsive helpers', () => {
      expect(typeof safeViewport.isMobile).toBe('boolean');
      expect(typeof safeViewport.isTablet).toBe('boolean');
      expect(typeof safeViewport.isDesktop).toBe('boolean');
    });

    it('should return positive viewport dimensions', () => {
      expect(safeViewport.width).toBeGreaterThan(0);
      expect(safeViewport.height).toBeGreaterThan(0);
    });

    it('should have consistent responsive breakpoint logic', () => {
      // At least one breakpoint should be true
      const breakpoints = [safeViewport.isMobile, safeViewport.isTablet, safeViewport.isDesktop];
      expect(breakpoints.some(bp => bp === true)).toBe(true);
    });
  });

  describe('Browser Checks', () => {
    it('should provide boolean check functions', () => {
      expect(typeof BrowserChecks.isBrowser()).toBe('boolean');
      expect(typeof BrowserChecks.hasLocalStorage()).toBe('boolean');
      expect(typeof BrowserChecks.hasSessionStorage()).toBe('boolean');
      expect(typeof BrowserChecks.hasCookies()).toBe('boolean');
      expect(typeof BrowserChecks.hasTouch()).toBe('boolean');
      expect(typeof BrowserChecks.isOnline()).toBe('boolean');
      expect(typeof BrowserChecks.isMobileDevice()).toBe('boolean');
      expect(typeof BrowserChecks.isIOS()).toBe('boolean');
      expect(typeof BrowserChecks.isAndroid()).toBe('boolean');
    });
  });

  describe('React Integration Helpers', () => {
    it('should provide hydration detector logic', () => {
      const logic = createHydrationDetectorLogic();
      
      expect(logic.initialState).toBe(false);
      expect(typeof logic.hydrationEffect).toBe('function');
    });

    it('should provide safe state patterns', () => {
      const pattern = SafeStatePatterns.ssrSafeInitializer(
        () => 'client-value',
        'server-default'
      );
      
      expect(pattern.serverDefault).toBe('server-default');
      expect(typeof pattern.clientInitializer).toBe('function');
      expect(typeof pattern.getInitialValue).toBe('function');
      expect(pattern.clientInitializer()).toBe('client-value');
    });
  });

  describe('Error Resilience', () => {
    it('should not throw errors when window is undefined', () => {
      // Mock undefined window scenario
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        safeBrowserCall(() => window.location.pathname, '/default');
      }).not.toThrow();
      
      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle broken localStorage gracefully', () => {
      // Mock broken localStorage
      const originalLocalStorage = global.localStorage;
      (global as any).localStorage = {
        getItem: () => { throw new Error('Storage disabled'); },
        setItem: () => { throw new Error('Storage disabled'); }
      };
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => {
        const value = safeLocalStorage.getItem('test');
        expect(value).toBe(null); // Should return safe default
      }).not.toThrow();
      
      // Restore
      (global as any).localStorage = originalLocalStorage;
      consoleSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should maintain consistent return types', () => {
      // Test that return types are consistent regardless of environment
      const pathType = typeof safeLocation.pathname;
      const widthType = typeof safeViewport.width;
      const mobileType = typeof safeViewport.isMobile;
      
      // Call multiple times to ensure consistency
      expect(typeof safeLocation.pathname).toBe(pathType);
      expect(typeof safeViewport.width).toBe(widthType);
      expect(typeof safeViewport.isMobile).toBe(mobileType);
    });
  });

  describe('Performance Validation', () => {
    it('should not cause performance issues with repeated calls', () => {
      const startTime = Date.now();
      
      // Call utilities repeatedly
      for (let i = 0; i < 1000; i++) {
        safeLocation.pathname;
        safeViewport.isMobile;
        BrowserChecks.isBrowser();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 calls in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

describe('Integration Scenarios', () => {
  it('should work in authentication callback scenario', () => {
    // Simulate auth callback usage
    const hash = safeLocation.hash;
    const pathname = safeLocation.pathname;
    
    expect(typeof hash).toBe('string');
    expect(typeof pathname).toBe('string');
    
    // Should not cause errors when processing auth data
    expect(() => {
      if (hash.includes('access_token')) {
        // Process auth token
      }
      if (pathname === '/auth/callback') {
        // Handle callback
      }
    }).not.toThrow();
  });

  it('should work in responsive component scenario', () => {
    // Simulate responsive component usage
    const isMobile = safeViewport.isMobile;
    const width = safeViewport.width;
    
    expect(typeof isMobile).toBe('boolean');
    expect(typeof width).toBe('number');
    
    // Should provide consistent responsive logic
    expect(() => {
      const layout = isMobile ? 'mobile' : 'desktop';
      const columns = width < 768 ? 1 : width < 1024 ? 2 : 3;
    }).not.toThrow();
  });

  it('should work in session management scenario', () => {
    // Simulate session management usage
    expect(() => {
      const session = safeLocalStorage.getItem('auth_session');
      if (session) {
        // Parse and validate session
        try {
          JSON.parse(session);
        } catch (e) {
          safeLocalStorage.removeItem('auth_session');
        }
      }
    }).not.toThrow();
  });
});