const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function runUIHealing() {
  console.log('🚀 Starting WikiGaiaLab UI Healing with Playwright');
  
  // Read the page list
  const pageListPath = './docs/ui/page-list.md';
  const pageListContent = await fs.readFile(pageListPath, 'utf-8');
  
  // Parse screens from page-list.md
  const screens = [];
  pageListContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        screens.push({
          path: parts[0],
          name: parts[1],
          description: parts[2]
        });
      }
    }
  });
  
  console.log(`📋 Found ${screens.length} screens to capture`);
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false // Set to false to see the browser in action
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Create output directory
  const outputDir = './ui-healing-screenshots';
  await fs.mkdir(outputDir, { recursive: true });
  
  const results = [];
  
  // Capture screenshots for each screen
  for (const screen of screens) {
    console.log(`📸 Capturing: ${screen.name} - ${screen.path}`);
    
    try {
      const url = `http://localhost:3000${screen.path}`;
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait a bit for any animations to complete
      await page.waitForTimeout(2000);
      
      // Take screenshot
      const screenshotPath = path.join(outputDir, `${screen.name}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true
      });
      
      // Get page title and some basic info
      const title = await page.title();
      const url_final = page.url();
      
      results.push({
        screen: screen.name,
        path: screen.path,
        description: screen.description,
        screenshot: screenshotPath,
        title,
        url: url_final,
        status: 'success'
      });
      
      console.log(`✅ Successfully captured: ${screen.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to capture ${screen.name}:`, error.message);
      results.push({
        screen: screen.name,
        path: screen.path,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    application_url: 'http://localhost:3000',
    total_screens: screens.length,
    successful_captures: results.filter(r => r.status === 'success').length,
    failed_captures: results.filter(r => r.status === 'failed').length,
    results
  };
  
  // Save report
  const reportPath = path.join(outputDir, 'ui-healing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 UI HEALING COMPLETE');
  console.log(`📁 Screenshots saved to: ${outputDir}`);
  console.log(`📋 Report saved to: ${reportPath}`);
  console.log(`✅ Successful captures: ${report.successful_captures}/${report.total_screens}`);
  
  await browser.close();
  return report;
}

// Run the healing process
runUIHealing().catch(console.error);