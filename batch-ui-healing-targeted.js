/**
 * WikiGaiaLab Batch UI Healing - Targeted Pages
 * Arguments: --specs --interaction /settings /help /admin
 * 
 * This script performs automated UI healing for specific pages with focus on:
 * - Brand identity compliance
 * - Interactivity patterns
 * - WikiGaia laboratory language
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: './ui-healing-targeted-output',
  testCredentials: {
    email: 'playwright-test@wikigaialab.com',
    password: 'PlaywrightTest123!'
  },
  targetPages: [
    { path: '/settings', name: 'settings', auth: true, title: 'Il Mio Banco di Lavoro' },
    { path: '/help', name: 'help', auth: false, title: 'Il Banco del Maestro - Centro Aiuto' },
    { path: '/admin', name: 'admin', auth: true, title: 'Il Banco del Maestro', admin: true }
  ],
  viewports: [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ]
};

// WikiGaia Brand Compliance Scoring System
const SCORING_CRITERIA = {
  brandIdentity: {
    weight: 0.25,
    checks: [
      { name: 'WikiGaia Colors', points: 2, check: checkWikiGaiaColors },
      { name: 'Logo Guidelines', points: 1, check: checkLogoCompliance },
      { name: 'Typography', points: 1, check: checkTypography },
      { name: 'Visual Hierarchy', points: 1, check: checkVisualHierarchy }
    ]
  },
  laboratoryLanguage: {
    weight: 0.25,
    checks: [
      { name: 'Laboratorio Terms', points: 2, check: checkLaboratorioLanguage },
      { name: 'Warm Tone', points: 1, check: checkWarmTone },
      { name: 'Community Feel', points: 1, check: checkCommunityLanguage },
      { name: 'Italian Context', points: 1, check: checkItalianContext }
    ]
  },
  interactivity: {
    weight: 0.25,
    checks: [
      { name: 'Hover Effects', points: 2, check: checkHoverEffects },
      { name: 'Animations', points: 1, check: checkAnimations },
      { name: 'Micro-interactions', points: 1, check: checkMicroInteractions },
      { name: 'Response Time', points: 1, check: checkResponseTime }
    ]
  },
  accessibility: {
    weight: 0.15,
    checks: [
      { name: 'Color Contrast', points: 2, check: checkColorContrast },
      { name: 'Keyboard Navigation', points: 1, check: checkKeyboardNav },
      { name: 'ARIA Labels', points: 1, check: checkAriaLabels },
      { name: 'Screen Reader', points: 1, check: checkScreenReader }
    ]
  },
  responsiveness: {
    weight: 0.10,
    checks: [
      { name: 'Mobile Layout', points: 2, check: checkMobileLayout },
      { name: 'Tablet Layout', points: 1, check: checkTabletLayout },
      { name: 'Cross-browser', points: 1, check: checkCrossBrowser },
      { name: 'Performance', points: 1, check: checkPerformance }
    ]
  }
};

// Create output directory
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Authentication helper
async function authenticate(page) {
  try {
    await page.goto(`${CONFIG.baseUrl}/test-login`);
    await page.fill('input[type="email"]', CONFIG.testCredentials.email);
    await page.fill('input[type="password"]', CONFIG.testCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${CONFIG.baseUrl}/dashboard`, { timeout: 10000 });
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

// Screenshot capture
async function captureScreenshots(page, pageName) {
  const screenshots = {};
  
  for (const viewport of CONFIG.viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000); // Allow layout to settle
    
    const screenshotPath = path.join(CONFIG.outputDir, `${pageName}-${viewport.name}.png`);
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled' // For consistent screenshots
    });
    
    screenshots[viewport.name] = screenshotPath;
    console.log(`📸 Screenshot captured: ${pageName}-${viewport.name}.png`);
  }
  
  return screenshots;
}

// Brand Compliance Checks
async function checkWikiGaiaColors(page) {
  const tealElements = await page.$$eval('[class*="teal"], [class*="emerald"]', elements => elements.length);
  const hasWikiGaiaColors = tealElements > 0;
  
  const blueElements = await page.$$eval('[class*="blue-"]', elements => 
    elements.filter(el => !el.className.includes('teal') && !el.className.includes('emerald')).length
  );
  
  const score = hasWikiGaiaColors ? (blueElements === 0 ? 2 : 1) : 0;
  return { score, details: `Teal elements: ${tealElements}, Blue elements: ${blueElements}` };
}

async function checkLaboratorioLanguage(page) {
  const laboratoryTerms = [
    'laboratorio', 'maestro', 'artigiano', 'banco', 'attrezzi', 
    'Il Mio Angolo', 'Racconta', 'La Bacheca', 'cuoricini'
  ];
  
  const pageText = await page.textContent('body');
  const foundTerms = laboratoryTerms.filter(term => 
    pageText.toLowerCase().includes(term.toLowerCase())
  );
  
  const score = foundTerms.length >= 3 ? 2 : (foundTerms.length >= 1 ? 1 : 0);
  return { score, details: `Found terms: ${foundTerms.join(', ')}` };
}

async function checkHoverEffects(page) {
  const interactiveElements = await page.$$eval('[class*="hover:"], button, a, [role="button"]', elements => {
    return elements.map(el => ({
      hasHover: el.className.includes('hover:'),
      tagName: el.tagName.toLowerCase()
    }));
  });
  
  const hoverElements = interactiveElements.filter(el => el.hasHover).length;
  const totalInteractive = interactiveElements.length;
  
  const score = totalInteractive > 0 ? (hoverElements / totalInteractive >= 0.7 ? 2 : 1) : 0;
  return { score, details: `${hoverElements}/${totalInteractive} elements have hover effects` };
}

async function checkColorContrast(page) {
  // Simplified contrast check - in real implementation would use actual contrast calculations
  const contrastIssues = await page.$$eval('*', elements => {
    let issues = 0;
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      
      // Basic check for very light text on light backgrounds
      if (color.includes('rgb(200') || color.includes('rgb(220') || color.includes('rgb(240')) {
        if (bgColor.includes('rgb(255') || bgColor.includes('rgb(250')) {
          issues++;
        }
      }
    });
    return issues;
  });
  
  const score = contrastIssues === 0 ? 2 : (contrastIssues < 3 ? 1 : 0);
  return { score, details: `Potential contrast issues: ${contrastIssues}` };
}

// Placeholder functions for other checks
async function checkLogoCompliance(page) {
  const logos = await page.$$('img[alt*="WikiGaia"], img[src*="wikigaia"]');
  const score = logos.length > 0 ? 1 : 0;
  return { score, details: `Found ${logos.length} logo elements` };
}

async function checkTypography(page) {
  const fonts = await page.evaluate(() => {
    const styles = Array.from(document.querySelectorAll('*')).map(el => 
      window.getComputedStyle(el).fontFamily
    );
    return [...new Set(styles)];
  });
  
  const hasInter = fonts.some(font => font.includes('Inter'));
  const score = hasInter ? 1 : 0;
  return { score, details: `Fonts found: ${fonts.slice(0, 3).join(', ')}` };
}

async function checkVisualHierarchy(page) {
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings => headings.length);
  const score = headings >= 2 ? 1 : 0;
  return { score, details: `Found ${headings} heading elements` };
}

async function checkWarmTone(page) {
  const warmWords = ['ciao', 'benvenuto', 'insieme', 'famiglia', 'casa'];
  const pageText = await page.textContent('body');
  const foundWarmWords = warmWords.filter(word => 
    pageText.toLowerCase().includes(word.toLowerCase())
  );
  
  const score = foundWarmWords.length >= 2 ? 1 : 0;
  return { score, details: `Warm words: ${foundWarmWords.join(', ')}` };
}

async function checkCommunityLanguage(page) {
  const communityTerms = ['comunità', 'insieme', 'condividi', 'aiuta', 'collabora'];
  const pageText = await page.textContent('body');
  const foundTerms = communityTerms.filter(term => 
    pageText.toLowerCase().includes(term.toLowerCase())
  );
  
  const score = foundTerms.length >= 1 ? 1 : 0;
  return { score, details: `Community terms: ${foundTerms.join(', ')}` };
}

async function checkItalianContext(page) {
  const italianTerms = ['tuo', 'tua', 'nostro', 'nostra', 'qui', 'casa'];
  const pageText = await page.textContent('body');
  const foundTerms = italianTerms.filter(term => 
    pageText.toLowerCase().includes(term.toLowerCase())
  );
  
  const score = foundTerms.length >= 3 ? 1 : 0;
  return { score, details: `Italian terms: ${foundTerms.join(', ')}` };
}

async function checkAnimations(page) {
  const animatedElements = await page.$$eval('[class*="transition"], [class*="animate"]', elements => elements.length);
  const score = animatedElements >= 3 ? 1 : 0;
  return { score, details: `Animated elements: ${animatedElements}` };
}

async function checkMicroInteractions(page) {
  const microInteractions = await page.$$eval('[class*="group"], [class*="scale"], [class*="transform"]', elements => elements.length);
  const score = microInteractions >= 2 ? 1 : 0;
  return { score, details: `Micro-interaction elements: ${microInteractions}` };
}

async function checkResponseTime(page) {
  const startTime = Date.now();
  await page.hover('button:first-of-type').catch(() => {});
  const responseTime = Date.now() - startTime;
  
  const score = responseTime < 100 ? 1 : 0;
  return { score, details: `Response time: ${responseTime}ms` };
}

async function checkKeyboardNav(page) {
  const focusableElements = await page.$$eval('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])', elements => elements.length);
  const score = focusableElements >= 3 ? 1 : 0;
  return { score, details: `Focusable elements: ${focusableElements}` };
}

async function checkAriaLabels(page) {
  const ariaElements = await page.$$eval('[aria-label], [aria-labelledby], [role]', elements => elements.length);
  const score = ariaElements >= 2 ? 1 : 0;
  return { score, details: `ARIA elements: ${ariaElements}` };
}

async function checkScreenReader(page) {
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings => headings.length);
  const altTexts = await page.$$eval('img[alt]', images => images.length);
  
  const score = (headings >= 1 && altTexts >= 0) ? 1 : 0;
  return { score, details: `Headings: ${headings}, Alt texts: ${altTexts}` };
}

async function checkMobileLayout(page) {
  await page.setViewportSize({ width: 375, height: 667 });
  const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  
  const score = !hasHorizontalScroll ? 2 : 1;
  return { score, details: `Horizontal scroll: ${hasHorizontalScroll}` };
}

async function checkTabletLayout(page) {
  await page.setViewportSize({ width: 768, height: 1024 });
  const responsiveElements = await page.$$eval('[class*="md:"], [class*="lg:"]', elements => elements.length);
  
  const score = responsiveElements >= 3 ? 1 : 0;
  return { score, details: `Responsive elements: ${responsiveElements}` };
}

async function checkCrossBrowser(page) {
  // Simplified cross-browser check
  const modernFeatures = await page.evaluate(() => {
    return {
      flexbox: CSS.supports('display', 'flex'),
      grid: CSS.supports('display', 'grid'),
      customProperties: CSS.supports('color', 'var(--test)')
    };
  });
  
  const supportedFeatures = Object.values(modernFeatures).filter(Boolean).length;
  const score = supportedFeatures === 3 ? 1 : 0;
  return { score, details: `Modern CSS features: ${supportedFeatures}/3` };
}

async function checkPerformance(page) {
  const startTime = Date.now();
  await page.reload();
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  const score = loadTime < 3000 ? 1 : 0;
  return { score, details: `Load time: ${loadTime}ms` };
}

// Main scoring function
async function scorePage(page, pageInfo) {
  let totalScore = 0;
  let maxScore = 0;
  const categoryScores = {};
  
  console.log(`\n🔍 Analyzing ${pageInfo.name} page...`);
  
  for (const [categoryName, category] of Object.entries(SCORING_CRITERIA)) {
    let categoryScore = 0;
    let categoryMax = 0;
    const categoryDetails = [];
    
    for (const check of category.checks) {
      try {
        const result = await check.check(page);
        categoryScore += result.score;
        categoryMax += check.points;
        categoryDetails.push({
          name: check.name,
          score: result.score,
          maxScore: check.points,
          details: result.details
        });
      } catch (error) {
        console.error(`❌ Check ${check.name} failed:`, error.message);
        categoryMax += check.points;
      }
    }
    
    const weightedScore = (categoryScore / categoryMax) * category.weight * 10;
    totalScore += weightedScore;
    maxScore += category.weight * 10;
    
    categoryScores[categoryName] = {
      score: categoryScore,
      maxScore: categoryMax,
      weightedScore: weightedScore,
      weight: category.weight,
      details: categoryDetails
    };
    
    console.log(`  ${categoryName}: ${categoryScore}/${categoryMax} (weighted: ${weightedScore.toFixed(1)}/10)`);
  }
  
  const finalScore = (totalScore / maxScore) * 10;
  
  return {
    finalScore: finalScore,
    categoryScores: categoryScores,
    totalScore: totalScore,
    maxScore: maxScore
  };
}

// Generate healing report
function generateHealingReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      pagesAnalyzed: results.length,
      averageScore: results.reduce((sum, r) => sum + r.scoring.finalScore, 0) / results.length,
      passThreshold: 8.0
    },
    pages: results,
    recommendations: generateRecommendations(results)
  };
  
  // Save JSON report
  const jsonPath = path.join(CONFIG.outputDir, 'healing-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const mdPath = path.join(CONFIG.outputDir, 'HEALING-REPORT.md');
  fs.writeFileSync(mdPath, markdownReport);
  
  console.log(`\n📊 Report saved to: ${jsonPath}`);
  console.log(`📝 Markdown report: ${mdPath}`);
  
  return report;
}

function generateRecommendations(results) {
  const recommendations = [];
  
  results.forEach(result => {
    const lowScores = [];
    
    Object.entries(result.scoring.categoryScores).forEach(([category, data]) => {
      if (data.score / data.maxScore < 0.7) {
        lowScores.push({
          page: result.pageInfo.name,
          category: category,
          score: data.score,
          maxScore: data.maxScore,
          issues: data.details.filter(d => d.score < d.maxScore)
        });
      }
    });
    
    if (lowScores.length > 0) {
      recommendations.push({
        page: result.pageInfo.name,
        priority: result.scoring.finalScore < 6 ? 'HIGH' : (result.scoring.finalScore < 8 ? 'MEDIUM' : 'LOW'),
        issues: lowScores
      });
    }
  });
  
  return recommendations;
}

function generateMarkdownReport(report) {
  let md = `# WikiGaiaLab UI Healing Report - Targeted Pages\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Pages Analyzed:** ${report.summary.pagesAnalyzed}\n`;
  md += `**Average Score:** ${report.summary.averageScore.toFixed(1)}/10\n`;
  md += `**Pass Threshold:** ${report.summary.passThreshold}/10\n\n`;
  
  md += `## 📊 Page Scores\n\n`;
  md += `| Page | Score | Status | Brand Identity | Laboratory Language | Interactivity | Accessibility |\n`;
  md += `|------|-------|---------|----------------|-------------------|---------------|---------------|\n`;
  
  report.pages.forEach(page => {
    const score = page.scoring.finalScore;
    const status = score >= 8 ? '✅ Pass' : score >= 6 ? '⚠️ Needs Work' : '❌ Fail';
    
    const brandScore = page.scoring.categoryScores.brandIdentity.score / page.scoring.categoryScores.brandIdentity.maxScore * 10;
    const langScore = page.scoring.categoryScores.laboratoryLanguage.score / page.scoring.categoryScores.laboratoryLanguage.maxScore * 10;
    const interScore = page.scoring.categoryScores.interactivity.score / page.scoring.categoryScores.interactivity.maxScore * 10;
    const a11yScore = page.scoring.categoryScores.accessibility.score / page.scoring.categoryScores.accessibility.maxScore * 10;
    
    md += `| ${page.pageInfo.name} | ${score.toFixed(1)}/10 | ${status} | ${brandScore.toFixed(1)} | ${langScore.toFixed(1)} | ${interScore.toFixed(1)} | ${a11yScore.toFixed(1)} |\n`;
  });
  
  md += `\n## 🎯 Recommendations\n\n`;
  
  report.recommendations.forEach(rec => {
    md += `### ${rec.page} (Priority: ${rec.priority})\n\n`;
    
    rec.issues.forEach(issue => {
      md += `**${issue.category}** (${issue.score}/${issue.maxScore}):\n`;
      issue.issues.forEach(detail => {
        md += `- ${detail.name}: ${detail.details}\n`;
      });
      md += `\n`;
    });
  });
  
  md += `\n## 📸 Screenshots\n\n`;
  report.pages.forEach(page => {
    md += `### ${page.pageInfo.name}\n\n`;
    CONFIG.viewports.forEach(viewport => {
      md += `**${viewport.name}**: ![${page.pageInfo.name}-${viewport.name}](./${page.pageInfo.name}-${viewport.name}.png)\n\n`;
    });
  });
  
  return md;
}

// Main execution function
async function runBatchUIHealing() {
  console.log('🚀 Starting WikiGaiaLab Batch UI Healing - Targeted Pages');
  console.log('Arguments: --specs --interaction /settings /help /admin\n');
  
  ensureOutputDir();
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'it-IT'
  });
  
  const results = [];
  
  try {
    for (const pageInfo of CONFIG.targetPages) {
      console.log(`\n📄 Processing: ${pageInfo.path} (${pageInfo.name})`);
      
      const page = await context.newPage();
      
      // Authenticate if required
      if (pageInfo.auth) {
        const authSuccess = await authenticate(page);
        if (!authSuccess) {
          console.log(`⏭️ Skipping ${pageInfo.name} due to authentication failure`);
          await page.close();
          continue;
        }
      }
      
      // Navigate to target page
      try {
        await page.goto(`${CONFIG.baseUrl}${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Verify page loaded correctly by checking title or content
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Capture screenshots
        const screenshots = await captureScreenshots(page, pageInfo.name);
        
        // Score the page
        const scoring = await scorePage(page, pageInfo);
        
        results.push({
          pageInfo: pageInfo,
          screenshots: screenshots,
          scoring: scoring,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${pageInfo.name} completed - Score: ${scoring.finalScore.toFixed(1)}/10`);
        
      } catch (error) {
        console.error(`❌ Failed to process ${pageInfo.name}:`, error.message);
      }
      
      await page.close();
    }
    
    // Generate comprehensive report
    if (results.length > 0) {
      const report = generateHealingReport(results);
      
      console.log(`\n🎉 Batch UI Healing Complete!`);
      console.log(`📊 Average Score: ${report.summary.averageScore.toFixed(1)}/10`);
      console.log(`📁 Results saved to: ${CONFIG.outputDir}`);
      
      // Show summary
      results.forEach(result => {
        const score = result.scoring.finalScore;
        const status = score >= 8 ? '✅' : score >= 6 ? '⚠️' : '❌';
        console.log(`  ${status} ${result.pageInfo.name}: ${score.toFixed(1)}/10`);
      });
      
    } else {
      console.log('❌ No pages were successfully processed');
    }
    
  } catch (error) {
    console.error('❌ Batch UI Healing failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the healing process
if (require.main === module) {
  runBatchUIHealing().catch(console.error);
}

module.exports = { runBatchUIHealing, CONFIG, SCORING_CRITERIA };