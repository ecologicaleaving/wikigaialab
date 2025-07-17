'use client';

// Analytics and Conversion Tracking for Landing Page
// Integrates with Google Analytics 4 and custom tracking

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface ConversionMetadata {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  stepNumber?: number;
  userJourney?: string[];
  timestamp?: string;
  sessionId?: string;
  userId?: string;
  [key: string]: any;
}

export interface LandingPageEvent {
  eventName: string;
  eventCategory: string;
  eventLabel?: string;
  value?: number;
  metadata?: ConversionMetadata;
}

// Conversion Funnel Steps
export const conversionFunnelSteps = {
  LANDING_PAGE_VIEW: 'landing_page_view',
  HERO_SECTION_VIEW: 'hero_section_view',
  VALUE_PROP_SCROLL: 'value_prop_scroll',
  SOCIAL_PROOF_VIEW: 'social_proof_view',
  DEMO_INTERACTION: 'demo_interaction',
  CTA_CLICK: 'cta_click',
  AUTH_START: 'auth_start',
  AUTH_COMPLETE: 'auth_complete',
  DASHBOARD_REACHED: 'dashboard_reached',
  FIRST_VOTE: 'first_vote',
  PROBLEM_PROPOSE: 'problem_propose',
  EMAIL_SIGNUP: 'email_signup',
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
  BOUNCE: 'bounce',
  EXIT: 'exit'
} as const;

// Conversion Events
export const conversionEvents = {
  HERO_CTA_CLICK: 'hero_cta_click',
  SECONDARY_CTA_CLICK: 'secondary_cta_click',
  DEMO_VOTE_CLICK: 'demo_vote_click',
  TESTIMONIAL_CLICK: 'testimonial_click',
  PROBLEM_BROWSE_CLICK: 'problem_browse_click',
  SOCIAL_SHARE_CLICK: 'social_share_click',
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  CONTACT_CLICK: 'contact_click'
} as const;

// Session Management
let sessionId: string | null = null;
let sessionStartTime: number | null = null;

export const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStartTime = Date.now();
  }
  return sessionId;
};

export const getSessionDuration = (): number => {
  if (!sessionStartTime) return 0;
  return Date.now() - sessionStartTime;
};

// User ID management
export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wikigaialab_user_id');
  }
  return null;
};

export const setCurrentUserId = (userId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wikigaialab_user_id', userId);
  }
};

// Google Analytics Integration
export const initializeAnalytics = (gtagId: string): void => {
  if (typeof window === 'undefined') return;

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', gtagId, {
    page_title: 'WikiGaiaLab - Community per Soluzioni AI',
    page_location: window.location.href,
    custom_map: {
      'custom_session_id': 'session_id',
      'custom_user_journey': 'user_journey',
      'custom_source': 'source'
    }
  });
};

// Track Landing Page Events
export const trackLandingPageEvent = (
  eventName: string,
  parameters: ConversionMetadata = {}
): void => {
  if (typeof window === 'undefined') return;

  const eventData = {
    event_category: 'landing_page',
    event_label: parameters.source || 'unknown',
    value: parameters.value || 1,
    custom_parameters: {
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getCurrentUserId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      session_duration: getSessionDuration(),
      ...parameters
    }
  };

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
  }

  // Custom analytics endpoint
  sendToCustomAnalytics(eventName, eventData);
};

// Track Conversion Funnel
export const trackConversionFunnel = (
  step: string,
  metadata: ConversionMetadata = {}
): void => {
  if (typeof window === 'undefined') return;

  const funnelData = {
    event_category: 'conversion_funnel',
    event_label: step,
    value: 1,
    custom_parameters: {
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getCurrentUserId(),
      step_number: metadata.stepNumber || 1,
      user_journey: metadata.userJourney || [],
      source: metadata.source || 'direct',
      medium: metadata.medium || 'web',
      campaign: metadata.campaign || 'landing_page',
      session_duration: getSessionDuration(),
      ...metadata
    }
  };

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', step, funnelData);
  }

  // Custom analytics endpoint
  sendToCustomAnalytics(`funnel_${step}`, funnelData);
};

// Track User Interactions
export const trackUserInteraction = (
  element: string,
  action: string,
  metadata: ConversionMetadata = {}
): void => {
  trackLandingPageEvent(`${element}_${action}`, {
    element,
    action,
    ...metadata
  });
};

