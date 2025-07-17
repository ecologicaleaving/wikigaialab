import { test, expect } from '@playwright/test';

// Comprehensive E2E tests for landing page conversion funnel
// Tests the complete user journey from landing to first meaningful action

test.describe('Landing Page Conversion Funnel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should complete full conversion funnel from landing to authentication', async ({ page }) => {
    // Step 1: Landing page loads successfully
    await expect(page.locator('h1')).toContainText('WikiGaiaLab');
    
    // Step 2: Hero section is visible and interactive
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();
    
    // Step 3: Community stats are displayed
    await expect(page.locator('[data-testid="community-stats"]')).toBeVisible();
    
    // Step 4: Primary CTA is visible and clickable
    const primaryCTA = page.locator('[data-testid="hero-cta"]');
    await expect(primaryCTA).toBeVisible();
    await expect(primaryCTA).toBeEnabled();
    
    // Step 5: Click primary CTA
    await primaryCTA.click();
    
    // Step 6: Should navigate to authentication (or show auth modal)
    await expect(page).toHaveURL(/auth|login/);
    
    // Step 7: Google login button should be present
    await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
  });

  test('should track user engagement through sections', async ({ page }) => {
    // Scroll through different sections and verify they become visible
    
    // Hero section
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // Scroll to interactive demo
    await page.locator('[data-testid="interactive-demo"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="interactive-demo"]')).toBeVisible();
    
    // Scroll to onboarding flow
    await page.locator('[data-testid="onboarding-flow"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="onboarding-flow"]')).toBeVisible();
    
    // Scroll to social proof
    await page.locator('[data-testid="social-proof"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="social-proof"]')).toBeVisible();
    
    // Scroll to FAQ
    await page.locator('[data-testid="faq-section"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="faq-section"]')).toBeVisible();
  });

  test('should complete interactive demo flow', async ({ page }) => {
    // Navigate to demo section
    await page.locator('[data-testid="interactive-demo"]').scrollIntoViewIfNeeded();
    
    // Start demo
    const startButton = page.locator('[data-testid="start-demo"]');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // Verify demo started
    await expect(page.locator('[data-testid="demo-active"]')).toBeVisible();
    
    // Select a problem
    const problemCard = page.locator('[data-testid="demo-problem"]').first();
    await problemCard.click();
    
    // Vote on problem
    const voteButton = page.locator('[data-testid="demo-vote"]');
    await expect(voteButton).toBeEnabled();
    await voteButton.click();
    
    // Verify success message
    await expect(page.locator('[data-testid="demo-success"]')).toBeVisible();
    
    // CTA should be available
    await expect(page.locator('[data-testid="demo-cta"]')).toBeVisible();
  });

  test('should interact with social proof elements', async ({ page }) => {
    // Navigate to social proof section
    await page.locator('[data-testid="social-proof"]').scrollIntoViewIfNeeded();
    
    // Testimonial carousel navigation
    const nextButton = page.locator('[data-testid="testimonial-next"]');
    const prevButton = page.locator('[data-testid="testimonial-prev"]');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500); // Wait for animation
    }
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verify testimonials are visible
    await expect(page.locator('[data-testid="testimonial-card"]')).toBeVisible();
    
    // Check trust indicators
    await expect(page.locator('[data-testid="trust-indicators"]')).toBeVisible();
  });

  test('should complete onboarding flow', async ({ page }) => {
    // Navigate to onboarding section
    await page.locator('[data-testid="onboarding-flow"]').scrollIntoViewIfNeeded();
    
    // Select interests
    const interestCards = page.locator('[data-testid="interest-card"]');
    const count = await interestCards.count();
    
    if (count > 0) {
      // Select first 2 interests
      await interestCards.nth(0).click();
      await interestCards.nth(1).click();
    }
    
    // Complete onboarding steps
    const stepButtons = page.locator('[data-testid="onboarding-step-button"]');
    const stepCount = await stepButtons.count();
    
    for (let i = 0; i < stepCount; i++) {
      const button = stepButtons.nth(i);
      if (await button.isVisible() && await button.isEnabled()) {
        await button.click();
        await page.waitForTimeout(300); // Wait for step transition
      }
    }
    
    // Verify progress completion
    await expect(page.locator('[data-testid="onboarding-progress"]')).toContainText('100%');
  });

  test('should search and filter FAQ effectively', async ({ page }) => {
    // Navigate to FAQ section
    await page.locator('[data-testid="faq-section"]').scrollIntoViewIfNeeded();
    
    // Search functionality
    const searchInput = page.locator('[data-testid="faq-search"]');
    await searchInput.fill('gratuito');
    
    // Verify search results
    await expect(page.locator('[data-testid="faq-item"]')).toHaveCount(1);
    
    // Clear search
    await searchInput.clear();
    
    // Filter by category
    const categoryFilter = page.locator('[data-testid="faq-category-costi"]');
    await categoryFilter.click();
    
    // Verify filtered results
    await expect(page.locator('[data-testid="faq-item"]')).toHaveCountGreaterThan(0);
    
    // Open FAQ item
    const faqItem = page.locator('[data-testid="faq-item"]').first();
    await faqItem.click();
    
    // Verify FAQ content is visible
    await expect(page.locator('[data-testid="faq-answer"]')).toBeVisible();
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // Check mobile-specific elements
    const mobileCTA = page.locator('[data-testid="mobile-cta"]');
    if (await mobileCTA.isVisible()) {
      await expect(mobileCTA).toBeEnabled();
    }
    
    // Verify touch-friendly elements
    const touchTargets = page.locator('[data-testid="touch-target"]');
    const count = await touchTargets.count();
    
    for (let i = 0; i < count; i++) {
      const target = touchTargets.nth(i);
      const box = await target.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should track analytics events', async ({ page }) => {
    // Mock analytics tracking
    await page.addInitScript(() => {
      window.analyticsEvents = [];
      window.gtag = (...args) => {
        window.analyticsEvents.push(args);
      };
    });
    
    // Trigger various analytics events
    await page.locator('[data-testid="hero-cta"]').click();
    
    // Verify analytics events were tracked
    const events = await page.evaluate(() => window.analyticsEvents);
    expect(events.length).toBeGreaterThan(0);
    
    // Verify specific event types
    const eventTypes = events.map(event => event[0]);
    expect(eventTypes).toContain('event');
  });

  test('should handle A/B testing variants', async ({ page }) => {
    // Test different A/B test variants
    const variants = ['community_focused', 'innovation_focused', 'problem_solving_focused'];
    
    for (const variant of variants) {
      // Set A/B test variant
      await page.addInitScript((variant) => {
        localStorage.setItem('ab_test_value_proposition', variant);
      }, variant);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify variant-specific content
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      
      // Each variant should have different content
      const heroContent = await page.locator('[data-testid="hero-section"]').textContent();
      expect(heroContent).toBeTruthy();
    }
  });

  test('should validate performance metrics', async ({ page }) => {
    // Navigate to page and measure performance
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Verify load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          if (lcpEntry) {
            resolve({ lcp: lcpEntry.startTime });
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({ lcp: null }), 5000);
      });
    });
    
    // Verify LCP is under 2.5 seconds
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
  });

  test('should complete full user journey simulation', async ({ page }) => {
    // Simulate complete user journey
    
    // 1. Land on page
    await expect(page.locator('h1')).toContainText('WikiGaiaLab');
    
    // 2. View hero section
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // 3. Scroll to and interact with demo
    await page.locator('[data-testid="interactive-demo"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="start-demo"]').click();
    
    // 4. Select problem and vote
    await page.locator('[data-testid="demo-problem"]').first().click();
    await page.locator('[data-testid="demo-vote"]').click();
    
    // 5. View social proof
    await page.locator('[data-testid="social-proof"]').scrollIntoViewIfNeeded();
    
    // 6. Check FAQ
    await page.locator('[data-testid="faq-section"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="faq-item"]').first().click();
    
    // 7. Final CTA interaction
    await page.locator('[data-testid="final-cta"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="final-cta"]').click();
    
    // 8. Should reach authentication
    await expect(page).toHaveURL(/auth|login/);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test network failure scenarios
    await page.route('**/api/analytics/**', route => route.abort());
    
    // Page should still load and function
    await expect(page.locator('h1')).toContainText('WikiGaiaLab');
    
    // CTAs should still work
    await expect(page.locator('[data-testid="hero-cta"]')).toBeEnabled();
    
    // Demo should still function
    await page.locator('[data-testid="interactive-demo"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="start-demo"]').click();
    await expect(page.locator('[data-testid="demo-active"]')).toBeVisible();
  });

  test('should validate accessibility standards', async ({ page }) => {
    // Check for accessibility issues
    
    // Verify headings hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Verify form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const label = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      expect(label || placeholder).toBeTruthy();
    }
    
    // Check color contrast (basic test)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const styles = await button.evaluate(el => getComputedStyle(el));
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });
});