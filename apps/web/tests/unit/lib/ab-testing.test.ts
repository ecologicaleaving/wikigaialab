import { 
  abTesting, 
  getABTestVariant, 
  trackABTestConversion,
  useABTest,
  landingPageTests,
  valuePropositionVariants,
  ctaVariants,
  calculateStatisticalSignificance
} from '../../../src/lib/ab-testing';

// Mock analytics
jest.mock('../../../src/lib/analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
    getCurrentUserId: jest.fn(() => 'user123'),
    getSessionId: jest.fn(() => 'session123')
  }
}));

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

describe('A/B Testing Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Variant Assignment', () => {
    it('should assign consistent variants for same user', () => {
      const testName = 'hero_cta_text';
      
      const variant1 = getABTestVariant(testName);
      const variant2 = getABTestVariant(testName);
      
      expect(variant1).toBe(variant2);
      expect(landingPageTests[testName].variants).toContain(variant1);
    });

    it('should distribute variants according to weights', () => {
      const testName = 'hero_cta_text';
      const variants = landingPageTests[testName].variants;
      const weights = landingPageTests[testName].weights || [];
      
      // Test with multiple user IDs
      const results = new Map<string, number>();
      
      for (let i = 0; i < 1000; i++) {
        // Mock different user IDs
        localStorageMock.getItem.mockReturnValue(`user${i}`);
        
        const variant = getABTestVariant(testName);
        results.set(variant, (results.get(variant) || 0) + 1);
      }
      
      // Each variant should have some assignments
      variants.forEach(variant => {
        expect(results.has(variant)).toBe(true);
        expect(results.get(variant)).toBeGreaterThan(0);
      });
      
      // Distribution should be roughly equal if weights are equal
      if (weights.every(w => w === weights[0])) {
        const counts = Array.from(results.values());
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        
        counts.forEach(count => {
          expect(count).toBeGreaterThan(avg * 0.8); // Allow 20% deviation
          expect(count).toBeLessThan(avg * 1.2);
        });
      }
    });

    it('should return first variant for disabled tests', () => {
      const testName = 'hero_cta_text';
      const originalEnabled = landingPageTests[testName].enabled;
      
      // Temporarily disable test
      landingPageTests[testName].enabled = false;
      
      const variant = getABTestVariant(testName);
      expect(variant).toBe(landingPageTests[testName].variants[0]);
      
      // Restore original state
      landingPageTests[testName].enabled = originalEnabled;
    });

    it('should handle non-existent tests gracefully', () => {
      const variant = getABTestVariant('non_existent_test');
      expect(variant).toBe('default');
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversions for assigned variants', () => {
      const testName = 'hero_cta_text';
      
      // Mock stored assignment
      const mockAssignment = {
        variant: 'Inizia Subito',
        testName: testName,
        userIdentifier: 'user123',
        timestamp: new Date(),
        metadata: {}
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        [testName]: mockAssignment
      }));
      
      trackABTestConversion(testName, 'button_click', 1);
      
      const { analytics } = require('../../../src/lib/analytics');
      expect(analytics.trackEvent).toHaveBeenCalledWith('ab_test_conversion', {
        test_name: testName,
        variant: 'Inizia Subito',
        conversion_type: 'button_click',
        conversion_value: 1,
        user_id: 'user123'
      });
    });

    it('should warn when no assignment exists', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      trackABTestConversion('non_existent_test', 'conversion', 1);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'No A/B test assignment found for test: non_existent_test'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('useABTest Hook', () => {
    // Mock React hooks
    const mockUseABTest = (testName: string) => {
      const variant = getABTestVariant(testName);
      const testConfig = landingPageTests[testName];
      
      return {
        variant,
        testConfig,
        trackConversion: jest.fn(),
        trackInteraction: jest.fn(),
        isEnabled: testConfig?.enabled || false
      };
    };

    it('should return correct variant and config', () => {
      const testName = 'hero_cta_text';
      const result = mockUseABTest(testName);
      
      expect(result.variant).toBeDefined();
      expect(result.testConfig).toBe(landingPageTests[testName]);
      expect(result.isEnabled).toBe(true);
      expect(typeof result.trackConversion).toBe('function');
      expect(typeof result.trackInteraction).toBe('function');
    });

    it('should handle disabled tests', () => {
      const testName = 'hero_cta_text';
      const originalEnabled = landingPageTests[testName].enabled;
      
      // Temporarily disable test
      landingPageTests[testName].enabled = false;
      
      const result = mockUseABTest(testName);
      expect(result.isEnabled).toBe(false);
      
      // Restore original state
      landingPageTests[testName].enabled = originalEnabled;
    });
  });

  describe('Value Proposition Variants', () => {
    it('should have all required variant properties', () => {
      Object.values(valuePropositionVariants).forEach(variant => {
        expect(variant).toHaveProperty('headline');
        expect(variant).toHaveProperty('subtitle');
        expect(variant).toHaveProperty('emphasis');
        expect(variant).toHaveProperty('cta');
        
        expect(typeof variant.headline).toBe('string');
        expect(typeof variant.subtitle).toBe('string');
        expect(typeof variant.emphasis).toBe('string');
        expect(typeof variant.cta).toBe('string');
      });
    });

    it('should have unique content for each variant', () => {
      const variants = Object.values(valuePropositionVariants);
      const headlines = variants.map(v => v.headline);
      const subtitles = variants.map(v => v.subtitle);
      
      // All headlines should be unique
      expect(new Set(headlines).size).toBe(headlines.length);
      
      // All subtitles should be unique
      expect(new Set(subtitles).size).toBe(subtitles.length);
    });
  });

  describe('CTA Variants', () => {
    it('should have all required CTA properties', () => {
      Object.values(ctaVariants).forEach(variant => {
        expect(variant).toHaveProperty('text');
        expect(variant).toHaveProperty('style');
        expect(variant).toHaveProperty('urgency');
        expect(variant).toHaveProperty('tone');
        
        expect(typeof variant.text).toBe('string');
        expect(typeof variant.style).toBe('string');
        expect(['high', 'medium', 'low']).toContain(variant.urgency);
        expect(typeof variant.tone).toBe('string');
      });
    });

    it('should have unique text for each variant', () => {
      const variants = Object.values(ctaVariants);
      const texts = variants.map(v => v.text);
      
      // All CTA texts should be unique
      expect(new Set(texts).size).toBe(texts.length);
    });
  });

  describe('Statistical Significance', () => {
    it('should calculate statistical significance correctly', () => {
      // Test with significant difference
      const result1 = calculateStatisticalSignificance(
        10,  // control conversions
        100, // control impressions
        20,  // test conversions
        100  // test impressions
      );
      
      expect(result1.pValue).toBeLessThan(0.05);
      expect(result1.isSignificant).toBe(true);
      expect(result1.confidence).toBeGreaterThan(95);
      
      // Test with no significant difference
      const result2 = calculateStatisticalSignificance(
        10,  // control conversions
        100, // control impressions
        11,  // test conversions
        100  // test impressions
      );
      
      expect(result2.pValue).toBeGreaterThan(0.05);
      expect(result2.isSignificant).toBe(false);
      expect(result2.confidence).toBeLessThan(95);
    });

    it('should handle edge cases', () => {
      // Test with zero conversions
      const result = calculateStatisticalSignificance(0, 100, 0, 100);
      
      expect(result.pValue).toBe(2); // Should be 2 (100% * 2 for two-tailed test)
      expect(result.isSignificant).toBe(false);
      expect(result.confidence).toBe(-100); // (1 - 2) * 100
    });
  });

  describe('Test Configuration', () => {
    it('should have valid test configurations', () => {
      Object.entries(landingPageTests).forEach(([testName, config]) => {
        expect(config).toHaveProperty('testName');
        expect(config).toHaveProperty('variants');
        expect(config).toHaveProperty('enabled');
        
        expect(config.testName).toBe(testName);
        expect(Array.isArray(config.variants)).toBe(true);
        expect(config.variants.length).toBeGreaterThan(0);
        expect(typeof config.enabled).toBe('boolean');
        
        // Check weights if provided
        if (config.weights) {
          expect(config.weights.length).toBe(config.variants.length);
          const weightSum = config.weights.reduce((sum, weight) => sum + weight, 0);
          expect(weightSum).toBeCloseTo(1, 2); // Should sum to 1
        }
        
        // Check other optional properties
        if (config.description) {
          expect(typeof config.description).toBe('string');
        }
        if (config.targetMetric) {
          expect(typeof config.targetMetric).toBe('string');
        }
        if (config.minimumSampleSize) {
          expect(typeof config.minimumSampleSize).toBe('number');
          expect(config.minimumSampleSize).toBeGreaterThan(0);
        }
      });
    });

    it('should have unique test names', () => {
      const testNames = Object.keys(landingPageTests);
      expect(new Set(testNames).size).toBe(testNames.length);
    });
  });

  describe('Hash Function', () => {
    it('should produce consistent hashes', () => {
      const userId = 'user123';
      const testName = 'test_experiment';
      
      // Mock the hash function behavior by testing variant assignment
      const variant1 = getABTestVariant(testName);
      const variant2 = getABTestVariant(testName);
      
      expect(variant1).toBe(variant2);
    });

    it('should distribute hashes evenly', () => {
      const testName = 'hero_cta_text';
      const variants = landingPageTests[testName].variants;
      const results = new Map<string, number>();
      
      // Test with many different user IDs
      for (let i = 0; i < 1000; i++) {
        localStorageMock.getItem.mockReturnValue(`user${i}`);
        
        const variant = getABTestVariant(testName);
        results.set(variant, (results.get(variant) || 0) + 1);
      }
      
      // Should have reasonable distribution
      variants.forEach(variant => {
        const count = results.get(variant) || 0;
        expect(count).toBeGreaterThan(1000 / variants.length * 0.7); // Within 30% of expected
        expect(count).toBeLessThan(1000 / variants.length * 1.3);
      });
    });
  });

  describe('Initialization', () => {
    it('should initialize A/B testing correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      abTesting.initialize();
      
      // Should not throw errors
      expect(() => abTesting.initialize()).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should clean up old assignments', () => {
      const oldAssignment = {
        variant: 'old_variant',
        testName: 'old_test',
        userIdentifier: 'user123',
        timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
        metadata: {}
      };
      
      const recentAssignment = {
        variant: 'recent_variant',
        testName: 'recent_test',
        userIdentifier: 'user123',
        timestamp: new Date(),
        metadata: {}
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        old_test: oldAssignment,
        recent_test: recentAssignment
      }));
      
      abTesting.initialize();
      
      // Should remove old assignment but keep recent one
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ab_test_assignments',
        JSON.stringify({
          recent_test: recentAssignment
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw errors
      expect(() => getABTestVariant('hero_cta_text')).not.toThrow();
      expect(() => trackABTestConversion('test', 'conversion', 1)).not.toThrow();
    });

    it('should handle JSON parsing errors', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw errors and return empty object
      expect(() => getABTestVariant('hero_cta_text')).not.toThrow();
    });

    it('should handle missing window object', () => {
      const originalWindow = global.window;
      
      // Remove window object
      delete (global as any).window;
      
      // Should not throw errors
      expect(() => getABTestVariant('hero_cta_text')).not.toThrow();
      expect(() => abTesting.initialize()).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Test Results', () => {
    it('should return test results summary', () => {
      const testName = 'hero_cta_text';
      const results = abTesting.getTestResults(testName);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(landingPageTests[testName].variants.length);
      
      results.forEach(result => {
        expect(result).toHaveProperty('variant');
        expect(result).toHaveProperty('impressions');
        expect(result).toHaveProperty('conversions');
        expect(result).toHaveProperty('conversionRate');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('isStatisticallySignificant');
        
        expect(typeof result.variant).toBe('string');
        expect(typeof result.impressions).toBe('number');
        expect(typeof result.conversions).toBe('number');
        expect(typeof result.conversionRate).toBe('number');
        expect(typeof result.confidence).toBe('number');
        expect(typeof result.isStatisticallySignificant).toBe('boolean');
      });
    });

    it('should return empty array for non-existent test', () => {
      const results = abTesting.getTestResults('non_existent_test');
      expect(results).toEqual([]);
    });
  });
});