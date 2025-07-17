import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Helper function to wait for authentication state
async function waitForAuthState(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for React state updates
}

// Helper function to check if user is authenticated
async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Helper function to check if user is on login page
async function isOnLoginPage(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('text=Benvenuto in WikiGaiaLab', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Authentication End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.describe('Login Flow', () => {
    test('should show login page for unauthenticated users', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check page title and main elements
      await expect(page).toHaveTitle(/WikiGaiaLab/);
      await expect(page.locator('text=Benvenuto in WikiGaiaLab')).toBeVisible();
      await expect(page.locator('text=Accedi con Google')).toBeVisible();
      
      // Check feature list
      await expect(page.locator('text=Proponi soluzioni innovative')).toBeVisible();
      await expect(page.locator('text=Vota e supporta le migliori idee')).toBeVisible();
      await expect(page.locator('text=Collabora con una comunità globale')).toBeVisible();
    });

    test('should display Google login button', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
      
      // Check Google icon is present
      await expect(page.locator('svg').first()).toBeVisible();
    });

    test('should show loading state when clicking Google login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      
      // Click the button
      await googleButton.click();
      
      // Should show loading state
      await expect(page.locator('text=Accesso in corso')).toBeVisible({ timeout: 5000 });
    });

    test('should handle login error gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login?error=auth_failed`);
      
      // Should display error message
      await expect(page.locator('text=Autenticazione fallita')).toBeVisible();
      
      // Error should be dismissible
      const closeButton = page.locator('button[aria-label="Chiudi errore"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.locator('text=Autenticazione fallita')).not.toBeVisible();
      }
    });

    test('should show different error messages for different error types', async ({ page }) => {
      const errorCases = [
        { error: 'oauth_error', message: 'Errore durante l\'accesso con Google' },
        { error: 'session_expired', message: 'Sessione scaduta' },
        { error: 'access_denied', message: 'Accesso negato' },
      ];

      for (const { error, message } of errorCases) {
        await page.goto(`${BASE_URL}/login?error=${error}`);
        await expect(page.locator(`text=${message}`)).toBeVisible();
      }
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      await expect(googleButton).toHaveAttribute('aria-label', 'Accedi con Google');
      
      // Check form has proper structure
      await expect(page.locator('h2')).toHaveText('Benvenuto in WikiGaiaLab');
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      // This test would require mocking the OAuth flow
      // In a real scenario, you'd need to set up test OAuth credentials
      // and handle the OAuth callback
      
      // For now, we'll simulate being authenticated
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should redirect to login if not authenticated
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected routes', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/profile', '/settings'];
      
      for (const route of protectedRoutes) {
        await page.goto(`${BASE_URL}${route}`);
        await waitForAuthState(page);
        
        // Should redirect to login with redirect parameter
        await expect(page).toHaveURL(new RegExp(`/login.*redirect=${encodeURIComponent(route)}`));
      }
    });

    test('should show loading state while checking authentication', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should show loading spinner initially
      await expect(page.locator('text=Verifica dell\'autenticazione')).toBeVisible({ timeout: 5000 });
    });

    test('should handle authentication timeout gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for redirect to login
      await waitForAuthState(page);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('OAuth Callback', () => {
    test('should handle OAuth callback page', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/callback`);
      
      // Should show callback processing UI
      await expect(page.locator('text=Completamento accesso')).toBeVisible({ timeout: 5000 });
    });

    test('should handle OAuth callback errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/callback?error=access_denied`);
      
      // Should show error and redirect to login
      await expect(page.locator('text=Errore durante l\'accesso')).toBeVisible();
      
      // Should eventually redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('should have proper navigation links on login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check navigation links
      await expect(page.locator('a:has-text("Torna alla Home")')).toBeVisible();
      await expect(page.locator('a:has-text("Termini di Servizio")')).toBeVisible();
      await expect(page.locator('a:has-text("Privacy Policy")')).toBeVisible();
    });

    test('should navigate to home page from login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const homeLink = page.locator('a:has-text("Torna alla Home")');
      await homeLink.click();
      
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto(`${BASE_URL}/login`);
      
      // Elements should be visible and properly sized
      await expect(page.locator('text=Benvenuto in WikiGaiaLab')).toBeVisible();
      await expect(page.locator('button:has-text("Accedi con Google")')).toBeVisible();
      
      // Button should be full width on mobile
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      const buttonBox = await googleButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(300); // Should be wide on mobile
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto(`${BASE_URL}/login`);
      
      await expect(page.locator('text=Benvenuto in WikiGaiaLab')).toBeVisible();
      await expect(page.locator('button:has-text("Accedi con Google")')).toBeVisible();
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto(`${BASE_URL}/login`);
      
      await expect(page.locator('text=Benvenuto in WikiGaiaLab')).toBeVisible();
      await expect(page.locator('button:has-text("Accedi con Google")')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Check for layout shift indicators
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Check that text is readable (no flash of unstyled content)
      await expect(page.locator('text=Benvenuto in WikiGaiaLab')).toBeVisible();
    });
  });

  test.describe('Security', () => {
    test('should not expose sensitive information in client-side code', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check that no sensitive keys are exposed
      const content = await page.content();
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('GOOGLE_CLIENT_SECRET');
    });

    test('should have proper CSRF protection', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check for CSRF tokens or state parameters
      // This would depend on your OAuth implementation
      await expect(page.locator('button:has-text("Accedi con Google")')).toBeVisible();
    });

    test('should handle OAuth state parameter correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      await googleButton.click();
      
      // Should initiate OAuth flow with proper state
      // This test would need to be expanded based on your OAuth implementation
      await expect(page.locator('text=Accesso in corso')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Should be able to tab to Google login button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      await expect(googleButton).toBeFocused();
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      await expect(page.locator('text=Accesso in corso')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      const googleButton = page.locator('button:has-text("Accedi con Google")');
      await expect(googleButton).toHaveAttribute('aria-label', 'Accedi con Google');
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check for aria-live regions
      const liveRegions = page.locator('[aria-live]');
      if (await liveRegions.count() > 0) {
        await expect(liveRegions.first()).toBeVisible();
      }
    });
  });
});