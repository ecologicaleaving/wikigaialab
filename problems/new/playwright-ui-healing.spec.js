/**
 * WikiGaiaLab UI Healing - Playwright Integration
 * Focus: /problems/new page - Interactive batch healing with real screenshots
 * 
 * Usage: npx playwright test problems/new/playwright-ui-healing.spec.js
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TARGET_PAGE: '/problems/new',
  OUTPUT_DIR: './problems/new/ui-healing-output',
  
  // Test credentials
  TEST_EMAIL: 'playwright-test@wikigaialab.com',
  TEST_PASSWORD: 'PlaywrightTest123!',
  LOGIN_URL: '/test-login',
  
  // WikiGaia brand colors for validation
  BRAND_COLORS: {
    verde_wikigaia: '#00B894',
    verde_scuro: '#00695C',
    verde_natura: '#26A69A',
    teal_collaborativo: '#4DB6AC'
  },
  
  // Score thresholds
  SCORE_THRESHOLD: 8.0,
  TARGET_SCORE: 9.0
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
  fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

/**
 * UI Evaluation Class
 */
class UIEvaluator {
  constructor(page) {
    this.page = page;
    this.evaluation = {
      visual_design: 0,
      ux_interaction: 0,
      laboratory_environment: 0,
      technical_performance: 0,
      details: {}
    };
  }
  
