/**
 * Browser Utilities - SSR/CSR Safe Browser API Access
 * 
 * This module provides safe browser environment detection and API access patterns
 * to prevent hydration errors in Next.js applications.
 * 
 * @author Quinn (QA Agent) - BMad Method Implementation
 * @version 1.0.0
 * @created 2025-07-19
 */

// Core browser environment detection
// Use function to allow dynamic checking for testing
export const getBrowserStatus = () => typeof window !== 'undefined';
export const isBrowser = getBrowserStatus();

/**
 * Safely execute browser-only functions with fallback values
 * 
 * @template T The return type of the browser function
 * @param browserFn Function to execute in browser environment
 * @param defaultValue Value to return in SSR environment or on error
 * @returns Result of browserFn or defaultValue
 */
export const safeBrowserCall = <T>(
  browserFn: () => T,
  defaultValue?: T
): T | typeof defaultValue => {
  if (!getBrowserStatus()) return defaultValue;
  
  try {
    return browserFn();
  } catch (error) {
    console.warn('Browser API call failed:', error);
    return defaultValue;
  }
};

/**
 * Safe localStorage wrapper with SSR compatibility
 * All methods return safe defaults when localStorage is unavailable
 */
export const safeLocalStorage = {
  /**
   * Safely get item from localStorage
   * @param key Storage key
   * @returns Stored value or null if unavailable
   */
  getItem: (key: string): string | null =>
    safeBrowserCall(() => localStorage.getItem(key), null),

  /**
   * Safely set item in localStorage
   * @param key Storage key
   * @param value Value to store
   */
  setItem: (key: string, value: string): void =>
    safeBrowserCall(() => localStorage.setItem(key, value)),

  /**
   * Safely remove item from localStorage
   * @param key Storage key to remove
   */
  removeItem: (key: string): void =>
    safeBrowserCall(() => localStorage.removeItem(key)),

  /**
   * Safely clear localStorage
   */
  clear: (): void =>
    safeBrowserCall(() => localStorage.clear()),

  /**
   * Check if localStorage is available
   * @returns true if localStorage is accessible
   */
  isAvailable: (): boolean =>
    safeBrowserCall(() => {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    }, false)
};

/**
 * Safe sessionStorage wrapper with SSR compatibility
 * All methods return safe defaults when sessionStorage is unavailable
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null =>
    safeBrowserCall(() => sessionStorage.getItem(key), null),
  
  setItem: (key: string, value: string): void =>
    safeBrowserCall(() => sessionStorage.setItem(key, value)),
  
  removeItem: (key: string): void =>
    safeBrowserCall(() => sessionStorage.removeItem(key)),
  
  clear: (): void =>
    safeBrowserCall(() => sessionStorage.clear()),

  isAvailable: (): boolean =>
    safeBrowserCall(() => {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, 'test');
      sessionStorage.removeItem(test);
      return true;
    }, false)
};

/**
 * Safe window.location wrapper with SSR-safe defaults
 * Returns sensible defaults when window.location is unavailable
 */
export const safeLocation = {
  /**
   * Get current pathname with SSR-safe default
   */
  get pathname(): string {
    return safeBrowserCall(() => window.location.pathname, '/');
  },

  /**
   * Get current search params with SSR-safe default  
   */
  get search(): string {
    return safeBrowserCall(() => window.location.search, '');
  },

  /**
   * Get current hash with SSR-safe default
   */
  get hash(): string {
    return safeBrowserCall(() => window.location.hash, '');
  },

  /**
   * Get current origin with SSR-safe default
   */
  get origin(): string {
    return safeBrowserCall(() => window.location.origin, 'http://localhost:3000');
  },

  /**
   * Get current href with SSR-safe default
   */
  get href(): string {
    return safeBrowserCall(() => window.location.href, 'http://localhost:3000/');
  },

  /**
   * Get current host with SSR-safe default
   */
  get host(): string {
    return safeBrowserCall(() => window.location.host, 'localhost:3000');
  },

  /**
   * Get current hostname with SSR-safe default
   */
  get hostname(): string {
    return safeBrowserCall(() => window.location.hostname, 'localhost');
  },

  /**
   * Get current port with SSR-safe default
   */
  get port(): string {
    return safeBrowserCall(() => window.location.port, '3000');
  },

  /**
   * Get current protocol with SSR-safe default
   */
  get protocol(): string {
    return safeBrowserCall(() => window.location.protocol, 'http:');
  }
};

