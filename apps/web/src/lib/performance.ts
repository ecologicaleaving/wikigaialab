'use client';

import { analytics } from './analytics';

// Performance optimization utilities for WikiGaiaLab
// Focus on Core Web Vitals and mobile performance

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

export interface OptimizationConfig {
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enablePrefetch: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
}

// Core Web Vitals targets
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000
  },
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25
  },
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000
  },
  TTFB: {
    GOOD: 800,
    NEEDS_IMPROVEMENT: 1800
  },
  TTI: {
    GOOD: 3500,
    NEEDS_IMPROVEMENT: 5800
  }
};

// Performance Observer
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.reportMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('fcp', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // Navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.reportMetric('ttfb', this.metrics.ttfb);
      }
    });
  }

  private reportMetric(name: string, value: number): void {
    const threshold = this.getThreshold(name);
    const rating = this.getRating(value, threshold);
    
    analytics.trackEvent('core_web_vitals', {
      metric: name,
      value,
      rating,
      threshold_good: threshold.GOOD,
      threshold_needs_improvement: threshold.NEEDS_IMPROVEMENT
    });
  }

  private getThreshold(name: string): { GOOD: number; NEEDS_IMPROVEMENT: number } {
    switch (name) {
      case 'lcp':
        return PERFORMANCE_THRESHOLDS.LCP;
      case 'fid':
        return PERFORMANCE_THRESHOLDS.FID;
      case 'cls':
        return PERFORMANCE_THRESHOLDS.CLS;
      case 'fcp':
        return PERFORMANCE_THRESHOLDS.FCP;
      case 'ttfb':
        return PERFORMANCE_THRESHOLDS.TTFB;
      case 'tti':
        return PERFORMANCE_THRESHOLDS.TTI;
      default:
        return { GOOD: 0, NEEDS_IMPROVEMENT: 1000 };
    }
  }

  private getRating(value: number, threshold: { GOOD: number; NEEDS_IMPROVEMENT: number }): string {
    if (value <= threshold.GOOD) return 'good';
    if (value <= threshold.NEEDS_IMPROVEMENT) return 'needs-improvement';
    return 'poor';
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

export const initializePerformanceMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
};

export const getPerformanceMetrics = (): Partial<PerformanceMetrics> => {
  return performanceMonitor?.getMetrics() || {};
};

// Image optimization utilities
export const createOptimizedImageUrl = (
  src: string,
  width: number,
  quality: number = 75,
  format: 'webp' | 'avif' | 'jpeg' | 'png' = 'webp'
): string => {
  // In a real implementation, this would integrate with a service like Cloudinary or Vercel Image Optimization
  const params = new URLSearchParams({
    w: width.toString(),
    q: quality.toString(),
    f: format
  });
  
  return `${src}?${params.toString()}`;
};

// Lazy loading utility
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Resource prefetching
export const prefetchResource = (url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  
  if (type !== 'fetch') {
    link.as = type;
  }
  
  document.head.appendChild(link);
};

// Critical resource preloading
export const preloadResource = (url: string, type: 'script' | 'style' | 'image' | 'font'): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  
  if (type === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
};

// Bundle size analysis
export const getBundleSize = async (): Promise<{ js: number; css: number; total: number }> => {
  if (typeof window === 'undefined') {
    return { js: 0, css: 0, total: 0 };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  let jsSize = 0;
  let cssSize = 0;

  resources.forEach(resource => {
    if (resource.name.includes('.js')) {
      jsSize += resource.transferSize || 0;
    } else if (resource.name.includes('.css')) {
      cssSize += resource.transferSize || 0;
    }
  });

  return {
    js: jsSize,
    css: cssSize,
    total: jsSize + cssSize
  };
};

// Memory usage monitoring
export const getMemoryUsage = (): { used: number; total: number; percentage: number } => {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return { used: 0, total: 0, percentage: 0 };
  }

  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
  };
};

// Connection quality detection
export const getConnectionQuality = (): { type: string; downlink: number; rtt: number; saveData: boolean } => {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return { type: 'unknown', downlink: 0, rtt: 0, saveData: false };
  }

  const connection = (navigator as any).connection;
  return {
    type: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

// Adaptive loading based on connection
export const shouldLoadHighQuality = (): boolean => {
  const connection = getConnectionQuality();
  
  // Don't load high quality on slow connections or when save data is enabled
  if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
    return false;
  }
  
  return true;
};

// Performance budget checker
export const checkPerformanceBudget = (budget: Partial<PerformanceMetrics>): boolean => {
  const metrics = getPerformanceMetrics();
  
  for (const [key, value] of Object.entries(budget)) {
    const metricValue = metrics[key as keyof PerformanceMetrics];
    if (metricValue && metricValue > value) {
      console.warn(`Performance budget exceeded for ${key}: ${metricValue} > ${value}`);
      return false;
    }
  }
  
  return true;
};

// Service Worker registration
export const registerServiceWorker = async (swUrl: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log('Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Export utilities
export const performance = {
  initialize: initializePerformanceMonitoring,
  getMetrics: getPerformanceMetrics,
  createOptimizedImageUrl,
  createIntersectionObserver,
  prefetchResource,
  preloadResource,
  getBundleSize,
  getMemoryUsage,
  getConnectionQuality,
  shouldLoadHighQuality,
  checkPerformanceBudget,
  registerServiceWorker,
  THRESHOLDS: PERFORMANCE_THRESHOLDS
};

export default performance;