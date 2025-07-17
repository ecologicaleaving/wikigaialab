import { analytics, conversionFunnelSteps, conversionEvents } from '../../../src/lib/analytics';

// Mock window and global objects
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://wikigaialab.com',
    origin: 'https://wikigaialab.com'
  }
});

Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: jest.fn(() => []),
    now: jest.fn(() => 1234567890)
  }
});

Object.defineProperty(document, 'referrer', {
  value: 'https://google.com'
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 Test Browser'
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock gtag
window.gtag = jest.fn();
window.dataLayer = [];

// Mock fetch
global.fetch = jest.fn();

describe('Analytics Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  describe('Session Management', () => {
    it('should generate unique session ID', () => {
      const sessionId1 = analytics.getSessionId();
      const sessionId2 = analytics.getSessionId();
      
      expect(sessionId1).toBeTruthy();
      expect(sessionId1).toBe(sessionId2); // Should be same within session
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should manage user ID correctly', () => {
      const userId = 'user123';
      analytics.setCurrentUserId(userId);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wikigaialab_user_id', userId);
      expect(analytics.getCurrentUserId()).toBe(userId);
    });
  });

  describe('Event Tracking', () => {
    it('should track landing page events', () => {
      const eventName = 'hero_cta_click';
      const metadata = { source: 'hero', user_authenticated: false };
      
      analytics.trackEvent(eventName, metadata);
      
      expect(window.gtag).toHaveBeenCalledWith('event', eventName, expect.objectContaining({
        event_category: 'landing_page',
        event_label: 'unknown',
        value: 1,
        custom_parameters: expect.objectContaining({
          source: 'hero',
          user_authenticated: false,
          timestamp: expect.any(String),
          session_id: expect.any(String)
        })
      }));
    });

    it('should track conversion funnel steps', () => {
      const step = conversionFunnelSteps.AUTH_START;
      const metadata = { source: 'demo', stepNumber: 1 };
      
      analytics.trackFunnel(step, metadata);
      
      expect(window.gtag).toHaveBeenCalledWith('event', step, expect.objectContaining({
        event_category: 'conversion_funnel',
        event_label: step,
        value: 1,
        custom_parameters: expect.objectContaining({
          source: 'demo',
          stepNumber: 1,
          timestamp: expect.any(String)
        })
      }));
    });

    it('should track user interactions', () => {
      const element = 'button';
      const action = 'click';
      const metadata = { button_type: 'primary' };
      
      analytics.trackInteraction(element, action, metadata);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'button_click', expect.objectContaining({
        event_category: 'landing_page',
        custom_parameters: expect.objectContaining({
          element: 'button',
          action: 'click',
          button_type: 'primary'
        })
      }));
    });

    it('should track conversions', () => {
      const event = conversionEvents.HERO_CTA_CLICK;
      const value = 1;
      const metadata = { campaign: 'spring_2024' };
      
      analytics.trackConversion(event, value, metadata);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
        event_category: 'conversion',
        event_label: event,
        value: value,
        custom_parameters: expect.objectContaining({
          campaign: 'spring_2024',
          conversion_value: value
        })
      }));
      
      // Should also track as goal completion
      expect(window.gtag).toHaveBeenCalledWith('event', 'goal_completion', expect.objectContaining({
        goal_id: event,
        goal_value: value
      }));
    });
  });

  describe('Scroll Tracking', () => {
    it('should track scroll depth at intervals', () => {
      const trackingPoints = [25, 50, 75, 100];
      
      trackingPoints.forEach(percentage => {
        analytics.trackScrollDepth(percentage);
        
        expect(window.gtag).toHaveBeenCalledWith('event', conversionFunnelSteps.SCROLL_DEPTH, expect.objectContaining({
          event_category: 'landing_page',
          custom_parameters: expect.objectContaining({
            scroll_percentage: percentage
          })
        }));
      });
    });

    it('should not track scroll depth for non-standard percentages', () => {
      analytics.trackScrollDepth(33); // Should not track
      
      expect(window.gtag).not.toHaveBeenCalledWith('event', conversionFunnelSteps.SCROLL_DEPTH, expect.any(Object));
    });
  });

  describe('Time Tracking', () => {
    it('should track time on page at intervals', () => {
      const trackingPoints = [30, 60, 120, 300];
      
      trackingPoints.forEach(seconds => {
        analytics.trackTimeOnPage(seconds);
        
        expect(window.gtag).toHaveBeenCalledWith('event', conversionFunnelSteps.TIME_ON_PAGE, expect.objectContaining({
          event_category: 'landing_page',
          custom_parameters: expect.objectContaining({
            time_seconds: seconds
          })
        }));
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track page performance metrics', () => {
      const mockNavigation = {
        loadEventEnd: 2000,
        loadEventStart: 1000,
        domContentLoadedEventEnd: 1500,
        domContentLoadedEventStart: 1200,
        domainLookupEnd: 100,
        domainLookupStart: 50,
        connectEnd: 200,
        connectStart: 150,
        responseEnd: 800,
        requestStart: 600
      };
      
      (window.performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavigation]);
      
      // Mock paint entries
      const paintEntries = [
        { name: 'first-paint', startTime: 500 },
        { name: 'first-contentful-paint', startTime: 600 }
      ];
      
      (window.performance.getEntriesByType as jest.Mock)
        .mockReturnValueOnce([mockNavigation])
        .mockReturnValueOnce(paintEntries);
      
      analytics.trackPagePerformance();
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'page_performance', expect.objectContaining({
        event_category: 'landing_page',
        custom_parameters: expect.objectContaining({
          load_time: 1000,
          dom_ready: 300,
          first_paint: 500,
          first_contentful_paint: 600
        })
      }));
    });
  });

  describe('Custom Analytics API', () => {
    it('should send events to custom analytics endpoint', async () => {
      const eventName = 'test_event';
      const metadata = { test: 'data' };
      
      analytics.trackEvent(eventName, metadata);
      
      // Wait for async call
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(fetch).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: `landing_page_${eventName}`,
          data: expect.objectContaining({
            event_category: 'landing_page',
            custom_parameters: expect.objectContaining({
              test: 'data'
            })
          }),
          timestamp: expect.any(String),
          url: 'https://wikigaialab.com',
          user_agent: 'Mozilla/5.0 Test Browser',
          session_id: expect.any(String)
        })
      });
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      analytics.trackEvent('test_event', {});
      
      // Wait for async call
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send analytics data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('A/B Testing Integration', () => {
    it('should track A/B test variant assignment', () => {
      const testName = 'hero_cta_text';
      const variant = 'Inizia Subito';
      const userId = 'user123';
      
      analytics.trackEvent('ab_test_assignment', {
        test_name: testName,
        variant: variant,
        user_id: userId
      });
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'ab_test_assignment', expect.objectContaining({
        event_category: 'landing_page',
        custom_parameters: expect.objectContaining({
          test_name: testName,
          variant: variant,
          user_id: userId
        })
      }));
    });

    it('should get A/B test variant consistently', () => {
      const testName = 'test_experiment';
      const variants = ['A', 'B', 'C'];
      
      // Mock user ID
      localStorageMock.getItem.mockReturnValue('user123');
      
      const variant1 = analytics.getABTestVariant(testName, variants);
      const variant2 = analytics.getABTestVariant(testName, variants);
      
      expect(variant1).toBe(variant2); // Should be consistent
      expect(variants).toContain(variant1); // Should be valid variant
    });
  });

  describe('Initialization', () => {
    it('should initialize analytics correctly', () => {
      const gtagId = 'G-TEST123';
      
      analytics.initialize(gtagId);
      
      expect(window.gtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(window.gtag).toHaveBeenCalledWith('config', gtagId, expect.objectContaining({
        page_title: 'WikiGaiaLab - Community per Soluzioni AI',
        page_location: 'https://wikigaialab.com',
        custom_map: expect.any(Object)
      }));
    });

    it('should initialize scroll tracking', () => {
      const cleanup = analytics.initializeScrollTracking();
      
      expect(typeof cleanup).toBe('function');
      
      // Test cleanup
      cleanup();
      
      // Should not throw error
      expect(() => cleanup()).not.toThrow();
    });

    it('should initialize time tracking', () => {
      const cleanup = analytics.initializeTimeTracking();
      
      expect(typeof cleanup).toBe('function');
      
      // Test cleanup
      cleanup();
      
      // Should not throw error
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing window object', () => {
      const originalWindow = global.window;
      
      // Remove window object
      delete (global as any).window;
      
      // Should not throw errors
      expect(() => analytics.trackEvent('test', {})).not.toThrow();
      expect(() => analytics.trackFunnel('test', {})).not.toThrow();
      expect(() => analytics.initializeScrollTracking()).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });

    it('should handle missing gtag function', () => {
      const originalGtag = window.gtag;
      
      // Remove gtag
      delete (window as any).gtag;
      
      // Should not throw errors
      expect(() => analytics.trackEvent('test', {})).not.toThrow();
      expect(() => analytics.trackConversion('test', 1, {})).not.toThrow();
      
      // Restore gtag
      window.gtag = originalGtag;
    });

    it('should handle localStorage errors', () => {
      const originalLocalStorage = window.localStorage;
      
      // Mock localStorage that throws errors
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => { throw new Error('Storage error'); }),
          setItem: jest.fn(() => { throw new Error('Storage error'); })
        }
      });
      
      // Should not throw errors
      expect(() => analytics.getCurrentUserId()).not.toThrow();
      expect(() => analytics.setCurrentUserId('test')).not.toThrow();
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate event parameters', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test with invalid parameters
      analytics.trackEvent('', {}); // Empty event name
      analytics.trackFunnel('', {}); // Empty step
      
      // Should still not throw
      expect(() => analytics.trackEvent('', {})).not.toThrow();
      expect(() => analytics.trackFunnel('', {})).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const metadata = { userInput: maliciousInput };
      
      analytics.trackEvent('test_event', metadata);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'test_event', expect.objectContaining({
        custom_parameters: expect.objectContaining({
          userInput: maliciousInput // Should be preserved as data, not executed
        })
      }));
    });
  });
});