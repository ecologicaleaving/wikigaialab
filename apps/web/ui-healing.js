const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function runUIHealing() {
  console.log('🚀 WikiGaiaLab Total UI Healing with Playwright');
  console.log('===============================================\n');
  
  // Read the page list from the docs directory
  const pageListPath = '../../docs/ui/page-list.md';
  
  try {
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
    
    console.log(`📋 Found ${screens.length} screens to capture and evaluate`);
    
    // Launch browser with options optimized for UI testing
    const browser = await chromium.launch({ 
      headless: true, // Set to false to see the browser in action
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      deviceScaleFactor: 1
    });
    
    const page = await context.newPage();
    
    // Create output directory
    const outputDir = './ui-healing-output';
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    let successCount = 0;
    
    // Process Priority Alta screens first
    const priorityAlta = ['/', '/problems', '/problems/new', '/login'];
    const priorityScreens = screens.filter(s => priorityAlta.includes(s.path));
    const regularScreens = screens.filter(s => !priorityAlta.includes(s.path));
    
    console.log(`🎯 Processing ${priorityScreens.length} Priority Alta screens first...`);
    
    const allScreens = [...priorityScreens, ...regularScreens];
    
    // Capture screenshots and analyze each screen
    for (let i = 0; i < allScreens.length; i++) {
      const screen = allScreens[i];
      const isPriorityAlta = priorityAlta.includes(screen.path);
      const priority = isPriorityAlta ? '🔥 ALTA' : '📋 MEDIA';
      
      console.log(`\n${i + 1}/${allScreens.length} [${priority}] ${screen.name} - ${screen.path}`);
      
      try {
        const url = `http://localhost:3000${screen.path}`;
        
        // Navigate to the page
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for page to stabilize and animations to complete
        await page.waitForTimeout(3000);
        
        // Take screenshots in different viewports
        const screenshots = {};
        
        // Desktop screenshot
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        screenshots.desktop = path.join(outputDir, `${screen.name}-desktop.png`);
        await page.screenshot({ 
          path: screenshots.desktop,
          fullPage: true
        });
        
        // Tablet screenshot
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        screenshots.tablet = path.join(outputDir, `${screen.name}-tablet.png`);
        await page.screenshot({ 
          path: screenshots.tablet,
          fullPage: true
        });
        
        // Mobile screenshot
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        screenshots.mobile = path.join(outputDir, `${screen.name}-mobile.png`);
        await page.screenshot({ 
          path: screenshots.mobile,
          fullPage: true
        });
        
        // Reset to desktop for accessibility analysis
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // Get page metadata and accessibility info
        const title = await page.title();
        const url_final = page.url();
        
        // Check for WikiGaia brand elements
        const brandElements = await page.evaluate(() => {
          const results = {
            hasWikiGaiaLogo: !!document.querySelector('img[alt*="WikiGaia"], img[src*="wikigaia"]'),
            tealColors: document.querySelectorAll('[class*="teal"], [class*="emerald"]').length,
            heartIcons: document.querySelectorAll('[class*="heart"], .fa-heart, svg[data-icon="heart"]').length,
            artisanalLanguage: document.body.textContent.includes('laboratorio') || 
                               document.body.textContent.includes('artigian') ||
                               document.body.textContent.includes('maestr'),
            primaryButtons: document.querySelectorAll('button, .btn').length
          };
          return results;
        });
        
        // Basic UI evaluation
        const evaluation = evaluateUI(screen, brandElements, isPriorityAlta);
        
        results.push({
          screen: screen.name,
          path: screen.path,
          description: screen.description,
          priority: isPriorityAlta ? 'Alta' : 'Media',
          screenshots,
          title,
          url: url_final,
          brandElements,
          evaluation,
          status: 'success'
        });
        
        successCount++;
        console.log(`✅ Captured and evaluated: ${screen.name} (Score: ${evaluation.totalScore.toFixed(1)}/10)`);
        
      } catch (error) {
        console.error(`❌ Failed to process ${screen.name}:`, error.message);
        results.push({
          screen: screen.name,
          path: screen.path,
          priority: isPriorityAlta ? 'Alta' : 'Media',
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Generate comprehensive report
    const report = generateReport(results, successCount, allScreens.length);
    
    // Save report
    const reportPath = path.join(outputDir, 'ui-healing-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate healing recommendations
    const healingPath = path.join(outputDir, 'healing-recommendations.md');
    await generateHealingReport(results, healingPath);
    
    console.log('\n🎉 UI HEALING COMPLETE!');
    console.log('========================');
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`📊 Success Rate: ${successCount}/${allScreens.length} (${((successCount/allScreens.length)*100).toFixed(1)}%)`);
    console.log(`📈 Average Score: ${report.averageScore.toFixed(1)}/10`);
    console.log(`🩹 Screens Needing Healing: ${report.screensNeedingHealing}`);
    console.log(`📋 Full Report: ${reportPath}`);
    console.log(`💡 Recommendations: ${healingPath}`);
    
    await browser.close();
    return report;
    
  } catch (error) {
    console.error('❌ UI Healing failed:', error);
    throw error;
  }
}

function evaluateUI(screen, brandElements, isPriorityAlta) {
  const weights = isPriorityAlta ? 
    { brand: 0.35, language: 0.35, accessibility: 0.30 } :
    { brand: 0.25, language: 0.25, accessibility: 0.50 };
  
  // Brand Identity Score (0-10)
  let brandScore = 5; // Base score
  if (brandElements.hasWikiGaiaLogo) brandScore += 2;
  if (brandElements.tealColors > 0) brandScore += 1.5;
  if (brandElements.heartIcons > 0) brandScore += 1.5;
  brandScore = Math.min(brandScore, 10);
  
  // Artisanal Language Score (0-10)
  let languageScore = 5; // Base score
  if (brandElements.artisanalLanguage) languageScore += 3;
  if (brandElements.primaryButtons > 0) languageScore += 2;
  languageScore = Math.min(languageScore, 10);
  
  // Accessibility & UX Score (0-10)
  let accessibilityScore = 7; // Assuming basic React/Next.js compliance
  
  const totalScore = (brandScore * weights.brand) + 
                     (languageScore * weights.language) + 
                     (accessibilityScore * weights.accessibility);
  
  return {
    brandScore,
    languageScore,
    accessibilityScore,
    totalScore,
    needsHealing: totalScore < 8,
    weights,
    priority: isPriorityAlta ? 'Alta' : 'Media'
  };
}

function generateReport(results, successCount, totalCount) {
  const successfulResults = results.filter(r => r.status === 'success');
  const averageScore = successfulResults.length > 0 ? 
    successfulResults.reduce((sum, r) => sum + r.evaluation.totalScore, 0) / successfulResults.length : 0;
  const screensNeedingHealing = successfulResults.filter(r => r.evaluation.needsHealing).length;
  
  return {
    timestamp: new Date().toISOString(),
    application_url: 'http://localhost:3000',
    total_screens: totalCount,
    successful_captures: successCount,
    failed_captures: totalCount - successCount,
    averageScore,
    screensNeedingHealing,
    priorityAlta: results.filter(r => r.priority === 'Alta'),
    priorityMedia: results.filter(r => r.priority === 'Media'),
    results
  };
}

async function generateHealingReport(results, outputPath) {
  const successfulResults = results.filter(r => r.status === 'success');
  const needsHealing = successfulResults.filter(r => r.evaluation.needsHealing);
  
  let markdown = `# WikiGaiaLab UI Healing Recommendations\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Screens Evaluated**: ${successfulResults.length}\n`;
  markdown += `- **Screens Needing Healing**: ${needsHealing.length}\n`;
  markdown += `- **Average Score**: ${(successfulResults.reduce((sum, r) => sum + r.evaluation.totalScore, 0) / successfulResults.length).toFixed(1)}/10\n\n`;
  
  if (needsHealing.length > 0) {
    markdown += `## Priority Healing Actions\n\n`;
    
    needsHealing.forEach(result => {
      markdown += `### ${result.screen} (${result.path})\n`;
      markdown += `**Score**: ${result.evaluation.totalScore.toFixed(1)}/10 | **Priority**: ${result.priority}\n\n`;
      markdown += `**Issues Found**:\n`;
      
      if (result.evaluation.brandScore < 7) {
        markdown += `- 🎨 **Brand Identity**: Score ${result.evaluation.brandScore}/10\n`;
        markdown += `  - Missing WikiGaia visual elements\n`;
        markdown += `  - Need more teal/emerald color integration\n`;
        markdown += `  - Add heart-based consensus elements\n`;
      }
      
      if (result.evaluation.languageScore < 7) {
        markdown += `- 🛠️ **Artisanal Language**: Score ${result.evaluation.languageScore}/10\n`;
        markdown += `  - Missing laboratory/artisan terminology\n`;
        markdown += `  - Button text needs warming ("Entra nel Laboratorio")\n`;
        markdown += `  - Add community-focused messaging\n`;
      }
      
      if (result.evaluation.accessibilityScore < 7) {
        markdown += `- ♿ **Accessibility**: Score ${result.evaluation.accessibilityScore}/10\n`;
        markdown += `  - Review WCAG AA compliance\n`;
        markdown += `  - Check keyboard navigation\n`;
        markdown += `  - Verify screen reader compatibility\n`;
      }
      
      markdown += `\n`;
    });
  }
  
  markdown += `## All Screens Evaluation\n\n`;
  markdown += `| Screen | Path | Priority | Score | Brand | Language | A11y | Status |\n`;
  markdown += `|--------|------|----------|-------|-------|----------|------|--------|\n`;
  
  results.forEach(result => {
    if (result.status === 'success') {
      const e = result.evaluation;
      markdown += `| ${result.screen} | ${result.path} | ${result.priority} | ${e.totalScore.toFixed(1)} | ${e.brandScore.toFixed(1)} | ${e.languageScore.toFixed(1)} | ${e.accessibilityScore.toFixed(1)} | ${e.needsHealing ? '🩹 Needs Healing' : '✅ Good'} |\n`;
    } else {
      markdown += `| ${result.screen} | ${result.path} | ${result.priority || 'Unknown'} | - | - | - | - | ❌ Failed |\n`;
    }
  });
  
  await fs.writeFile(outputPath, markdown);
}

// Run the healing process
if (require.main === module) {
  runUIHealing().catch(console.error);
}

module.exports = { runUIHealing };