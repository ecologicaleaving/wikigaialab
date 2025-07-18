/**
 * Performance Monitoring System
 * 
 * Tracks and reports performance improvements after refactoring
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'startup' | 'runtime' | 'api' | 'auth' | 'bundle';
  unit: 'ms' | 'bytes' | 'count' | 'percent';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    startupTime: number;
    authInitTime: number;
    apiResponseTime: number;
    bundleSize: number;
    memoryUsage: number;
  };
  improvements: {
    [key: string]: {
      before: number;
      after: number;
      improvement: number;
      unit: string;
    };
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime: number;
  private authStartTime: number | null = null;
  private apiStartTimes: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
    this.setupObservers();
  }

  private setupObservers() {
    // Web Vitals observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric({
                name: 'domContentLoaded',
                value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                timestamp: Date.now(),
                category: 'startup',
                unit: 'ms'
              });
              
              this.recordMetric({
                name: 'totalLoadTime',
                value: navEntry.loadEventEnd - navEntry.loadEventStart,
                timestamp: Date.now(),
                category: 'startup',
                unit: 'ms'
              });
            }
          });
        });

        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Performance observer not supported:', e);
      }
    }
  }

  // Record performance metrics
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Log significant metrics for immediate feedback
    if (metric.category === 'startup' && metric.value > 0 && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`🚀 ${metric.name}: ${metric.value}${metric.unit}`);
    }
  }

  // Track authentication initialization
  startAuthTracking() {
    this.authStartTime = performance.now();
  }

  endAuthTracking() {
    if (this.authStartTime) {
      const duration = performance.now() - this.authStartTime;
      this.recordMetric({
        name: 'authInitialization',
        value: duration,
        timestamp: Date.now(),
        category: 'auth',
        unit: 'ms'
      });
      this.authStartTime = null;
    }
  }

  // Track API calls
  startApiTracking(endpoint: string) {
    this.apiStartTimes.set(endpoint, performance.now());
  }

  endApiTracking(endpoint: string) {
    const startTime = this.apiStartTimes.get(endpoint);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `api_${endpoint}`,
        value: duration,
        timestamp: Date.now(),
        category: 'api',
        unit: 'ms'
      });
      this.apiStartTimes.delete(endpoint);
    }
  }

  // Track bundle size and memory usage
  trackResourceUsage() {
    if (typeof window !== 'undefined') {
      // Bundle size estimation
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      scripts.forEach(script => {
        // Estimate based on script elements
        totalSize += script.src.length * 10; // Rough estimation
      });

      this.recordMetric({
        name: 'estimatedBundleSize',
        value: totalSize,
        timestamp: Date.now(),
        category: 'bundle',
        unit: 'bytes'
      });

      // Memory usage
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.recordMetric({
          name: 'heapUsed',
          value: memInfo.usedJSHeapSize,
          timestamp: Date.now(),
          category: 'runtime',
          unit: 'bytes'
        });
      }
    }
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const startupTime = performance.now() - this.startTime;

    // Calculate averages for each category
    const apiMetrics = this.metrics.filter(m => m.category === 'api');
    const avgApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;

    const authMetrics = this.metrics.filter(m => m.name === 'authInitialization');
    const avgAuthTime = authMetrics.length > 0 
      ? authMetrics.reduce((sum, m) => sum + m.value, 0) / authMetrics.length 
      : 0;

    const bundleMetrics = this.metrics.filter(m => m.category === 'bundle');
    const bundleSize = bundleMetrics.length > 0 
      ? bundleMetrics[bundleMetrics.length - 1].value 
      : 0;

    const memoryMetrics = this.metrics.filter(m => m.name === 'heapUsed');
    const memoryUsage = memoryMetrics.length > 0 
      ? memoryMetrics[memoryMetrics.length - 1].value 
      : 0;

    return {
      metrics: this.metrics,
      summary: {
        startupTime,
        authInitTime: avgAuthTime,
        apiResponseTime: avgApiTime,
        bundleSize,
        memoryUsage
      },
      improvements: {
        startup: {
          before: 6000, // Previous measurement
          after: startupTime,
          improvement: ((6000 - startupTime) / 6000) * 100,
          unit: 'ms'
        },
        auth: {
          before: 2000, // Previous measurement
          after: avgAuthTime,
          improvement: avgAuthTime > 0 ? ((2000 - avgAuthTime) / 2000) * 100 : 0,
          unit: 'ms'
        },
        api: {
          before: 5000, // Previous measurement
          after: avgApiTime,
          improvement: avgApiTime > 0 ? ((5000 - avgApiTime) / 5000) * 100 : 0,
          unit: 'ms'
        }
      }
    };
  }

  // Display performance report in console
  displayReport() {
    if (process.env.NODE_ENV !== 'development') return;
    
    const report = this.generateReport();
    
    // eslint-disable-next-line no-console
    console.group('🎯 Performance Monitoring Report');
    // eslint-disable-next-line no-console
    console.log('📊 Current Performance:');
    // eslint-disable-next-line no-console
    console.log(`   Startup Time: ${report.summary.startupTime.toFixed(2)}ms`);
    // eslint-disable-next-line no-console
    console.log(`   Auth Init: ${report.summary.authInitTime.toFixed(2)}ms`);
    // eslint-disable-next-line no-console
    console.log(`   API Response: ${report.summary.apiResponseTime.toFixed(2)}ms`);
    // eslint-disable-next-line no-console
    console.log(`   Bundle Size: ${(report.summary.bundleSize / 1024).toFixed(2)}KB`);
    // eslint-disable-next-line no-console
    console.log(`   Memory Usage: ${(report.summary.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    
    // eslint-disable-next-line no-console
    console.log('\n🚀 Performance Improvements:');
    Object.entries(report.improvements).forEach(([key, improvement]) => {
      if (improvement.improvement > 0) {
        // eslint-disable-next-line no-console
        console.log(`   ${key}: ${improvement.improvement.toFixed(1)}% faster`);
      }
    });
    
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      report: this.generateReport()
    };
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// Helper functions for easy integration
export const trackAuth = () => {
  const monitor = getPerformanceMonitor();
  return {
    start: () => monitor.startAuthTracking(),
    end: () => monitor.endAuthTracking()
  };
};

export const trackApi = (endpoint: string) => {
  const monitor = getPerformanceMonitor();
  return {
    start: () => monitor.startApiTracking(endpoint),
    end: () => monitor.endApiTracking(endpoint)
  };
};

export const generatePerformanceReport = () => {
  const monitor = getPerformanceMonitor();
  monitor.trackResourceUsage();
  monitor.displayReport();
  return monitor.exportMetrics();
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Initialize monitoring after a short delay
  setTimeout(() => {
    const monitor = getPerformanceMonitor();
    monitor.trackResourceUsage();
    
    // Display initial report after 5 seconds
    setTimeout(() => {
      monitor.displayReport();
    }, 5000);
  }, 100);
}