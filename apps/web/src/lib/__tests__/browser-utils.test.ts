/**
 * Browser Utilities Test Suite
 * Comprehensive testing for SSR/CSR safe browser API access
 * 
 * @author Quinn (QA Agent) - BMad Method Implementation
 * @version 1.0.0
 */

import {
  isBrowser,
  safeBrowserCall,
  safeLocalStorage,
  safeSessionStorage,
  safeLocation,
  safeViewport,
  safeDocument,
  safeNavigator,
  safePerformance,
  BrowserChecks
} from '../browser-utils';

// Mock window object for testing
const mockWindow = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(), 
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  location: {
    pathname: '/test-path',
    search: '?test=value',
    hash: '#test-hash',
    origin: 'http://test.com',
    href: 'http://test.com/test-path?test=value#test-hash',
    host: 'test.com',
    hostname: 'test.com',
    port: '80',
    protocol: 'http:'
  },
  innerWidth: 1024,
  innerHeight: 768,
  outerWidth: 1024,
  outerHeight: 768,
  screen: {
    width: 1920,
    height: 1080
  }
};

const mockDocument = {
  title: 'Test Document',
  readyState: 'complete',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  language: 'en-US',
  languages: ['en-US', 'en'],
  onLine: true,
  platform: 'Test Platform',
  cookieEnabled: true,
  maxTouchPoints: 0
};

const mockPerformance = {
  now: jest.fn(() => 123.456),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => [{ name: 'navigation', startTime: 0 }])
};

describe('Browser Utils - SSR Environment', () => {
  beforeEach(() => {
    // Simulate SSR environment (no window)
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalNavigator = (global as any).navigator;
    const originalPerformance = (global as any).performance;
    
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).performance;
    
    // Clear module cache to get fresh browser detection
    jest.resetModules();
  });

  describe('Core Browser Detection', () => {
    it('should detect SSR environment correctly', () => {
      expect(isBrowser).toBe(false);
    });

    it('safeBrowserCall should return default values in SSR', () => {
      const result = safeBrowserCall(() => 'browser-value', 'ssr-default');
      expect(result).toBe('ssr-default');
    });

    it('safeBrowserCall should handle no default value', () => {
      const result = safeBrowserCall(() => 'browser-value');
      expect(result).toBeUndefined();
    });
  });

  describe('Safe Storage - SSR', () => {
    it('localStorage should return safe defaults', () => {
      expect(safeLocalStorage.getItem('test')).toBe(null);
      expect(safeLocalStorage.isAvailable()).toBe(false);
      
      // Should not throw errors
      expect(() => {
        safeLocalStorage.setItem('test', 'value');
        safeLocalStorage.removeItem('test');
        safeLocalStorage.clear();
      }).not.toThrow();
    });

    it('sessionStorage should return safe defaults', () => {
      expect(safeSessionStorage.getItem('test')).toBe(null);
      expect(safeSessionStorage.isAvailable()).toBe(false);
      
      // Should not throw errors
      expect(() => {
        safeSessionStorage.setItem('test', 'value');
        safeSessionStorage.removeItem('test');
        safeSessionStorage.clear();
      }).not.toThrow();
    });
  });

  describe('Safe Location - SSR', () => {
    it('should return safe defaults for all location properties', () => {
      expect(safeLocation.pathname).toBe('/');
      expect(safeLocation.search).toBe('');
      expect(safeLocation.hash).toBe('');
      expect(safeLocation.origin).toBe('http://localhost:3000');
      expect(safeLocation.href).toBe('http://localhost:3000/');
      expect(safeLocation.host).toBe('localhost:3000');
      expect(safeLocation.hostname).toBe('localhost');
      expect(safeLocation.port).toBe('3000');
      expect(safeLocation.protocol).toBe('http:');
    });
  });

  describe('Safe Viewport - SSR', () => {
    it('should return mobile-first defaults', () => {
      expect(safeViewport.width).toBe(375);
      expect(safeViewport.height).toBe(667);
      expect(safeViewport.outerWidth).toBe(375);
      expect(safeViewport.outerHeight).toBe(667);
      expect(safeViewport.screenWidth).toBe(375);
      expect(safeViewport.screenHeight).toBe(667);
    });

    it('should calculate responsive breakpoints correctly', () => {
      expect(safeViewport.isMobile).toBe(true);  // 375px < 768px
      expect(safeViewport.isTablet).toBe(false);
      expect(safeViewport.isDesktop).toBe(false);
    });
  });

  describe('Safe Document - SSR', () => {
    it('should return safe defaults', () => {
      expect(safeDocument.title).toBe('');
      expect(safeDocument.readyState).toBe('loading');
      expect(safeDocument.isReady).toBe(false);
      
      // Should not throw errors
      expect(() => {
        safeDocument.setTitle('Test Title');
        safeDocument.addEventListener('click', () => {});
        safeDocument.removeEventListener('click', () => {});
      }).not.toThrow();
    });
  });

  describe('Safe Navigator - SSR', () => {
    it('should return safe defaults', () => {
      expect(safeNavigator.userAgent).toBe('');
      expect(safeNavigator.language).toBe('en');
      expect(safeNavigator.languages).toEqual(['en']);
      expect(safeNavigator.onLine).toBe(true);
      expect(safeNavigator.platform).toBe('');
      expect(safeNavigator.cookieEnabled).toBe(true);
    });
  });

  describe('Browser Checks - SSR', () => {
    it('should return safe defaults for all checks', () => {
      expect(BrowserChecks.isBrowser()).toBe(false);
      expect(BrowserChecks.hasLocalStorage()).toBe(false);
      expect(BrowserChecks.hasSessionStorage()).toBe(false);
      expect(BrowserChecks.hasCookies()).toBe(true);
      expect(BrowserChecks.hasTouch()).toBe(false);
      expect(BrowserChecks.isOnline()).toBe(true);
      expect(BrowserChecks.isMobileDevice()).toBe(false);
      expect(BrowserChecks.isIOS()).toBe(false);
      expect(BrowserChecks.isAndroid()).toBe(false);
    });
  });

  describe('Safe Performance - SSR', () => {
    it('should return safe defaults', () => {
      const now = safePerformance.now();
      expect(typeof now).toBe('number');
      expect(now).toBeGreaterThan(0);
      
      // Should not throw errors
      expect(() => {
        safePerformance.mark('test-mark');
        safePerformance.measure('test-measure');
      }).not.toThrow();
      
      expect(safePerformance.getNavigationTiming()).toBe(null);
    });
  });
});

