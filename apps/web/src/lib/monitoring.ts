/**
 * Monitoring and alerting utilities for WikiGaiaLab
 * Provides client-side monitoring capabilities
 */

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: string;
}

interface AlertData {
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;
  private metricsBuffer: MetricData[] = [];
  private alertsBuffer: AlertData[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.startPeriodicFlush();
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    
    console.log('🔍 Monitoring service initialized');
  }

  // Metrics collection
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString()
    };

    this.metricsBuffer.push(metric);
    
    // Flush immediately for critical metrics
    if (this.isCriticalMetric(name)) {
      this.flushMetrics();
    }
  }

  // Custom metrics
  recordUserAction(action: string, metadata?: Record<string, any>): void {
    this.recordMetric('user_action', 1, {
      action,
      page: window.location.pathname,
      ...metadata
    });
  }

  recordPageView(page: string, loadTime?: number): void {
    this.recordMetric('page_view', 1, { page });
    
    if (loadTime) {
      this.recordMetric('page_load_time', loadTime, { page });
    }
  }

  recordError(error: Error, context?: Record<string, any>): void {
    this.sendAlert({
      type: 'error',
      message: error.message,
      source: 'client',
      metadata: {
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }

  recordAPICall(endpoint: string, method: string, duration: number, status: number): void {
    this.recordMetric('api_call', 1, {
      endpoint,
      method,
      status: status.toString()
    });
    
    this.recordMetric('api_response_time', duration, {
      endpoint,
      method
    });

    // Alert on API errors
    if (status >= 400) {
      this.sendAlert({
        type: status >= 500 ? 'error' : 'warning',
        message: `API call failed: ${method} ${endpoint}`,
        source: 'api',
        metadata: {
          endpoint,
          method,
          status,
          duration
        }
      });
    }
  }

  // Performance monitoring
  recordPerformanceMetric(name: string, value: number): void {
    this.recordMetric(`performance_${name}`, value);
    
    // Alert on performance issues
    if (this.isPerformanceIssue(name, value)) {
      this.sendAlert({
        type: 'warning',
        message: `Performance issue detected: ${name} = ${value}`,
        source: 'performance',
        metadata: { metric: name, value }
      });
    }
  }

  // Alerts
  sendAlert(alertData: AlertData): void {
    this.alertsBuffer.push(alertData);
    
    // Send critical alerts immediately
    if (alertData.type === 'error') {
      this.flushAlerts();
    }
  }

  // Business metrics
  recordBusinessMetric(event: string, value: number = 1, metadata?: Record<string, any>): void {
    this.recordMetric(`business_${event}`, value, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Voting metrics
  recordVote(problemId: string, userId: string): void {
    this.recordBusinessMetric('vote_cast', 1, {
      problemId,
      userId
    });
  }

  recordProblemCreated(problemId: string, category: string): void {
    this.recordBusinessMetric('problem_created', 1, {
      problemId,
      category
    });
  }

  recordUserRegistration(userId: string, method: string): void {
    this.recordBusinessMetric('user_registered', 1, {
      userId,
      method
    });
  }

  // Health monitoring
  startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private performHealthCheck(): void {
    const startTime = Date.now();
    
    // Check API health
    fetch('/api/health')
      .then(response => {
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          this.recordMetric('health_check', 1, { status: 'healthy' });
          this.recordMetric('api_response_time', responseTime, { endpoint: '/api/health' });
        } else {
          this.sendAlert({
            type: 'error',
            message: 'Health check failed',
            source: 'health-check',
            metadata: { status: response.status, responseTime }
          });
        }
      })
      .catch(error => {
        this.sendAlert({
          type: 'error',
          message: 'Health check request failed',
          source: 'health-check',
          metadata: { error: error.message }
        });
      });
  }

  // Private methods
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
      this.flushAlerts();
    }, 30000); // Flush every 30 seconds
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      });
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }

  private async flushAlerts(): Promise<void> {
    if (this.alertsBuffer.length === 0) return;

    const alerts = [...this.alertsBuffer];
    this.alertsBuffer = [];

    for (const alert of alerts) {
      try {
        await fetch('/api/monitoring/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send alert:', error);
        // Re-add alert to buffer for retry
        this.alertsBuffer.push(alert);
      }
    }
  }

  private setupErrorHandling(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would integrate with web-vitals library
      console.log('Core Web Vitals monitoring enabled');
    }

    // Monitor navigation timing
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      this.recordPerformanceMetric('page_load_time', loadTime);
    }
  }

  private isCriticalMetric(name: string): boolean {
    const criticalMetrics = ['error', 'api_error', 'performance_critical'];
    return criticalMetrics.some(metric => name.includes(metric));
  }

  private isPerformanceIssue(name: string, value: number): boolean {
    const thresholds = {
      'page_load_time': 3000, // 3 seconds
      'api_response_time': 2000, // 2 seconds
      'memory_usage': 80 // 80%
    };

    return thresholds[name] && value > thresholds[name];
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining data
    this.flushMetrics();
    this.flushAlerts();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// React hook for monitoring
export function useMonitoring() {
  const recordMetric = (name: string, value: number, tags?: Record<string, string>) => {
    monitoring.recordMetric(name, value, tags);
  };

  const recordUserAction = (action: string, metadata?: Record<string, any>) => {
    monitoring.recordUserAction(action, metadata);
  };

  const recordError = (error: Error, context?: Record<string, any>) => {
    monitoring.recordError(error, context);
  };

  return {
    recordMetric,
    recordUserAction,
    recordError
  };
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  monitoring.initialize();
}