  async evaluateVisualDesign() {
    console.log('🎨 Evaluating Visual Design...');
    
    let score = 0;
    const details = {};
    
    // Check WikiGaia logo presence
    const logo = await this.page.locator('[alt*="WikiGaia"], [src*="wikigaia"], img[src*="logo"]').first();
    if (await logo.isVisible()) {
      score += 0.3;
      details.logo_present = true;
    } else {
      details.logo_present = false;
      details.issues = details.issues || [];
      details.issues.push('WikiGaia logo not found');
    }
    
    // Check for WikiGaia brand colors in CSS
    const brandColorFound = await this.page.evaluate((colors) => {
      const styles = Array.from(document.querySelectorAll('*')).map(el => {
        const computedStyle = window.getComputedStyle(el);
        return {
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          borderColor: computedStyle.borderColor
        };
      });
      
      const rgbToHex = (rgb) => {
        const match = rgb.match(/\d+/g);
        if (!match) return null;
        return '#' + match.map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
      };
      
      return styles.some(style => {
        const bgHex = rgbToHex(style.backgroundColor);
        const colorHex = rgbToHex(style.color);
        const borderHex = rgbToHex(style.borderColor);
        
        return Object.values(colors).some(brandColor => 
          [bgHex, colorHex, borderHex].includes(brandColor.toUpperCase())
        );
      });
    }, CONFIG.BRAND_COLORS);
    
    if (brandColorFound) {
      score += 0.4;
      details.brand_colors_found = true;
    } else {
      details.brand_colors_found = false;
      details.issues = details.issues || [];
      details.issues.push('WikiGaia brand colors not detected');
    }
    
    // Check typography (Inter font)
    const fontCheck = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.fontFamily.includes('Inter')) {
          return true;
        }
      }
      return false;
    });
    
    if (fontCheck) {
      score += 0.3;
      details.inter_font_found = true;
    } else {
      details.inter_font_found = false;
      details.issues = details.issues || [];
      details.issues.push('Inter font not detected');
    }
    
    this.evaluation.visual_design = Math.min(score, 1.0);
    this.evaluation.details.visual_design = details;
    
    console.log(`   Score: ${(score * 10).toFixed(1)}/10`);
    return score;
  }
  
  async evaluateUXInteraction() {
    console.log('⚡ Evaluating UX & Interaction...');
    
    let score = 0;
    const details = {};
    
    // Check for artisan laboratory language
    const laboratoryLanguage = await this.page.evaluate(() => {
      const textContent = document.body.textContent.toLowerCase();
      const laboratoryTerms = [
        'laboratorio', 'maestro', 'artigiano', 'compagni', 
        'vicini', 'racconta', 'problema', 'soluzione'
      ];
      
      return laboratoryTerms.filter(term => textContent.includes(term));
    });
    
    if (laboratoryLanguage.length >= 4) {
      score += 0.4;
      details.laboratory_language_score = laboratoryLanguage.length;
      details.laboratory_terms_found = laboratoryLanguage;
    } else {
      details.laboratory_language_score = laboratoryLanguage.length;
      details.issues = details.issues || [];
      details.issues.push('Insufficient artisan laboratory language');
    }
    
    // Check form interaction patterns
    const formElements = await this.page.locator('form input, form textarea, form select').count();
    const formLabels = await this.page.locator('form label').count();
    
    if (formElements > 0 && formLabels >= formElements) {
      score += 0.3;
      details.form_accessibility = true;
    } else {
      details.form_accessibility = false;
      details.issues = details.issues || [];
      details.issues.push('Form accessibility issues detected');
    }
    
    // Check for interactive elements with hover states
    const interactiveElements = await this.page.locator('button, [role="button"], a, input').count();
    if (interactiveElements > 0) {
      score += 0.3;
      details.interactive_elements_count = interactiveElements;
    }
    
    this.evaluation.ux_interaction = Math.min(score, 1.0);
    this.evaluation.details.ux_interaction = details;
    
    console.log(`   Score: ${(score * 10).toFixed(1)}/10`);
    return score;
  }
  
  async evaluateLaboratoryEnvironment() {
    console.log('🔧 Evaluating Laboratory Environment...');
    
    let score = 0;
    const details = {};
    
    // Check for workshop/laboratory atmosphere
    const workshopElements = await this.page.evaluate(() => {
      const textContent = document.body.textContent.toLowerCase();
      const workshopTerms = [
        'consigli dal laboratorio', 'workshop', 'bottega', 
        'maestro', 'apprendista', 'strumenti', 'attrezzi'
      ];
      
      return workshopTerms.filter(term => textContent.includes(term));
    });
    
    if (workshopElements.length >= 2) {
      score += 0.4;
      details.workshop_atmosphere = true;
      details.workshop_terms_found = workshopElements;
    } else {
      details.workshop_atmosphere = false;
      details.issues = details.issues || [];
      details.issues.push('Weak workshop atmosphere');
    }
    
    // Check for community messaging
    const communityTerms = await this.page.evaluate(() => {
      const textContent = document.body.textContent.toLowerCase();
      const terms = [
        'comunità', 'condividi', 'insieme', 'vicini', 
        'quartiere', 'supporto', 'aiuto', 'collabora'
      ];
      
      return terms.filter(term => textContent.includes(term));
    });
    
    if (communityTerms.length >= 3) {
      score += 0.3;
      details.community_messaging = true;
      details.community_terms_found = communityTerms;
    } else {
      details.community_messaging = false;
      details.issues = details.issues || [];
      details.issues.push('Insufficient community messaging');
    }
    
    // Check for warm color scheme (orange, amber, yellow backgrounds)
    const warmColors = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const warmColorPattern = /rgb\((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?),\s*(1[5-9][0-9]|2[0-4][0-9]|25[0-5]),\s*([0-9]|[0-4][0-9]|5[0-9])\)/;
      
      return elements.some(el => {
        const bgColor = window.getComputedStyle(el).backgroundColor;
        return warmColorPattern.test(bgColor) || 
               bgColor.includes('orange') || 
               bgColor.includes('amber') || 
               bgColor.includes('yellow');
      });
    });
    
    if (warmColors) {
      score += 0.3;
      details.warm_color_scheme = true;
    } else {
      details.warm_color_scheme = false;
    }
    
    this.evaluation.laboratory_environment = Math.min(score, 1.0);
    this.evaluation.details.laboratory_environment = details;
    
    console.log(`   Score: ${(score * 10).toFixed(1)}/10`);
    return score;
  }
  
  async evaluateTechnicalPerformance() {
    console.log('⚙️ Evaluating Technical Performance...');
    
    let score = 0;
    const details = {};
    
    // Check page load performance
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    if (performanceMetrics.domContentLoaded < 2000) {
      score += 0.3;
      details.dom_load_performance = 'good';
    } else {
      details.dom_load_performance = 'needs_improvement';
      details.issues = details.issues || [];
      details.issues.push('DOM content loading too slow');
    }
    
    // Check for accessibility attributes
    const accessibilityScore = await this.page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
      let accessibleCount = 0;
      
      interactiveElements.forEach(el => {
        if (el.getAttribute('aria-label') || 
            el.getAttribute('aria-labelledby') || 
            el.textContent.trim() ||
            (el.tagName === 'INPUT' && document.querySelector(`label[for="${el.id}"]`))) {
          accessibleCount++;
        }
      });
      
      return interactiveElements.length > 0 ? accessibleCount / interactiveElements.length : 1;
    });
    
    if (accessibilityScore >= 0.8) {
      score += 0.4;
      details.accessibility_score = accessibilityScore;
    } else {
      details.accessibility_score = accessibilityScore;
      details.issues = details.issues || [];
      details.issues.push('Accessibility improvements needed');
    }
    
    // Check for proper error handling
    const errorHandling = await this.page.evaluate(() => {
      return document.querySelector('[role="alert"], .error, .warning') !== null;
    });
    
    if (errorHandling) {
      score += 0.3;
      details.error_handling = true;
    } else {
      details.error_handling = false;
    }
    
    this.evaluation.technical_performance = Math.min(score, 1.0);
    this.evaluation.details.technical_performance = details;
    
    console.log(`   Score: ${(score * 10).toFixed(1)}/10`);
    return score;
  }
  
  calculateTotalScore() {
    const weights = {
      visual_design: 0.30,
      ux_interaction: 0.30,
      laboratory_environment: 0.25,
      technical_performance: 0.15
    };
    
    const totalScore = (
      this.evaluation.visual_design * weights.visual_design * 10 +
      this.evaluation.ux_interaction * weights.ux_interaction * 10 +
      this.evaluation.laboratory_environment * weights.laboratory_environment * 10 +
      this.evaluation.technical_performance * weights.technical_performance * 10
    );
    
    return Math.round(totalScore * 10) / 10;
  }
}

