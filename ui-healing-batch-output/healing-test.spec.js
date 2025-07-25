
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
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
  }
];
const viewports = [
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
];
const outputDir = "./ui-healing-batch-output/";

test.describe('WikiGaiaLab UI Healing Screenshots', () => {
  
  test('Capture all screen screenshots', async ({ page }) => {
    console.log('🎯 Starting systematic screenshot capture...');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const screen of screens) {
      console.log(`\n📱 Processing screen: ${screen.screenName}`);
      
      for (const viewport of viewports) {
        console.log(`  📸 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        try {
          // Set viewport
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          
          // Navigate to screen
          await page.goto(screen.fullUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Wait for content to load
          await page.waitForTimeout(3000);
          
          // Hide scrollbars for clean screenshots
          await page.addStyleTag({
            content: `
              ::-webkit-scrollbar { display: none !important; }
              * { scrollbar-width: none !important; }
              body { overflow-x: hidden !important; }
            `
          });
          
          // Take screenshot
          const screenshotName = `${screen.screenName}-${viewport.name}.png`;
          const screenshotPath = path.join(outputDir, screenshotName);
          
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
          });
          
          console.log(`    ✅ Saved: ${screenshotName}`);
          
        } catch (error) {
          console.error(`    ❌ Failed ${screen.screenName} (${viewport.name}): ${error.message}`);
          
          // Save error screenshot if possible
          try {
            const errorName = `ERROR-${screen.screenName}-${viewport.name}.png`;
            const errorPath = path.join(outputDir, errorName);
            await page.screenshot({ path: errorPath, fullPage: false });
            console.log(`    📋 Error screenshot saved: ${errorName}`);
          } catch (e) {
            console.error(`    ⚠️ Could not save error screenshot: ${e.message}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Screenshot capture completed!');
  });
});
