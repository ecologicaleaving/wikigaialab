
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Screen definitions
const screens = [
  {
    "urlPath": "/",
    "screenName": "homepage",
    "description": "Landing page principale (focus: problema→soluzione condivisa)",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/",
    "priority": "high"
  },
  {
    "urlPath": "/dashboard",
    "screenName": "dashboard",
    "description": "Dashboard personale dell'utente (Il Mio Angolo)",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/dashboard",
    "priority": "medium"
  },
  {
    "urlPath": "/login",
    "screenName": "login",
    "description": "Schermata di autenticazione con Google OAuth",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/login",
    "priority": "high"
  },
  {
    "urlPath": "/test-login",
    "screenName": "test-login",
    "description": "Pagina di login dedicata per automazione Playwright",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/test-login",
    "priority": "high"
  },
  {
    "urlPath": "/profile",
    "screenName": "profile",
    "description": "Profilo personale utente (Il Mio Quaderno)",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/profile",
    "priority": "medium"
  },
  {
    "urlPath": "/settings",
    "screenName": "settings",
    "description": "Impostazioni account e preferenze",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/settings",
    "priority": "low"
  },
  {
    "urlPath": "/help",
    "screenName": "help",
    "description": "Pagina di aiuto e documentazione",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/help",
    "priority": "low"
  },
  {
    "urlPath": "/terms",
    "screenName": "terms",
    "description": "Termini e condizioni di servizio",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/terms",
    "priority": "low"
  },
  {
    "urlPath": "/problems",
    "screenName": "problems-list",
    "description": "Bacheca dei problemi comunitari (dashboard principale)",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/problems",
    "priority": "high"
  },
  {
    "urlPath": "/problems/new",
    "screenName": "problems-new",
    "description": "Modulo per raccontare un nuovo problema",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/problems/new",
    "priority": "high"
  },
  {
    "urlPath": "/problems/123",
    "screenName": "problem-detail",
    "description": "Pagina dettaglio di un problema specifico",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/problems/123",
    "priority": "medium"
  },
  {
    "urlPath": "/apps",
    "screenName": "apps-catalog",
    "description": "Catalogo delle soluzioni create (vetrina strumenti)",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/apps",
    "priority": "medium"
  },
  {
    "urlPath": "/apps/volantino-generator",
    "screenName": "volantino-generator",
    "description": "Prima app dimostrativa - Generatore Volantini",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/apps/volantino-generator",
    "priority": "medium"
  },
  {
    "urlPath": "/apps/[slug]",
    "screenName": "app-detail",
    "description": "Pagina dettaglio di un'app specifica",
    "authRequired": false,
    "fullUrl": "http://localhost:3000/apps/[slug]",
    "priority": "medium"
  },
  {
    "urlPath": "/users/123",
    "screenName": "user-profile",
    "description": "Profilo pubblico di un altro utente",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/users/123",
    "priority": "low"
  },
  {
    "urlPath": "/analytics",
    "screenName": "analytics",
    "description": "Dashboard analitica per l'utente",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/analytics",
    "priority": "low"
  },
  {
    "urlPath": "/admin",
    "screenName": "admin-dashboard",
    "description": "Dashboard principale amministrativa (Banco del Maestro)",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin",
    "priority": "low"
  },
  {
    "urlPath": "/admin/users",
    "screenName": "admin-users",
    "description": "Gestione utenti e ruoli",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/users",
    "priority": "low"
  },
  {
    "urlPath": "/admin/content",
    "screenName": "admin-content",
    "description": "Gestione contenuti e moderazione",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/content",
    "priority": "low"
  },
  {
    "urlPath": "/admin/moderation",
    "screenName": "admin-moderation",
    "description": "Coda di moderazione problemi",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/moderation",
    "priority": "low"
  },
  {
    "urlPath": "/admin/categories",
    "screenName": "admin-categories",
    "description": "Gestione categorie problemi",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/categories",
    "priority": "low"
  },
  {
    "urlPath": "/admin/quality",
    "screenName": "admin-quality",
    "description": "Controllo qualità contenuti",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/quality",
    "priority": "low"
  },
  {
    "urlPath": "/admin/seed",
    "screenName": "admin-seed",
    "description": "Strumenti di seeding database",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/seed",
    "priority": "low"
  },
  {
    "urlPath": "/admin/workflow",
    "screenName": "admin-workflow",
    "description": "Gestione workflow sviluppo",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/workflow",
    "priority": "low"
  },
  {
    "urlPath": "/admin/monitoring",
    "screenName": "admin-monitoring",
    "description": "Monitoraggio piattaforma",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/monitoring",
    "priority": "low"
  },
  {
    "urlPath": "/admin/growth",
    "screenName": "admin-growth",
    "description": "Metriche di crescita community",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/growth",
    "priority": "low"
  },
  {
    "urlPath": "/admin/import",
    "screenName": "admin-import",
    "description": "Importazione dati in bulk",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/admin/import",
    "priority": "low"
  },
  {
    "urlPath": "/test-notifications",
    "screenName": "test-notifications",
    "description": "Pagina test notifiche (solo dev)",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/test-notifications",
    "priority": "low"
  },
  {
    "urlPath": "/test-css",
    "screenName": "test-css",
    "description": "Pagina test CSS e styling (solo dev)",
    "authRequired": true,
    "fullUrl": "http://localhost:3000/test-css",
    "priority": "low"
  }
];
const CONFIG = {
  "APPLICATION_URL": "http://localhost:3000",
  "DOCS_PATH": "./docs/ui/",
  "SCORE_THRESHOLD": 8,
  "SCREENS_FILE": "./docs/ui/page-list.md",
  "OUTPUT_DIR": "./ui-healing-batch-output/",
  "VIEWPORTS": [
    {
      "width": 1920,
      "height": 1080,
      "name": "desktop"
    },
    {
      "width": 768,
      "height": 1024,
      "name": "tablet"
    },
    {
      "width": 375,
      "height": 667,
      "name": "mobile"
    }
  ],
  "TEST_CREDENTIALS": {
    "email": "playwright-test@wikigaialab.com",
    "password": "PlaywrightTest123!",
    "username": "playwright-user",
    "loginUrl": "http://localhost:3000/test-login"
  }
};