// Test suite
test.describe('WikiGaiaLab /problems/new UI Healing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto(`${CONFIG.BASE_URL}${CONFIG.LOGIN_URL}`);
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', CONFIG.TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', CONFIG.TEST_PASSWORD);
    
    // Submit login
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")');
    
    // Wait for redirect to dashboard or success
    await page.waitForURL(/\/(dashboard|problems)/, { timeout: 15000 });
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`Interactive UI Healing - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      console.log(`\n🚀 Testing ${viewport.name} viewport...`);
      
      // Navigate to problems/new page
      await page.goto(`${CONFIG.BASE_URL}${CONFIG.TARGET_PAGE}`);
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Allow for any animations/dynamic content
      
      // Take screenshot
      const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `problems-new-${viewport.name}-${Date.now()}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        animations: 'disabled' // For consistent screenshots
      });
      
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      // Evaluate page
      const evaluator = new UIEvaluator(page);
      
      await evaluator.evaluateVisualDesign();
      await evaluator.evaluateUXInteraction();
      await evaluator.evaluateLaboratoryEnvironment();
      await evaluator.evaluateTechnicalPerformance();
      
      const totalScore = evaluator.calculateTotalScore();
      const status = totalScore >= CONFIG.SCORE_THRESHOLD ? 'PASS' : 'NEEDS_HEALING';
      
      console.log(`\n📊 EVALUATION SUMMARY - ${viewport.name.toUpperCase()}`);
      console.log('='.repeat(40));
      console.log(`🎨 Visual Design: ${(evaluator.evaluation.visual_design * 10).toFixed(1)}/10`);
      console.log(`⚡ UX & Interaction: ${(evaluator.evaluation.ux_interaction * 10).toFixed(1)}/10`);
      console.log(`🔧 Laboratory Environment: ${(evaluator.evaluation.laboratory_environment * 10).toFixed(1)}/10`);
      console.log(`⚙️  Technical Performance: ${(evaluator.evaluation.technical_performance * 10).toFixed(1)}/10`);
      console.log(`📊 TOTAL SCORE: ${totalScore}/10 (${status})`);
      
      // Save detailed evaluation
      const evaluationReport = {
        viewport: viewport.name,
        timestamp: new Date().toISOString(),
        screenshot: screenshotPath,
        scores: {
          visual_design: evaluator.evaluation.visual_design * 10,
          ux_interaction: evaluator.evaluation.ux_interaction * 10,
          laboratory_environment: evaluator.evaluation.laboratory_environment * 10,
          technical_performance: evaluator.evaluation.technical_performance * 10,
          total: totalScore
        },
        status: status,
        details: evaluator.evaluation.details
      };
      
      const reportPath = path.join(CONFIG.OUTPUT_DIR, `evaluation-${viewport.name}-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(evaluationReport, null, 2));
      
      console.log(`💾 Evaluation report saved: ${reportPath}`);
      
      // Interactive healing recommendations
      if (totalScore < CONFIG.SCORE_THRESHOLD) {
        console.log(`\n🩹 HEALING RECOMMENDATIONS:`);
        
        Object.entries(evaluator.evaluation.details).forEach(([category, details]) => {
          if (details.issues && details.issues.length > 0) {
            console.log(`\n${category.toUpperCase()}:`);
            details.issues.forEach(issue => {
              console.log(`  ❌ ${issue}`);
            });
          }
        });
        
        console.log(`\n🎯 Focus on improving scores below 8.0 to reach threshold.`);
      } else {
        console.log(`\n✅ Page meets quality standards for ${viewport.name}!`);
      }
      
      // Playwright assertions for automated testing
      expect(totalScore).toBeGreaterThanOrEqual(CONFIG.SCORE_THRESHOLD);
      expect(evaluator.evaluation.visual_design).toBeGreaterThan(0);
      expect(evaluator.evaluation.ux_interaction).toBeGreaterThan(0);
      expect(evaluator.evaluation.laboratory_environment).toBeGreaterThan(0);
      expect(evaluator.evaluation.technical_performance).toBeGreaterThan(0);
    });
  });

  test('Generate Comprehensive Batch Report', async ({ page }) => {
    console.log('\n📋 Generating comprehensive batch report...');
    
    // Read all evaluation files
    const evaluationFiles = fs.readdirSync(CONFIG.OUTPUT_DIR)
      .filter(file => file.startsWith('evaluation-') && file.endsWith('.json'));
    
    const evaluations = evaluationFiles.map(file => {
      const filePath = path.join(CONFIG.OUTPUT_DIR, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });
    
    // Calculate summary statistics
    const summary = {
      total_evaluations: evaluations.length,
      average_score: evaluations.reduce((sum, eval) => sum + eval.scores.total, 0) / evaluations.length,
      passing_evaluations: evaluations.filter(eval => eval.status === 'PASS').length,
      viewport_scores: {}
    };
    
    // Group by viewport
    ['mobile', 'tablet', 'desktop'].forEach(viewport => {
      const viewportEvals = evaluations.filter(eval => eval.viewport === viewport);
      if (viewportEvals.length > 0) {
        summary.viewport_scores[viewport] = {
          average_score: viewportEvals.reduce((sum, eval) => sum + eval.scores.total, 0) / viewportEvals.length,
          status: viewportEvals.every(eval => eval.status === 'PASS') ? 'PASS' : 'NEEDS_WORK'
        };
      }
    });
    
    // Generate markdown report
    const markdownReport = `
# WikiGaiaLab /problems/new - UI Healing Report

**Generated:** ${new Date().toISOString()}  
**Page:** /problems/new (Story Creation Form)  
**Mode:** Interactive Batch Healing

## Executive Summary

- **Total Evaluations:** ${summary.total_evaluations}
- **Average Score:** ${summary.average_score.toFixed(1)}/10
- **Passing Rate:** ${summary.passing_evaluations}/${summary.total_evaluations} (${((summary.passing_evaluations/summary.total_evaluations)*100).toFixed(1)}%)
- **Threshold:** ${CONFIG.SCORE_THRESHOLD}/10

## Viewport Results

${Object.entries(summary.viewport_scores).map(([viewport, data]) => 
`### ${viewport.charAt(0).toUpperCase() + viewport.slice(1)}
- **Score:** ${data.average_score.toFixed(1)}/10
- **Status:** ${data.status === 'PASS' ? '✅ PASS' : '⚠️ NEEDS WORK'}`
).join('\n\n')}

## Detailed Evaluations

${evaluations.map(eval => `
### ${eval.viewport.charAt(0).toUpperCase() + eval.viewport.slice(1)} - ${eval.scores.total}/10 ${eval.status === 'PASS' ? '✅' : '⚠️'}

- **Visual Design:** ${eval.scores.visual_design.toFixed(1)}/10
- **UX & Interaction:** ${eval.scores.ux_interaction.toFixed(1)}/10
- **Laboratory Environment:** ${eval.scores.laboratory_environment.toFixed(1)}/10
- **Technical Performance:** ${eval.scores.technical_performance.toFixed(1)}/10

**Issues Found:**
${Object.entries(eval.details).map(([category, details]) => 
  details.issues ? details.issues.map(issue => `- ${issue}`).join('\n') : ''
).join('\n')}
`).join('\n')}

## Recommendations

${summary.average_score >= CONFIG.TARGET_SCORE ? 
'✨ **Excellent!** Page meets excellence standards. Consider minor polish and optimization.' :
summary.average_score >= CONFIG.SCORE_THRESHOLD ?
'✅ **Good!** Page meets minimum standards. Continue improving towards excellence target.' :
'⚠️ **Needs Work!** Focus on critical issues to meet minimum standards.'}

---

*Generated by WikiGaiaLab Interactive UI Healing System*
`;

    const reportPath = path.join(CONFIG.OUTPUT_DIR, 'batch-healing-report.md');
    fs.writeFileSync(reportPath, markdownReport);
    
    console.log(`📄 Comprehensive report generated: ${reportPath}`);
    console.log(`📊 Summary: ${summary.average_score.toFixed(1)}/10 average across ${summary.total_evaluations} evaluations`);
  });
});