/**
 * Safe viewport utilities with mobile-first SSR defaults
 * Returns mobile viewport dimensions during SSR for consistent hydration
 */
export const safeViewport = {
  /**
   * Get window width with mobile-first default (375px)
   */
  get width(): number {
    return safeBrowserCall(() => window.innerWidth, 375);
  },

  /**
   * Get window height with mobile-first default (667px - iPhone SE)
   */
  get height(): number {
    return safeBrowserCall(() => window.innerHeight, 667);
  },

  /**
   * Get outer width with mobile-first default
   */
  get outerWidth(): number {
    return safeBrowserCall(() => window.outerWidth, 375);
  },

  /**
   * Get outer height with mobile-first default
   */
  get outerHeight(): number {
    return safeBrowserCall(() => window.outerHeight, 667);
  },

  /**
   * Get screen width with mobile-first default
   */
  get screenWidth(): number {
    return safeBrowserCall(() => window.screen.width, 375);
  },

  /**
   * Get screen height with mobile-first default
   */
  get screenHeight(): number {
    return safeBrowserCall(() => window.screen.height, 667);
  },

  /**
   * Check if current viewport is mobile (< 768px)
   */
  get isMobile(): boolean {
    return safeViewport.width < 768;
  },

  /**
   * Check if current viewport is tablet (768px - 1023px)
   */
  get isTablet(): boolean {
    const width = safeViewport.width;
    return width >= 768 && width < 1024;
  },

  /**
   * Check if current viewport is desktop (>= 1024px)
   */
  get isDesktop(): boolean {
    return safeViewport.width >= 1024;
  }
};

/**
 * Safe document utilities with SSR compatibility
 */
export const safeDocument = {
  /**
   * Get document title with safe default
   */
  get title(): string {
    return safeBrowserCall(() => document.title, '');
  },

  /**
   * Set document title safely
   */
  setTitle: (title: string): void =>
    safeBrowserCall(() => { document.title = title; }),

  /**
   * Get document ready state with safe default
   */
  get readyState(): DocumentReadyState | 'loading' {
    return safeBrowserCall(() => document.readyState, 'loading');
  },

  /**
   * Check if document is ready
   */
  get isReady(): boolean {
    return safeDocument.readyState === 'complete';
  },

  /**
   * Safely add event listener to document
   */
  addEventListener: (
    type: string, 
    listener: EventListener, 
    options?: boolean | AddEventListenerOptions
  ): void =>
    safeBrowserCall(() => document.addEventListener(type, listener, options)),

  /**
   * Safely remove event listener from document
   */
  removeEventListener: (
    type: string, 
    listener: EventListener, 
    options?: boolean | EventListenerOptions
  ): void =>
    safeBrowserCall(() => document.removeEventListener(type, listener, options))
};

/**
 * Safe navigator utilities with SSR compatibility
 */
export const safeNavigator = {
  /**
   * Get user agent with safe default
   */
  get userAgent(): string {
    return safeBrowserCall(() => navigator.userAgent, '');
  },

  /**
   * Get language with safe default
   */
  get language(): string {
    return safeBrowserCall(() => navigator.language, 'en');
  },

  /**
   * Get languages array with safe default
   */
  get languages(): readonly string[] {
    return safeBrowserCall(() => navigator.languages, ['en']);
  },

  /**
   * Check if online with safe default (assume online during SSR)
   */
  get onLine(): boolean {
    return safeBrowserCall(() => navigator.onLine, true);
  },

  /**
   * Get platform with safe default
   */
  get platform(): string {
    return safeBrowserCall(() => navigator.platform, '');
  },

  /**
   * Get cookieEnabled status with safe default
   */
  get cookieEnabled(): boolean {
    return safeBrowserCall(() => navigator.cookieEnabled, true);
  }
};