test.describe('WikiGaiaLab Batch UI Healing', () => {
  let isAuthenticated = false;

  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop by default
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Handle authentication if needed
    if (!isAuthenticated) {
      await authenticateUser(page);
      isAuthenticated = true;
    }
  });

  async function authenticateUser(page) {
    console.log('🔐 Authenticating user for protected routes...');
    try {
      await page.goto(CONFIG.TEST_CREDENTIALS.loginUrl);
      await page.waitForLoadState('networkidle');
      
      // Fill test login form if it exists
      try {
        await page.fill('input[type="email"], input[id*="email"], input[name*="email"]', CONFIG.TEST_CREDENTIALS.email);
        await page.fill('input[type="password"], input[id*="password"], input[name*="password"]', CONFIG.TEST_CREDENTIALS.password);
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Entra")');
        await page.waitForLoadState('networkidle');
        console.log('✅ Authentication successful');
      } catch (authError) {
        console.log('ℹ️ No auth form found, continuing without authentication');
      }
    } catch (error) {
      console.log('⚠️ Authentication failed:', error.message);
    }
  }

  // Generate tests for each screen and viewport combination
  for (const screen of screens) {
    for (const viewport of CONFIG.VIEWPORTS) {
      test(`Screenshot ${screen.screenName} - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        console.log(`📸 Capturing ${screen.screenName} (${viewport.name})...`);
        
        try {
          // Navigate to the screen
          await page.goto(screen.fullUrl, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000); // Allow time for animations and loading
          
          // Wait for key elements to load
          await page.waitForSelector('body', { timeout: 10000 });
          
          // Hide scrollbars and prepare for screenshot
          await page.addStyleTag({
            content: `
              ::-webkit-scrollbar { display: none; }
              * { scrollbar-width: none; }
              body { overflow-x: hidden; }
            `
          });
          
          // Take screenshot
          const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `${screen.screenName}-${viewport.name}.png`);
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
          });
          
          console.log(`✅ Screenshot saved: ${screenshotPath}`);
          
        } catch (error) {
          console.error(`❌ Failed to capture ${screen.screenName} (${viewport.name}):`, error.message);
          
          // Save error screenshot
          const errorPath = path.join(CONFIG.OUTPUT_DIR, `ERROR-${screen.screenName}-${viewport.name}.png`);
          try {
            await page.screenshot({ path: errorPath, fullPage: false });
          } catch (e) {
            console.error('Failed to save error screenshot:', e.message);
          }
        }
      });
    }
  }
});
