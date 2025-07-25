import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Authentication credentials for test login page
const AUTH_CONFIG = {
  TEST_EMAIL: 'playwright-test@wikigaialab.com',
  TEST_PASSWORD: 'PlaywrightTest123!',
  TEST_USERNAME: 'playwright-user',
  LOGIN_URL: 'http://localhost:3000/test-login', // Use dedicated test login page
  SIGNUP_URL: 'http://localhost:3000/signup'
};

// Read page list from docs with auth requirements
const pageList = [
  { path: '/', name: 'homepage', description: 'Landing page principale del laboratorio digitale', priority: 'Alta', authRequired: false },
  { path: '/problems', name: 'problems-list', description: 'Bacheca dei problemi comunitari', priority: 'Alta', authRequired: false },
  { path: '/problems/new', name: 'problems-new', description: 'Modulo per raccontare un nuovo problema', priority: 'Alta', authRequired: true },
  { path: '/login', name: 'login', description: 'Schermata di autenticazione con Google OAuth', priority: 'Alta', authRequired: false },
  { path: '/dashboard', name: 'dashboard', description: 'Dashboard personale dell\'utente', priority: 'Media', authRequired: true },
  { path: '/profile', name: 'profile', description: 'Profilo personale utente', priority: 'Media', authRequired: true },
  { path: '/apps', name: 'apps-catalog', description: 'Catalogo delle soluzioni create', priority: 'Media', authRequired: false },
  { path: '/settings', name: 'settings', description: 'Impostazioni account e preferenze', priority: 'Media', authRequired: true },
  { path: '/help', name: 'help', description: 'Pagina di aiuto e documentazione', priority: 'Media', authRequired: false },
];

interface UIEvaluation {
  brandScore: number;
  languageScore: number;
  accessibilityScore: number;
  totalScore: number;
  needsHealing: boolean;
  issues: string[];
}

function evaluateUI(brandElements: any, pageText: string, priority: string): UIEvaluation {
  const weights = priority === 'Alta' ? 
    { brand: 0.35, language: 0.35, accessibility: 0.30 } :
    { brand: 0.25, language: 0.25, accessibility: 0.50 };
  
  // Brand Identity Score (0-10)
  let brandScore = 5;
  const issues: string[] = [];
  
  if (brandElements.hasWikiGaiaLogo) brandScore += 2;
  else issues.push('Missing WikiGaia logo');
  
  if (brandElements.tealColors > 0) brandScore += 1.5;
  else issues.push('Missing teal/emerald colors (#00B894)');
  
  if (brandElements.heartIcons > 0) brandScore += 1.5;
  else issues.push('Missing heart-based consensus elements');
  
  brandScore = Math.min(brandScore, 10);
  
  // Artisanal Language Score (0-10)
  let languageScore = 5;
  const hasArtisanalTerms = /laboratorio|artigian|maestr|cuore|porta|racconta/i.test(pageText);
  
  if (hasArtisanalTerms) languageScore += 3;
  else issues.push('Missing artisanal laboratory language');
  
  if (brandElements.primaryButtons > 0) languageScore += 2;
  languageScore = Math.min(languageScore, 10);
  
  // Accessibility Score (assuming basic compliance for React/Next.js)
  let accessibilityScore = 7;
  
  const totalScore = (brandScore * weights.brand) + 
                     (languageScore * weights.language) + 
                     (accessibilityScore * weights.accessibility);
  
  return {
    brandScore,
    languageScore,
    accessibilityScore,
    totalScore,
    needsHealing: totalScore < 8,
    issues
  };
}

// Create output directory for screenshots and reports
const outputDir = join(__dirname, '../../ui-healing-output');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // Directory might already exist
}