// Track Scroll Depth
export const trackScrollDepth = (percentage: number): void => {
  if (typeof window === 'undefined') return;

  // Only track at 25%, 50%, 75%, and 100% intervals
  const trackingPoints = [25, 50, 75, 100];
  if (!trackingPoints.includes(percentage)) return;

  trackLandingPageEvent(conversionFunnelSteps.SCROLL_DEPTH, {
    scroll_percentage: percentage,
    page_height: document.documentElement.scrollHeight,
    viewport_height: window.innerHeight
  });
};

// Track Time on Page
export const trackTimeOnPage = (seconds: number): void => {
  if (typeof window === 'undefined') return;

  // Track time intervals: 30s, 60s, 2min, 5min
  const trackingPoints = [30, 60, 120, 300];
  if (!trackingPoints.includes(seconds)) return;

  trackLandingPageEvent(conversionFunnelSteps.TIME_ON_PAGE, {
    time_seconds: seconds,
    session_duration: getSessionDuration()
  });
};

// Track Page Performance
export const trackPagePerformance = (): void => {
  if (typeof window === 'undefined' || !window.performance) return;

  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintEntries = window.performance.getEntriesByType('paint');

  const performanceData = {
    load_time: navigation.loadEventEnd - navigation.loadEventStart,
    dom_ready: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    first_paint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
    first_contentful_paint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp_handshake: navigation.connectEnd - navigation.connectStart,
    request_response: navigation.responseEnd - navigation.requestStart
  };

  trackLandingPageEvent('page_performance', performanceData);
};

// Track Conversion Events
export const trackConversion = (
  event: string,
  value: number = 1,
  metadata: ConversionMetadata = {}
): void => {
  if (typeof window === 'undefined') return;

  const conversionData = {
    event_category: 'conversion',
    event_label: event,
    value,
    custom_parameters: {
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getCurrentUserId(),
      conversion_value: value,
      ...metadata
    }
  };

  // Google Analytics Enhanced Ecommerce
  if (window.gtag) {
    window.gtag('event', 'conversion', conversionData);
    
    // Track as goal completion
    window.gtag('event', 'goal_completion', {
      goal_id: event,
      goal_value: value,
      ...conversionData
    });
  }

  // Custom analytics endpoint
  sendToCustomAnalytics(`conversion_${event}`, conversionData);
};

// Custom Analytics API
const sendToCustomAnalytics = async (
  event: string,
  data: any
): Promise<void> => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        session_id: getSessionId()
      })
    });
  } catch (error) {
    console.error('Failed to send analytics data:', error);
  }
};

// Initialize scroll depth tracking
export const initializeScrollTracking = (): void => {
  if (typeof window === 'undefined') return;

  let ticking = false;
  const trackingPoints = new Set<number>();

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollPercentage = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        [25, 50, 75, 100].forEach(point => {
          if (scrollPercentage >= point && !trackingPoints.has(point)) {
            trackingPoints.add(point);
            trackScrollDepth(point);
          }
        });

        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Return cleanup function
  return () => window.removeEventListener('scroll', handleScroll);
};

// Initialize time tracking
export const initializeTimeTracking = (): void => {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();
  const trackingPoints = new Set<number>();

  const timeTracker = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    [30, 60, 120, 300].forEach(point => {
      if (elapsedSeconds >= point && !trackingPoints.has(point)) {
        trackingPoints.add(point);
        trackTimeOnPage(point);
      }
    });

    // Stop tracking after 10 minutes
    if (elapsedSeconds > 600) {
      clearInterval(timeTracker);
    }
  }, 1000);

  // Return cleanup function
  return () => clearInterval(timeTracker);
};

// A/B Testing Support
export const getABTestVariant = (testName: string, variants: string[]): string => {
  if (typeof window === 'undefined') return variants[0];

  const userId = getCurrentUserId() || getSessionId();
  const hash = simpleHash(userId + testName);
  const index = hash % variants.length;
  
  // Track A/B test assignment
  trackLandingPageEvent('ab_test_assignment', {
    test_name: testName,
    variant: variants[index],
    user_id: userId
  });

  return variants[index];
};

// Simple hash function for A/B testing
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Export utility functions
export const analytics = {
  initialize: initializeAnalytics,
  trackEvent: trackLandingPageEvent,
  trackFunnel: trackConversionFunnel,
  trackInteraction: trackUserInteraction,
  trackConversion,
  trackScrollDepth,
  trackTimeOnPage,
  trackPagePerformance,
  initializeScrollTracking,
  initializeTimeTracking,
  getABTestVariant,
  getSessionId,
  getCurrentUserId,
  setCurrentUserId
};

export default analytics;