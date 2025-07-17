import { trackEvent } from './analytics';

export interface NavigationEvent {
  from: string;
  to: string;
  method: 'click' | 'keyboard' | 'swipe' | 'breadcrumb' | 'direct';
  timestamp: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
}

export interface NavigationMetrics {
  totalClicks: number;
  uniquePages: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; visits: number }>;
  navigationPaths: Array<{ path: string; count: number }>;
}

class NavigationAnalytics {
  private sessionId: string;
  private sessionStart: number;
  private currentPage: string;
  private navigationHistory: NavigationEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.currentPage = typeof window !== 'undefined' ? window.location.pathname : '';
  }

  private generateSessionId(): string {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track navigation events
  trackNavigation(to: string, method: NavigationEvent['method'] = 'click') {
    const event: NavigationEvent = {
      from: this.currentPage,
      to,
      method,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.sessionId
    };

    this.navigationHistory.push(event);
    this.currentPage = to;

    // Track in analytics
    trackEvent('navigation', {
      from: event.from,
      to: event.to,
      method: event.method,
      session_id: this.sessionId,
      timestamp: event.timestamp
    });

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('navigation_history') || '[]';
        const history = JSON.parse(stored);
        history.push(event);
        
        // Keep only last 50 navigation events
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('navigation_history', JSON.stringify(history));
      } catch (error) {
        console.warn('Failed to store navigation history:', error);
      }
    }
  }

  // Track mobile menu interactions
  trackMobileMenuUsage(action: 'open' | 'close' | 'swipe', method: string = 'touch') {
    trackEvent('mobile_menu', {
      action,
      method,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Track search usage
  trackSearchUsage(query: string, results: number, source: 'header' | 'mobile' = 'header') {
    trackEvent('search', {
      query: query.slice(0, 100), // Limit query length for privacy
      results,
      source,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Track keyboard shortcuts usage
  trackKeyboardShortcut(shortcut: string, action: string) {
    trackEvent('keyboard_shortcut', {
      shortcut,
      action,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Track user engagement with breadcrumbs
  trackBreadcrumbUsage(level: number, target: string) {
    trackEvent('breadcrumb', {
      level,
      target,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Get navigation metrics
  getNavigationMetrics(): NavigationMetrics {
    const history = this.getNavigationHistory();
    const uniquePages = new Set(history.map(event => event.to)).size;
    const totalClicks = history.length;
    const sessionDuration = Date.now() - this.sessionStart;

    // Calculate page visits
    const pageVisits = history.reduce((acc, event) => {
      acc[event.to] = (acc[event.to] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageVisits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, visits]) => ({ page, visits }));

    // Calculate navigation paths
    const paths = history.reduce((acc, event, index) => {
      if (index > 0) {
        const path = `${event.from} → ${event.to}`;
        acc[path] = (acc[path] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const navigationPaths = Object.entries(paths)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    return {
      totalClicks,
      uniquePages,
      averageSessionDuration: sessionDuration / 1000, // Convert to seconds
      bounceRate: totalClicks <= 1 ? 1 : 0, // Simplified bounce rate
      topPages,
      navigationPaths
    };
  }

  // Get navigation history
  getNavigationHistory(): NavigationEvent[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('navigation_history') || '[]';
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to retrieve navigation history:', error);
      return [];
    }
  }

  // Clear navigation history
  clearNavigationHistory() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('navigation_history');
    }
    this.navigationHistory = [];
  }

  // Get session statistics
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      sessionDuration: Date.now() - this.sessionStart,
      currentPage: this.currentPage,
      navigationCount: this.navigationHistory.length
    };
  }
}

// Create singleton instance
export const navigationAnalytics = new NavigationAnalytics();

// Convenience functions for common tracking scenarios
export const trackPageView = (page: string) => {
  navigationAnalytics.trackNavigation(page, 'direct');
};

export const trackLinkClick = (from: string, to: string) => {
  navigationAnalytics.trackNavigation(to, 'click');
};

export const trackMobileMenuOpen = () => {
  navigationAnalytics.trackMobileMenuUsage('open');
};

export const trackMobileMenuClose = () => {
  navigationAnalytics.trackMobileMenuUsage('close');
};

export const trackMobileMenuSwipe = () => {
  navigationAnalytics.trackMobileMenuUsage('close', 'swipe');
};

export const trackHeaderSearch = (query: string, results: number) => {
  navigationAnalytics.trackSearchUsage(query, results, 'header');
};

export const trackKeyboardNavigation = (shortcut: string, target: string) => {
  navigationAnalytics.trackKeyboardShortcut(shortcut, target);
};

export const trackBreadcrumbClick = (level: number, target: string) => {
  navigationAnalytics.trackBreadcrumbUsage(level, target);
};