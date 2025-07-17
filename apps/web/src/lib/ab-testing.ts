'use client';

import { analytics } from './analytics';

// A/B Testing Framework for WikiGaiaLab Landing Page
// Provides split testing capabilities for conversion optimization

export interface ABTestConfig {
  testName: string;
  variants: string[];
  weights?: number[];
  description?: string;
  startDate?: Date;
  endDate?: Date;
  targetMetric?: string;
  minimumSampleSize?: number;
  enabled?: boolean;
}

export interface ABTestResult {
  variant: string;
  testName: string;
  userIdentifier: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ABTestStats {
  variant: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isStatisticallySignificant: boolean;
}

// Landing Page A/B Tests Configuration
export const landingPageTests: Record<string, ABTestConfig> = {
  hero_cta_text: {
    testName: 'hero_cta_text',
    variants: ['Inizia Subito', 'Unisciti alla Community', 'Prova Ora', 'Registrati Gratis'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test different CTA text in hero section',
    targetMetric: 'cta_click_rate',
    minimumSampleSize: 100,
    enabled: true
  },
  
  value_proposition: {
    testName: 'value_proposition',
    variants: ['community_focused', 'innovation_focused', 'problem_solving_focused', 'democratic_focused'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test different value proposition messaging',
    targetMetric: 'scroll_depth',
    minimumSampleSize: 150,
    enabled: true
  },
  
  social_proof_position: {
    testName: 'social_proof_position',
    variants: ['after_hero', 'after_how_it_works', 'before_cta', 'floating_badge'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test social proof section positioning',
    targetMetric: 'conversion_rate',
    minimumSampleSize: 200,
    enabled: true
  },
  
  hero_layout: {
    testName: 'hero_layout',
    variants: ['centered', 'left_aligned', 'two_column', 'video_background'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test different hero section layouts',
    targetMetric: 'engagement_rate',
    minimumSampleSize: 120,
    enabled: true
  },
  
  testimonial_format: {
    testName: 'testimonial_format',
    variants: ['carousel', 'grid', 'single_featured', 'video_testimonials'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test testimonial display formats',
    targetMetric: 'testimonial_interaction',
    minimumSampleSize: 80,
    enabled: true
  },
  
  onboarding_flow: {
    testName: 'onboarding_flow',
    variants: ['progressive_disclosure', 'single_step', 'guided_tour', 'interactive_demo'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test different onboarding approaches',
    targetMetric: 'onboarding_completion',
    minimumSampleSize: 100,
    enabled: true
  },
  
  mobile_nav: {
    testName: 'mobile_nav',
    variants: ['hamburger', 'bottom_nav', 'floating_cta', 'sticky_header'],
    weights: [0.25, 0.25, 0.25, 0.25],
    description: 'Test mobile navigation patterns',
    targetMetric: 'mobile_conversion',
    minimumSampleSize: 150,
    enabled: true
  }
};

// User Identifier Management
const getUserIdentifier = (): string => {
  if (typeof window === 'undefined') return 'server_fallback';
  
  // Try to get existing user ID from auth
  const authUserId = analytics.getCurrentUserId();
  if (authUserId) return authUserId;
  
  // Fall back to session ID
  const sessionId = analytics.getSessionId();
  
  // Store in localStorage for consistency
  const storedId = localStorage.getItem('ab_test_user_id');
  if (storedId) return storedId;
  
  // Generate new identifier
  const newId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ab_test_user_id', newId);
  
  return newId;
};

// Hash Function for Consistent Variant Assignment
const hashUserToVariant = (userId: string, testName: string): number => {
  const combined = `${userId}_${testName}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
};

// Get A/B Test Variant
export const getABTestVariant = (testName: string): string => {
  const testConfig = landingPageTests[testName];
  
  if (!testConfig || !testConfig.enabled) {
    return testConfig?.variants[0] || 'default';
  }
  
  const userId = getUserIdentifier();
  const hash = hashUserToVariant(userId, testName);
  
  // Use weights if provided, otherwise equal distribution
  const weights = testConfig.weights || testConfig.variants.map(() => 1 / testConfig.variants.length);
  
  // Convert weights to cumulative distribution
  const cumulativeWeights = weights.reduce((acc, weight, index) => {
    acc[index] = (acc[index - 1] || 0) + weight;
    return acc;
  }, [] as number[]);
  
  // Normalize hash to [0, 1] range
  const normalizedHash = (hash % 10000) / 10000;
  
  // Find variant based on cumulative weights
  const variantIndex = cumulativeWeights.findIndex(weight => normalizedHash <= weight);
  const selectedVariant = testConfig.variants[variantIndex] || testConfig.variants[0];
  
  // Track assignment
  trackABTestAssignment(testName, selectedVariant, userId);
  
  return selectedVariant;
};

// Track A/B Test Assignment
const trackABTestAssignment = (testName: string, variant: string, userId: string): void => {
  const assignment: ABTestResult = {
    variant,
    testName,
    userIdentifier: userId,
    timestamp: new Date(),
    metadata: {
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      referrer: typeof window !== 'undefined' ? document.referrer : 'unknown',
      sessionId: analytics.getSessionId()
    }
  };
  
  // Track in analytics
  analytics.trackEvent('ab_test_assignment', {
    test_name: testName,
    variant: variant,
    user_id: userId
  });
  
  // Store assignment locally
  if (typeof window !== 'undefined') {
    const assignments = getStoredAssignments();
    assignments[testName] = assignment;
    localStorage.setItem('ab_test_assignments', JSON.stringify(assignments));
  }
};

// Get Stored Assignments
const getStoredAssignments = (): Record<string, ABTestResult> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem('ab_test_assignments');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Track A/B Test Conversion
export const trackABTestConversion = (testName: string, conversionType: string, value: number = 1): void => {
  const assignments = getStoredAssignments();
  const assignment = assignments[testName];
  
  if (!assignment) {
    console.warn(`No A/B test assignment found for test: ${testName}`);
    return;
  }
  
  analytics.trackEvent('ab_test_conversion', {
    test_name: testName,
    variant: assignment.variant,
    conversion_type: conversionType,
    conversion_value: value,
    user_id: assignment.userIdentifier
  });
};

// A/B Test Hook for React Components
export const useABTest = (testName: string) => {
  const variant = getABTestVariant(testName);
  const testConfig = landingPageTests[testName];
  
  const trackConversion = (conversionType: string, value: number = 1) => {
    trackABTestConversion(testName, conversionType, value);
  };
  
  const trackInteraction = (interactionType: string, metadata: Record<string, any> = {}) => {
    analytics.trackEvent('ab_test_interaction', {
      test_name: testName,
      variant,
      interaction_type: interactionType,
      ...metadata
    });
  };
  
  return {
    variant,
    testConfig,
    trackConversion,
    trackInteraction,
    isEnabled: testConfig?.enabled || false
  };
};

// Value Proposition Variants
export const valuePropositionVariants = {
  community_focused: {
    headline: 'Unisciti alla Community Italiana dell\'Innovazione',
    subtitle: 'Connettiti con migliaia di persone che trasformano problemi quotidiani in soluzioni digitali condivise',
    emphasis: 'community',
    cta: 'Entra nella Community'
  },
  innovation_focused: {
    headline: 'Rivoluziona il Modo di Creare Tecnologia',
    subtitle: 'Scopri come l\'intelligenza artificiale e la collaborazione democratica stanno cambiando il futuro',
    emphasis: 'innovation',
    cta: 'Inizia l\'Innovazione'
  },
  problem_solving_focused: {
    headline: 'Trasforma i Tuoi Problemi in Soluzioni Reali',
    subtitle: 'Proponi sfide quotidiane e ottieni app personalizzate create dalla community italiana',
    emphasis: 'problem_solving',
    cta: 'Risolvi Problemi'
  },
  democratic_focused: {
    headline: 'Democratizza l\'Accesso alla Tecnologia',
    subtitle: 'Partecipa al primo esperimento di sviluppo software basato sul voto democratico',
    emphasis: 'democratic',
    cta: 'Vota per il Cambiamento'
  }
};

// CTA Variants
export const ctaVariants = {
  'Inizia Subito': {
    text: 'Inizia Subito',
    style: 'primary',
    urgency: 'high',
    tone: 'action'
  },
  'Unisciti alla Community': {
    text: 'Unisciti alla Community',
    style: 'community',
    urgency: 'medium',
    tone: 'social'
  },
  'Prova Ora': {
    text: 'Prova Ora',
    style: 'trial',
    urgency: 'high',
    tone: 'experimental'
  },
  'Registrati Gratis': {
    text: 'Registrati Gratis',
    style: 'free',
    urgency: 'medium',
    tone: 'value'
  }
};

// Statistical Significance Calculator
export const calculateStatisticalSignificance = (
  controlConversions: number,
  controlImpressions: number,
  testConversions: number,
  testImpressions: number
): { pValue: number; isSignificant: boolean; confidence: number } => {
  const controlRate = controlConversions / controlImpressions;
  const testRate = testConversions / testImpressions;
  
  const pooledRate = (controlConversions + testConversions) / (controlImpressions + testImpressions);
  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlImpressions + 1 / testImpressions)
  );
  
  const zScore = (testRate - controlRate) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  return {
    pValue,
    isSignificant: pValue < 0.05,
    confidence: (1 - pValue) * 100
  };
};

// Normal CDF approximation
const normalCDF = (x: number): number => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

// Error function approximation
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};

// Get Test Results Summary
export const getTestResultsSummary = (testName: string): ABTestStats[] => {
  // This would typically fetch from an analytics backend
  // For now, return mock data structure
  const testConfig = landingPageTests[testName];
  if (!testConfig) return [];
  
  return testConfig.variants.map(variant => ({
    variant,
    impressions: 0,
    conversions: 0,
    conversionRate: 0,
    confidence: 0,
    isStatisticallySignificant: false
  }));
};

// Initialize A/B Testing
export const initializeABTesting = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clean up old assignments (older than 30 days)
  const assignments = getStoredAssignments();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  Object.keys(assignments).forEach(testName => {
    const assignment = assignments[testName];
    if (new Date(assignment.timestamp) < thirtyDaysAgo) {
      delete assignments[testName];
    }
  });
  
  localStorage.setItem('ab_test_assignments', JSON.stringify(assignments));
  
  // Track initialization
  analytics.trackEvent('ab_testing_initialized', {
    active_tests: Object.keys(landingPageTests).filter(key => landingPageTests[key].enabled),
    user_id: getUserIdentifier()
  });
};

// Export main functions
export const abTesting = {
  getVariant: getABTestVariant,
  trackConversion: trackABTestConversion,
  useABTest,
  initialize: initializeABTesting,
  getTestResults: getTestResultsSummary,
  calculateSignificance: calculateStatisticalSignificance,
  valuePropositionVariants,
  ctaVariants
};

export default abTesting;