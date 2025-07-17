import { test, expect } from '@playwright/test';

test.describe('WikiGaiaLab Setup', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads without critical errors
    await expect(page).toHaveTitle(/WikiGaiaLab/);
    
    // Check if the page doesn't have any console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Allow for some expected development warnings but not critical errors
    const criticalErrors = errors.filter((error: string) => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('sourcemap')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional on mobile
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    await expect(body).toBeVisible();
  });
});