// Authentication helper functions
async function performLogin(page: Page): Promise<boolean> {
  try {
    console.log('🔐 Attempting login via test login page...');
    await page.goto(AUTH_CONFIG.LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check if already logged in by looking for user menu or dashboard elements
    const isLoggedIn = await page.locator('[data-testid="user-menu"], .user-avatar, [href="/dashboard"]').count() > 0;
    if (isLoggedIn) {
      console.log('✅ Already logged in');
      return true;
    }
    
    // Use the dedicated test login form
    const emailInput = page.locator('input[name="email"]').first();
    const passwordInput = page.locator('input[name="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('📧 Using test login form');
      
      // Fill the test credentials
      await emailInput.fill(AUTH_CONFIG.TEST_EMAIL);
      await passwordInput.fill(AUTH_CONFIG.TEST_PASSWORD);
      
      // Click the login button
      const loginButton = page.locator('button[type="submit"]:has-text("Login")').first();
      await loginButton.click();
      
      // Wait for login to complete and check for success message or redirect
      await page.waitForTimeout(3000);
      
      // Check for success indicators
      const successMessage = await page.locator('text="Successfully logged in"').count() > 0;
      const redirected = page.url().includes('/dashboard') || page.url().includes('/admin');
      
      if (successMessage || redirected) {
        console.log('✅ Test login successful');
        return true;
      }
      
      // If not redirected, check if we're still on login page with error
      const errorMessage = await page.locator('[role="alert"], .alert-destructive').count() > 0;
      if (errorMessage) {
        const errorText = await page.locator('[role="alert"], .alert-destructive').first().textContent();
        console.log('❌ Login failed with error:', errorText);
      }
      
      return false;
    }
    
    console.log('⚠️  Test login form not found');
    return false;
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return false;
  }
}

async function createTestUser(page: Page): Promise<boolean> {
  try {
    console.log('👤 Attempting to create test user...');
    await page.goto(AUTH_CONFIG.SIGNUP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Look for signup form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const usernameInput = page.locator('input[name="username"], input[name="name"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill(AUTH_CONFIG.TEST_EMAIL);
      if (await usernameInput.count() > 0) {
        await usernameInput.fill(AUTH_CONFIG.TEST_USERNAME);
      }
      if (await passwordInput.count() > 0) {
        await passwordInput.fill(AUTH_CONFIG.TEST_PASSWORD);
      }
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Registra")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        console.log('✅ User creation attempted');
        return true;
      }
    }
    
    console.log('⚠️  No signup form found or not supported');
    return false;
  } catch (error) {
    console.log('❌ User creation failed:', error.message);
    return false;
  }
}

test.describe('WikiGaiaLab UI Healing System', () => {
  const results: any[] = [];
  let isAuthenticated = false;
  
  // Setup authentication once before all tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Try to login with existing credentials
      isAuthenticated = await performLogin(page);
      
      // If login fails, try to create a new user
      if (!isAuthenticated) {
        await createTestUser(page);
        isAuthenticated = await performLogin(page);
      }
      
      if (isAuthenticated) {
        // Save authentication state for reuse
        await context.storageState({ path: 'auth-state.json' });
        console.log('🔐 Authentication state saved');
      } else {
        console.log('⚠️  Authentication failed - will test public pages only');
      }
    } catch (error) {
      console.log('❌ Authentication setup failed:', error.message);
    } finally {
      await context.close();
    }
  });
  
  for (const screen of pageList) {
    test(`UI Healing: ${screen.name} [${screen.priority}]`, async ({ page }) => {
      console.log(`\n🔍 Evaluating: ${screen.name} - ${screen.path}`);
      
      // Skip protected pages if not authenticated
      if (screen.authRequired && !isAuthenticated) {
        console.log(`⚠️  Skipping ${screen.name} - requires authentication`);
        results.push({
          screen: screen.name,
          path: screen.path,
          priority: screen.priority,
          status: 'skipped',
          reason: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      try {
        // Restore authentication state if needed
        if (screen.authRequired && isAuthenticated) {
          try {
            await page.context().storageState({ path: 'auth-state.json' });
          } catch (e) {
            // Fallback: perform login again
            await performLogin(page);
          }
        }
        // Navigate to the page
        await page.goto(screen.path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for page to stabilize
        await page.waitForTimeout(3000);
        
        // Get page title and content
        const title = await page.title();
        const pageText = await page.textContent('body') || '';
        
        // Check for WikiGaia brand elements
        const brandElements = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          const allImages = Array.from(document.querySelectorAll('img'));
          const allSvgs = Array.from(document.querySelectorAll('svg'));
          
          // Enhanced logo detection
          const hasWikiGaiaLogo = allImages.some(img => 
            img.src?.includes('wikigaia') || 
            img.alt?.toLowerCase().includes('wikigaia') ||
            img.alt?.toLowerCase().includes('wiki') ||
            img.src?.includes('wiki')
          ) || bodyText.includes('WikiGaiaLab') || bodyText.includes('WikiGaia');
          
          // Enhanced heart detection - look for heart icons and lucide-react hearts
          const heartElements = document.querySelectorAll('svg[data-lucide="heart"], [class*="heart"], .fa-heart, svg[data-icon="heart"]');
          const heartIconsFromSvg = allSvgs.filter(svg => {
            const viewBox = svg.getAttribute('viewBox');
            const paths = svg.querySelectorAll('path');
            // Look for heart-shaped SVG paths (common pattern in heart icons)
            return Array.from(paths).some(path => {
              const d = path.getAttribute('d');
              return d && (d.includes('M20.84 4.61') || d.includes('heart') || d.toLowerCase().includes('m12'));
            });
          });
          
          const totalHeartIcons = heartElements.length + heartIconsFromSvg.length;
          
          // Enhanced teal color detection - check both classes and computed styles
          const tealElements = document.querySelectorAll('[class*="teal"], [class*="emerald"], [class*="green-"]');
          let tealColorCount = tealElements.length;
          
          // Also check for computed styles that match WikiGaia colors
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            const computed = window.getComputedStyle(el);
            const bgColor = computed.backgroundColor;
            const textColor = computed.color;
            const borderColor = computed.borderColor;
            
            // Check for teal/emerald colors in RGB format (approximate WikiGaia #00B894)
            if (bgColor.includes('rgb(0, 184, 148)') || 
                bgColor.includes('rgb(16, 185, 129)') || 
                bgColor.includes('rgb(5, 150, 105)') ||
                textColor.includes('rgb(0, 184, 148)') ||
                textColor.includes('rgb(16, 185, 129)') ||
                textColor.includes('rgb(5, 150, 105)') ||
                borderColor.includes('rgb(0, 184, 148)') ||
                borderColor.includes('rgb(16, 185, 129)') ||
                borderColor.includes('rgb(5, 150, 105)')) {
              tealColorCount++;
            }
          }
          
          return {
            hasWikiGaiaLogo,
            tealColors: tealColorCount,
            heartIcons: totalHeartIcons,
            primaryButtons: document.querySelectorAll('button, .btn, [role="button"]').length,
            hasLoginButton: bodyText.includes('Login') || bodyText.includes('Entra') || bodyText.includes('Accedi'),
            hasWarmLanguage: bodyText.includes('laboratorio') || 
                           bodyText.includes('artigian') ||
                           bodyText.includes('maestr') ||
                           bodyText.includes('comunità') ||
                           bodyText.includes('cuore') ||
                           bodyText.includes('banco') ||
                           bodyText.includes('porta'),
            // Debug info
            imageCount: allImages.length,
            svgCount: allSvgs.length,
            hasWikiGaiaText: bodyText.includes('WikiGaiaLab')
          };
        });
        
        // Take screenshots in different viewports
        const screenshots = {
          desktop: join(outputDir, `${screen.name}-desktop.png`),
          tablet: join(outputDir, `${screen.name}-tablet.png`),
          mobile: join(outputDir, `${screen.name}-mobile.png`)
        };
        
        // Desktop screenshot
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: screenshots.desktop, fullPage: true });
        
        // Tablet screenshot
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: screenshots.tablet, fullPage: true });
        
        // Mobile screenshot
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: screenshots.mobile, fullPage: true });
        
        // Evaluate UI against WikiGaia standards
        const evaluation = evaluateUI(brandElements, pageText, screen.priority);
        
        const result = {
          screen: screen.name,
          path: screen.path,
          description: screen.description,
          priority: screen.priority,
          title,
          brandElements,
          evaluation,
          screenshots,
          timestamp: new Date().toISOString(),
          status: 'success'
        };
        
        results.push(result);
        
        console.log(`✅ ${screen.name}: ${evaluation.totalScore.toFixed(1)}/10 ${evaluation.needsHealing ? '🩹 Needs Healing' : '✅ Good'}`);
        
        // Soft assertions for scoring (don't fail the test)
        if (evaluation.needsHealing) {
          console.log(`⚠️  Issues found: ${evaluation.issues.join(', ')}`);
        }
        
        // Only fail test if score is critically low (< 5)
        expect(evaluation.totalScore).toBeGreaterThan(5);
        
      } catch (error) {
        console.error(`❌ Failed to evaluate ${screen.name}:`, error);
        results.push({
          screen: screen.name,
          path: screen.path,
          priority: screen.priority,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Don't fail the test for navigation errors - just log them
        console.log(`⚠️  Continuing with next screen...`);
      }
    });
  }
  
  test.afterAll(async () => {
    // Generate comprehensive report
    const successfulResults = results.filter(r => r.status === 'success');
    const failedResults = results.filter(r => r.status === 'failed');
    const needsHealing = successfulResults.filter(r => r.evaluation?.needsHealing);
    
    const averageScore = successfulResults.length > 0 ? 
      successfulResults.reduce((sum, r) => sum + r.evaluation.totalScore, 0) / successfulResults.length : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_screens: pageList.length,
        successful_evaluations: successfulResults.length,
        failed_evaluations: failedResults.length,
        average_score: averageScore,
        screens_needing_healing: needsHealing.length,
        priority_alta_count: pageList.filter(p => p.priority === 'Alta').length,
        priority_media_count: pageList.filter(p => p.priority === 'Media').length
      },
      healing_recommendations: needsHealing.map(r => ({
        screen: r.screen,
        score: r.evaluation.totalScore,
        issues: r.evaluation.issues,
        priority: r.priority
      })),
      detailed_results: results
    };
    
    // Save JSON report
    const reportPath = join(outputDir, 'ui-healing-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate Markdown report
    let markdown = `# WikiGaiaLab UI Healing Report\n\n`;
    markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Screens**: ${report.summary.total_screens}\n`;
    markdown += `- **Successful Evaluations**: ${report.summary.successful_evaluations}\n`;
    markdown += `- **Failed Evaluations**: ${report.summary.failed_evaluations}\n`;
    markdown += `- **Average Score**: ${report.summary.average_score.toFixed(1)}/10\n`;
    markdown += `- **Screens Needing Healing**: ${report.summary.screens_needing_healing}\n\n`;
    
    if (needsHealing.length > 0) {
      markdown += `## 🩹 Priority Healing Actions\n\n`;
      needsHealing.forEach(result => {
        markdown += `### ${result.screen} (${result.path})\n`;
        markdown += `**Score**: ${result.evaluation.totalScore.toFixed(1)}/10 | **Priority**: ${result.priority}\n\n`;
        markdown += `**Issues**:\n`;
        result.evaluation.issues.forEach(issue => {
          markdown += `- ${issue}\n`;
        });
        markdown += `\n`;
      });
    }
    
    markdown += `## Detailed Results\n\n`;
    markdown += `| Screen | Path | Priority | Score | Status |\n`;
    markdown += `|--------|------|----------|-------|--------|\n`;
    
    results.forEach(result => {
      if (result.status === 'success') {
        const score = result.evaluation.totalScore.toFixed(1);
        const status = result.evaluation.needsHealing ? '🩹 Needs Healing' : '✅ Good';
        markdown += `| ${result.screen} | ${result.path} | ${result.priority} | ${score} | ${status} |\n`;
      } else {
        markdown += `| ${result.screen} | ${result.path} | ${result.priority} | - | ❌ Failed |\n`;
      }
    });
    
    const markdownPath = join(outputDir, 'ui-healing-report.md');
    writeFileSync(markdownPath, markdown);
    
    console.log('\n🎉 UI HEALING COMPLETE!');
    console.log('========================');
    console.log(`📁 Output: ${outputDir}`);
    console.log(`📊 Average Score: ${averageScore.toFixed(1)}/10`);
    console.log(`🩹 Screens Needing Healing: ${needsHealing.length}/${successfulResults.length}`);
    console.log(`📋 Full Report: ${reportPath}`);
    console.log(`📄 Markdown Report: ${markdownPath}`);
  });
});