describe('Browser Utils - Browser Environment', () => {
  beforeEach(() => {
    // Simulate browser environment
    (global as any).window = mockWindow;
    (global as any).document = mockDocument;
    (global as any).navigator = mockNavigator;
    (global as any).performance = mockPerformance;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).performance;
  });

  describe('Core Browser Detection', () => {
    it('should detect browser environment correctly', () => {
      // Re-import to get updated isBrowser value
      jest.resetModules();
      const { isBrowser: browserCheck } = require('../browser-utils');
      expect(browserCheck).toBe(true);
    });

    it('safeBrowserCall should execute functions in browser', () => {
      const testFn = jest.fn(() => 'browser-result');
      const result = safeBrowserCall(testFn, 'default');
      
      expect(testFn).toHaveBeenCalled();
      expect(result).toBe('browser-result');
    });

    it('safeBrowserCall should handle errors gracefully', () => {
      const errorFn = jest.fn(() => { throw new Error('Test error'); });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = safeBrowserCall(errorFn, 'fallback');
      
      expect(consoleSpy).toHaveBeenCalledWith('Browser API call failed:', expect.any(Error));
      expect(result).toBe('fallback');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Safe Storage - Browser', () => {
    it('localStorage should work correctly', () => {
      mockWindow.localStorage.getItem.mockReturnValue('stored-value');
      mockWindow.localStorage.setItem.mockImplementation();
      
      expect(safeLocalStorage.getItem('test-key')).toBe('stored-value');
      expect(mockWindow.localStorage.getItem).toHaveBeenCalledWith('test-key');
      
      safeLocalStorage.setItem('test-key', 'test-value');
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      
      safeLocalStorage.removeItem('test-key');
      expect(mockWindow.localStorage.removeItem).toHaveBeenCalledWith('test-key');
      
      safeLocalStorage.clear();
      expect(mockWindow.localStorage.clear).toHaveBeenCalled();
    });

    it('should detect localStorage availability', () => {
      expect(safeLocalStorage.isAvailable()).toBe(true);
    });
  });

  describe('Safe Location - Browser', () => {
    it('should return actual location values', () => {
      expect(safeLocation.pathname).toBe('/test-path');
      expect(safeLocation.search).toBe('?test=value');
      expect(safeLocation.hash).toBe('#test-hash');
      expect(safeLocation.origin).toBe('http://test.com');
      expect(safeLocation.href).toBe('http://test.com/test-path?test=value#test-hash');
      expect(safeLocation.host).toBe('test.com');
      expect(safeLocation.hostname).toBe('test.com');
      expect(safeLocation.port).toBe('80');
      expect(safeLocation.protocol).toBe('http:');
    });
  });

  describe('Safe Viewport - Browser', () => {
    it('should return actual viewport values', () => {
      expect(safeViewport.width).toBe(1024);
      expect(safeViewport.height).toBe(768);
      expect(safeViewport.outerWidth).toBe(1024);
      expect(safeViewport.outerHeight).toBe(768);
      expect(safeViewport.screenWidth).toBe(1920);
      expect(safeViewport.screenHeight).toBe(1080);
    });

    it('should calculate responsive breakpoints correctly', () => {
      expect(safeViewport.isMobile).toBe(false);   // 1024px >= 768px
      expect(safeViewport.isTablet).toBe(false);   // 1024px >= 1024px  
      expect(safeViewport.isDesktop).toBe(true);   // 1024px >= 1024px
    });
  });

  describe('Safe Document - Browser', () => {
    it('should work with actual document', () => {
      expect(safeDocument.title).toBe('Test Document');
      expect(safeDocument.readyState).toBe('complete');
      expect(safeDocument.isReady).toBe(true);
      
      const mockListener = jest.fn();
      safeDocument.addEventListener('click', mockListener);
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('click', mockListener, undefined);
      
      safeDocument.removeEventListener('click', mockListener);
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('click', mockListener, undefined);
      
      safeDocument.setTitle('New Title');
      expect(mockDocument.title).toBe('New Title');
    });
  });

  describe('Safe Navigator - Browser', () => {
    it('should return actual navigator values', () => {
      expect(safeNavigator.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(safeNavigator.language).toBe('en-US');
      expect(safeNavigator.languages).toEqual(['en-US', 'en']);
      expect(safeNavigator.onLine).toBe(true);
      expect(safeNavigator.platform).toBe('Test Platform');
      expect(safeNavigator.cookieEnabled).toBe(true);
    });
  });

  describe('Browser Checks - Browser', () => {
    it('should return actual browser capabilities', () => {
      expect(BrowserChecks.hasLocalStorage()).toBe(true);
      expect(BrowserChecks.hasSessionStorage()).toBe(true);
      expect(BrowserChecks.hasCookies()).toBe(true);
      expect(BrowserChecks.hasTouch()).toBe(false);
      expect(BrowserChecks.isOnline()).toBe(true);
    });

    it('should detect mobile devices correctly', () => {
      // Mock mobile user agent
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      expect(BrowserChecks.isMobileDevice()).toBe(true);
      expect(BrowserChecks.isIOS()).toBe(true);
      expect(BrowserChecks.isAndroid()).toBe(false);
      
      // Mock Android user agent
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F)';
      expect(BrowserChecks.isAndroid()).toBe(true);
      expect(BrowserChecks.isIOS()).toBe(false);
    });
  });

  describe('Safe Performance - Browser', () => {
    it('should work with actual performance API', () => {
      expect(safePerformance.now()).toBe(123.456);
      expect(mockPerformance.now).toHaveBeenCalled();
      
      safePerformance.mark('test-mark');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-mark');
      
      safePerformance.measure('test-measure', 'start', 'end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end');
      
      const navTiming = safePerformance.getNavigationTiming();
      expect(navTiming).toEqual({ name: 'navigation', startTime: 0 });
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    // Simulate browser environment with broken APIs
    (global as any).window = {
      localStorage: {
        getItem: () => { throw new Error('Storage error'); },
        setItem: () => { throw new Error('Storage error'); }
      },
      location: {
        get pathname() { throw new Error('Location error'); }
      }
    };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    expect(safeLocalStorage.getItem('test')).toBe(null);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle location errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    expect(safeLocation.pathname).toBe('/');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe('Integration Tests', () => {
  it('should provide consistent API across SSR and browser environments', () => {
    // Test that all functions exist and return appropriate types
    const functions = [
      'safeBrowserCall',
      'safeLocalStorage',
      'safeSessionStorage', 
      'safeLocation',
      'safeViewport',
      'safeDocument',
      'safeNavigator',
      'safePerformance',
      'BrowserChecks'
    ];
    
    functions.forEach(funcName => {
      expect(require('../browser-utils')[funcName]).toBeDefined();
    });
  });

  it('should maintain type safety across environments', () => {
    // These should work in both SSR and browser
    expect(typeof safeLocation.pathname).toBe('string');
    expect(typeof safeViewport.width).toBe('number');
    expect(typeof safeViewport.isMobile).toBe('boolean');
    expect(typeof BrowserChecks.isBrowser()).toBe('boolean');
  });
});