/**
 * Utility function for creating hydration detection logic
 * To be used in React components with proper React imports
 * 
 * @example
 * import { useState, useEffect } from 'react';
 * import { createHydrationDetectorLogic } from '@/lib/browser-utils';
 * 
 * const useHydration = () => {
 *   const [isHydrated, setIsHydrated] = useState(false);
 *   
 *   useEffect(() => {
 *     setIsHydrated(true);
 *   }, []);
 *   
 *   return isHydrated;
 * };
 */
export const createHydrationDetectorLogic = () => ({
  initialState: false,
  hydrationEffect: (setIsHydrated: (value: boolean) => void) => {
    setIsHydrated(true);
  }
});

/**
 * Utility patterns for safe state initialization
 * To be used in React components with proper imports
 */
export const SafeStatePatterns = {
  /**
   * Pattern for SSR-safe state initialization
   */
  ssrSafeInitializer: <T>(clientValue: () => T, serverDefault: T) => ({
    serverDefault,
    clientInitializer: clientValue,
    getInitialValue: () => getBrowserStatus() ? clientValue() : serverDefault
  })
};

/**
 * Type guards for browser environment checking
 */
export const BrowserChecks = {
  /**
   * Check if code is running in browser environment
   */
  isBrowser: (): boolean => getBrowserStatus(),

  /**
   * Check if localStorage is available
   */
  hasLocalStorage: (): boolean => safeLocalStorage.isAvailable(),

  /**
   * Check if sessionStorage is available
   */
  hasSessionStorage: (): boolean => safeSessionStorage.isAvailable(),

  /**
   * Check if cookies are enabled
   */
  hasCookies: (): boolean => safeNavigator.cookieEnabled,

  /**
   * Check if device supports touch
   */
  hasTouch: (): boolean =>
    safeBrowserCall(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, false),

  /**
   * Check if connection is online
   */
  isOnline: (): boolean => safeNavigator.onLine,

  /**
   * Check if running on mobile device (basic detection)
   */
  isMobileDevice: (): boolean =>
    safeBrowserCall(() => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), false),

  /**
   * Check if running on iOS device
   */
  isIOS: (): boolean =>
    safeBrowserCall(() => /iPad|iPhone|iPod/.test(navigator.userAgent), false),

  /**
   * Check if running on Android device
   */
  isAndroid: (): boolean =>
    safeBrowserCall(() => /Android/.test(navigator.userAgent), false)
};

/**
 * Performance measurement utilities with SSR safety
 */
export const safePerformance = {
  /**
   * Get current timestamp with fallback
   */
  now: (): number =>
    safeBrowserCall(() => performance.now(), Date.now()),

  /**
   * Mark performance timing
   */
  mark: (name: string): void =>
    safeBrowserCall(() => performance.mark(name)),

  /**
   * Measure performance between marks
   */
  measure: (name: string, startMark?: string, endMark?: string): void =>
    safeBrowserCall(() => performance.measure(name, startMark, endMark)),

  /**
   * Get navigation timing with safe defaults
   */
  getNavigationTiming: () =>
    safeBrowserCall(() => performance.getEntriesByType('navigation')[0], null)
};

// Note: React hooks should be imported separately in components that use them
// This file provides utilities only

/**
 * Default export object with all utilities
 */
export default {
  getBrowserStatus,
  isBrowser,
  safeBrowserCall,
  safeLocalStorage,
  safeSessionStorage,
  safeLocation,
  safeViewport,
  safeDocument,
  safeNavigator,
  safePerformance,
  BrowserChecks,
  createHydrationDetectorLogic,
  SafeStatePatterns
};