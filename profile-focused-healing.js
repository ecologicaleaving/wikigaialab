/**
 * WikiGaiaLab Profile Page Focused UI Healing
 * Special focus on /profile page with brand identity compliance
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  APPLICATION_URL: "http://localhost:3000",
  OUTPUT_DIR: "./ui-healing-profile-focus",
  TARGET_PAGE: "/profile",
  
  VIEWPORTS: [
    { width: 375, height: 667, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1920, height: 1080, name: "desktop" }
  ],

  AUTH: {
    email: "playwright-test@wikigaialab.com",
    password: "PlaywrightTest123!",
    loginUrl: "/test-login"
  },

  // Key pages to evaluate for comparison
  COMPARISON_PAGES: [
    { path: "/", name: "homepage", auth: false },
    { path: "/profile", name: "profile", auth: true },
    { path: "/dashboard", name: "dashboard", auth: true },
    { path: "/problems", name: "problems", auth: false }
  ]
};

class ProfileFocusedEvaluator {
  constructor() {
    this.results = [];
  }

  async evaluateWikiGaiaBrandCompliance(page, pageName, viewport) {
    console.log(`🔍 Evaluating ${pageName} (${viewport})...`);

    const evaluation = {
      page: pageName,
      viewport,
      scores: {},
      compliance: {},
      issues: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    try {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 1. WikiGaia Brand Colors
      evaluation.compliance.colors = await page.evaluate(() => {
        const wikiGaiaColors = ['#00B894', '#00695C', '#26A69A', '#4DB6AC', '#80CBC4'];
        const allElements = document.querySelectorAll('*');
        let colorMatches = 0;
        let totalElements = 0;

        allElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          const borderColor = styles.borderColor;
          
          totalElements++;
          
          wikiGaiaColors.forEach(wgColor => {
            if (bgColor.includes(wgColor) || textColor.includes(wgColor) || borderColor.includes(wgColor)) {
              colorMatches++;
            }
          });
        });

        return {
          wikiGaiaColorsFound: colorMatches > 0,
          colorUsageRatio: totalElements > 0 ? colorMatches / totalElements : 0,
          details: `${colorMatches} WikiGaia color matches in ${totalElements} elements`
        };
      });

      // 2. Laboratory Language & Microcopy
      evaluation.compliance.language = await page.evaluate(() => {
        const textContent = document.body.innerText.toLowerCase();
        
        const laboratoryTerms = [
          'laboratorio', 'artigiano', 'maestro', 'banco', 'quaderno', 
          'angolo', 'racconta', 'condividi', 'problema', 'soluzione',
          'comunità', 'insieme', 'cuore', 'consensi'
        ];

        const warmTerms = [
          'ciao', 'benvenuto', 'insieme', 'aiuta', 'grazie', 'bene'
        ];

        const foundLab = laboratoryTerms.filter(term => textContent.includes(term));
        const foundWarm = warmTerms.filter(term => textContent.includes(term));

        return {
          laboratoryLanguage: foundLab.length >= 3,
          warmTone: foundWarm.length >= 2,
          laboratoryTermsFound: foundLab,
          warmTermsFound: foundWarm,
          totalTextLength: textContent.length
        };
      });

      // 3. Interactive Elements (Heart System, Buttons)
      evaluation.compliance.interactivity = await page.evaluate(() => {
        const heartElements = document.querySelectorAll('[class*="heart"], [aria-label*="cuore"], [aria-label*="heart"]');
        const buttons = document.querySelectorAll('button, [role="button"]');
        const links = document.querySelectorAll('a[href]');
        
        let accessibleButtons = 0;
        buttons.forEach(btn => {
          const hasLabel = btn.getAttribute('aria-label') || btn.innerText.trim();
          const hasProperRole = btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button';
          if (hasLabel && hasProperRole) accessibleButtons++;
        });

        return {
          heartSystemPresent: heartElements.length > 0,
          buttonCount: buttons.length,
          accessibleButtonCount: accessibleButtons,
          linkCount: links.length,
          accessibilityRatio: buttons.length > 0 ? accessibleButtons / buttons.length : 1
        };
      });

      // 4. WikiGaia Logo Presence and Placement
      evaluation.compliance.branding = await page.evaluate(() => {
        const logoSelectors = [
          'img[src*="wikigaia"]', 'img[alt*="wikigaia"]', 'img[alt*="WikiGaia"]',
          '.logo', '[class*="logo"]', 'svg[class*="logo"]'
        ];

        let logoFound = false;
        let logoDetails = {};

        for (const selector of logoSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            logoFound = true;
            const rect = element.getBoundingClientRect();
            logoDetails = {
              selector,
              position: { top: rect.top, left: rect.left },
              size: { width: rect.width, height: rect.height },
              inHeader: rect.top < 100
            };
            break;
          }
        }

        return {
          logoPresent: logoFound,
          logoDetails,
          headerElements: document.querySelectorAll('header, [role="banner"]').length
        };
      });

      // 5. Typography (Inter font compliance)
      evaluation.compliance.typography = await page.evaluate(() => {
        const bodyFont = window.getComputedStyle(document.body).fontFamily.toLowerCase();
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        const fontSizes = Array.from(headings).map(h => {
          const size = parseFloat(window.getComputedStyle(h).fontSize);
          return size;
        });

        return {
          interFontUsed: bodyFont.includes('inter') || bodyFont.includes('roboto'),
          fontFamily: bodyFont,
          headingCount: headings.length,
          fontSizeRange: fontSizes.length > 0 ? {
            min: Math.min(...fontSizes),
            max: Math.max(...fontSizes)
          } : null
        };
      });

      // 6. Layout and Responsiveness
      evaluation.compliance.layout = await page.evaluate(() => {
        const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
        const gridElements = document.querySelectorAll('[class*="grid"], [class*="flex"]');
        const containerElements = document.querySelectorAll('[class*="container"], [class*="max-w"]');

        return {
          responsiveClassesPresent: responsiveElements.length > 0,
          gridSystemUsed: gridElements.length > 0,
          containerSystemUsed: containerElements.length > 0,
          responsiveElementCount: responsiveElements.length
        };
      });

      // Calculate scores
      evaluation.scores = {
        colors: this.scoreColors(evaluation.compliance.colors),
        language: this.scoreLanguage(evaluation.compliance.language),
        interactivity: this.scoreInteractivity(evaluation.compliance.interactivity),
        branding: this.scoreBranding(evaluation.compliance.branding),
        typography: this.scoreTypography(evaluation.compliance.typography),
        layout: this.scoreLayout(evaluation.compliance.layout)
      };

      // Overall score
      const scoreValues = Object.values(evaluation.scores);
      evaluation.overallScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10;

      // Generate issues and recommendations
      evaluation.issues = this.generateIssues(evaluation);
      evaluation.recommendations = this.generateRecommendations(evaluation);

      console.log(`📊 ${pageName} (${viewport}) scored: ${evaluation.overallScore}/10`);

    } catch (error) {
      console.error(`❌ Error evaluating ${pageName}:`, error.message);
      evaluation.error = error.message;
      evaluation.overallScore = 0;
    }

    return evaluation;
  }

  scoreColors(colorCompliance) {
    if (colorCompliance.wikiGaiaColorsFound) return 9;
    return 3; // Major brand color issue
  }

  scoreLanguage(languageCompliance) {
    let score = 5;
    if (languageCompliance.laboratoryLanguage) score += 3;
    if (languageCompliance.warmTone) score += 2;
    return Math.min(score, 10);
  }

  scoreInteractivity(interactivity) {
    let score = 5;
    if (interactivity.heartSystemPresent) score += 2;
    if (interactivity.accessibilityRatio > 0.8) score += 2;
    if (interactivity.buttonCount > 0) score += 1;
    return Math.min(score, 10);
  }

  scoreBranding(branding) {
    let score = 5;
    if (branding.logoPresent) score += 3;
    if (branding.logoDetails.inHeader) score += 1;
    if (branding.headerElements > 0) score += 1;
    return Math.min(score, 10);
  }

  scoreTypography(typography) {
    let score = 5;
    if (typography.interFontUsed) score += 3;
    if (typography.headingCount > 0) score += 1;
    if (typography.fontSizeRange && typography.fontSizeRange.min >= 14) score += 1;
    return Math.min(score, 10);
  }

  scoreLayout(layout) {
    let score = 5;
    if (layout.responsiveClassesPresent) score += 2;
    if (layout.gridSystemUsed) score += 2;
    if (layout.containerSystemUsed) score += 1;
    return Math.min(score, 10);
  }

  generateIssues(evaluation) {
    const issues = [];
    
    if (evaluation.scores.colors < 7) {
      issues.push("🎨 WikiGaia brand colors (#00B894, #00695C) not prominently used");
    }
    if (evaluation.scores.language < 7) {
      issues.push("💬 Laboratory artisan language missing (should include 'laboratorio', 'quaderno', 'angolo')");
    }
    if (evaluation.scores.interactivity < 7) {
      issues.push("❤️ Heart-based voting system or interactive elements not implemented");
    }
    if (evaluation.scores.branding < 7) {
      issues.push("🏷️ WikiGaia logo missing or not properly placed in header");
    }
    if (evaluation.scores.typography < 7) {
      issues.push("📝 Inter font family not implemented (using " + evaluation.compliance.typography.fontFamily + ")");
    }
    if (evaluation.scores.layout < 7) {
      issues.push("📱 Responsive design classes missing (Tailwind responsive utilities)");
    }

    return issues;
  }

  generateRecommendations(evaluation) {
    const recommendations = [];
    
    if (evaluation.scores.colors < 8) {
      recommendations.push("🎨 Implement WikiGaia primary color (#00B894) for buttons and key actions");
    }
    if (evaluation.scores.language < 8) {
      recommendations.push("💬 Add laboratory terminology: 'Il Mio Quaderno' for profile, 'Il Mio Angolo' for dashboard");
    }
    if (evaluation.scores.interactivity < 8) {
      recommendations.push("❤️ Implement heart-based consensus system with smooth animations");
    }
    if (evaluation.scores.branding < 8) {
      recommendations.push("🏷️ Add WikiGaia logo to header with proper spacing (24px minimum)");
    }
    if (evaluation.scores.typography < 8) {
      recommendations.push("📝 Apply Inter font family as primary typography choice");
    }
    if (evaluation.scores.layout < 8) {
      recommendations.push("📱 Add responsive Tailwind classes (sm:, md:, lg:) for better mobile experience");
    }

    if (evaluation.overallScore >= 8) {
      recommendations.push("✅ Page meets WikiGaia brand identity standards");
    } else {
      recommendations.push(`🔧 Overall brand compliance needs improvement (${evaluation.overallScore}/10)`);
    }

    return recommendations;
  }
}

class ProfileHealingSystem {
  constructor() {
    this.evaluator = new ProfileFocusedEvaluator();
    this.results = [];
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing Profile-Focused UI Healing System...');
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    
    this.browser = await chromium.launch({ headless: true });
    console.log('✅ Browser launched');
  }

  async authenticate(page) {
    try {
      console.log('🔐 Authenticating...');
      
      await page.goto(`${CONFIG.APPLICATION_URL}${CONFIG.AUTH.loginUrl}`);
      await page.waitForLoadState('networkidle');
      
      // Try different login field selectors
      const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', '[placeholder*="email"]'];
      const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password', '[placeholder*="password"]'];
      
      let emailField = null;
      let passwordField = null;
      
      for (const selector of emailSelectors) {
        try {
          emailField = page.locator(selector).first();
          if (await emailField.isVisible({ timeout: 1000 })) break;
        } catch (e) { /* continue */ }
      }
      
      for (const selector of passwordSelectors) {
        try {
          passwordField = page.locator(selector).first();
          if (await passwordField.isVisible({ timeout: 1000 })) break;
        } catch (e) { /* continue */ }
      }

      if (emailField && passwordField && await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill(CONFIG.AUTH.email);
        await passwordField.fill(CONFIG.AUTH.password);
        
        // Find submit button
        const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Accedi"), button:has-text("Entra")').first();
        await submitButton.click();
        
        await page.waitForLoadState('networkidle');
        console.log('✅ Authentication successful');
        return true;
      }
      
      console.log('⚠️ Login form not found or not visible');
      return false;
    } catch (error) {
      console.log(`⚠️ Authentication failed: ${error.message}`);
      return false;
    }
  }

  async captureAndEvaluate(pageConfig, viewport) {
    const page = await this.browser.newPage({
      viewport: { width: viewport.width, height: viewport.height }
    });

    try {
      console.log(`\n📱 Processing ${pageConfig.name} (${viewport.name})`);

      // Authenticate if needed
      if (pageConfig.auth) {
        const authSuccess = await this.authenticate(page);
        if (!authSuccess) {
          console.log(`⚠️ Skipping ${pageConfig.name} - authentication failed`);
          return null;
        }
      }

      // Navigate to target page
      await page.goto(`${CONFIG.APPLICATION_URL}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(3000);

      // Capture screenshot
      const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `${pageConfig.name}-${viewport.name}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true
      });

      console.log(`📸 Screenshot: ${screenshotPath}`);

      // Evaluate brand compliance
      const evaluation = await this.evaluator.evaluateWikiGaiaBrandCompliance(page, pageConfig.name, viewport.name);
      evaluation.screenshotPath = screenshotPath;
      evaluation.url = `${CONFIG.APPLICATION_URL}${pageConfig.path}`;

      return evaluation;

    } catch (error) {
      console.error(`❌ Error processing ${pageConfig.name} (${viewport.name}):`, error.message);
      return {
        page: pageConfig.name,
        viewport: viewport.name,
        error: error.message,
        overallScore: 0
      };
    } finally {
      await page.close();
    }
  }

  async processAllPages() {
    console.log(`\n📋 Processing ${CONFIG.COMPARISON_PAGES.length} pages across ${CONFIG.VIEWPORTS.length} viewports...\n`);

    for (const pageConfig of CONFIG.COMPARISON_PAGES) {
      console.log(`\n--- ${pageConfig.name.toUpperCase()} ${pageConfig.name === 'profile' ? '(🎯 FOCUS PAGE)' : ''} ---`);
      
      for (const viewport of CONFIG.VIEWPORTS) {
        const result = await this.captureAndEvaluate(pageConfig, viewport);
        if (result) {
          this.results.push(result);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async generateReport() {
    console.log('\n📄 Generating profile-focused healing report...');

    const profileResults = this.results.filter(r => r.page === 'profile');
    const otherResults = this.results.filter(r => r.page !== 'profile');

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        focusPage: CONFIG.TARGET_PAGE,
        totalEvaluations: this.results.length,
        profileEvaluations: profileResults.length
      },
      profileAnalysis: this.analyzeProfilePage(profileResults),
      comparisonAnalysis: this.compareWithOtherPages(profileResults, otherResults),
      recommendations: this.generateGlobalRecommendations(profileResults),
      detailedResults: this.results
    };

    // Save reports
    const jsonPath = path.join(CONFIG.OUTPUT_DIR, 'profile-healing-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    const mdPath = path.join(CONFIG.OUTPUT_DIR, 'PROFILE-HEALING-REPORT.md');
    await fs.writeFile(mdPath, this.generateMarkdownReport(report));

    console.log(`✅ Reports generated:`);
    console.log(`   📊 JSON: ${jsonPath}`);
    console.log(`   📝 Markdown: ${mdPath}`);

    return report;
  }

  analyzeProfilePage(profileResults) {
    if (profileResults.length === 0) {
      return {
        status: 'NOT_ACCESSIBLE',
        message: 'Profile page could not be accessed or evaluated',
        averageScore: 0
      };
    }

    const avgScore = profileResults.reduce((sum, r) => sum + r.overallScore, 0) / profileResults.length;
    const allIssues = profileResults.flatMap(r => r.issues || []);
    const allRecommendations = profileResults.flatMap(r => r.recommendations || []);

    return {
      status: avgScore >= 8 ? 'EXCELLENT' : avgScore >= 6 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      averageScore: Math.round(avgScore * 10) / 10,
      viewportResults: profileResults.map(r => ({
        viewport: r.viewport,
        score: r.overallScore,
        topIssue: r.issues?.[0] || 'No issues found'
      })),
      commonIssues: this.findMostCommonItems(allIssues),
      priorityRecommendations: this.findMostCommonItems(allRecommendations)
    };
  }

  compareWithOtherPages(profileResults, otherResults) {
    if (profileResults.length === 0) return { available: false };

    const profileAvg = profileResults.reduce((sum, r) => sum + r.overallScore, 0) / profileResults.length;
    
    const pageComparisons = {};
    CONFIG.COMPARISON_PAGES.filter(p => p.name !== 'profile').forEach(pageConfig => {
      const pageResults = otherResults.filter(r => r.page === pageConfig.name);
      if (pageResults.length > 0) {
        const pageAvg = pageResults.reduce((sum, r) => sum + r.overallScore, 0) / pageResults.length;
        pageComparisons[pageConfig.name] = {
          averageScore: Math.round(pageAvg * 10) / 10,
          comparison: profileAvg > pageAvg ? 'PROFILE_BETTER' : profileAvg < pageAvg ? 'PROFILE_WORSE' : 'EQUAL',
          difference: Math.round((profileAvg - pageAvg) * 10) / 10
        };
      }
    });

    return {
      available: true,
      profileScore: Math.round(profileAvg * 10) / 10,
      comparisons: pageComparisons
    };
  }

  generateGlobalRecommendations(profileResults) {
    const recommendations = [];

    if (profileResults.length === 0) {
      recommendations.push('🔴 CRITICAL: Profile page (/profile) is not accessible - check authentication system');
      recommendations.push('🔧 Fix authentication flow to enable profile page testing');
      return recommendations;
    }

    const avgScore = profileResults.reduce((sum, r) => sum + r.overallScore, 0) / profileResults.length;

    if (avgScore >= 8) {
      recommendations.push(`✅ Profile page meets WikiGaia brand standards (${Math.round(avgScore * 10) / 10}/10)`);
    } else {
      recommendations.push(`🔴 Profile page needs brand identity improvements (${Math.round(avgScore * 10) / 10}/10)`);
    }

    // Add specific recommendations based on common issues
    const allIssues = profileResults.flatMap(r => r.issues || []);
    const commonIssues = this.findMostCommonItems(allIssues);
    
    commonIssues.slice(0, 3).forEach(issue => {
      recommendations.push(`🔧 Priority fix: ${issue}`);
    });

    return recommendations;
  }

  findMostCommonItems(items) {
    const counts = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .map(([item]) => item);
  }

  generateMarkdownReport(report) {
    const md = [];

    md.push('# WikiGaiaLab Profile Page Brand Identity Report');
    md.push(`*Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}*`);
    md.push(`*Focus: Profile page (/profile) brand compliance analysis*\n`);

    // Profile Analysis
    md.push('## 🎯 Profile Page Analysis\n');
    
    if (report.profileAnalysis.status === 'NOT_ACCESSIBLE') {
      md.push('❌ **Profile page could not be accessed**');
      md.push('- Authentication system needs to be fixed');
      md.push('- Test login credentials may be invalid');
      md.push('- Page may require different authentication flow\n');
    } else {
      md.push(`**Overall Status**: ${report.profileAnalysis.status}`);
      md.push(`**Average Score**: ${report.profileAnalysis.averageScore}/10\n`);

      md.push('### Viewport Results\n');
      report.profileAnalysis.viewportResults.forEach(vp => {
        md.push(`- **${vp.viewport}**: ${vp.score}/10 - ${vp.topIssue}`);
      });
      md.push('');

      if (report.profileAnalysis.commonIssues.length > 0) {
        md.push('### Common Issues\n');
        report.profileAnalysis.commonIssues.forEach((issue, i) => {
          md.push(`${i + 1}. ${issue}`);
        });
        md.push('');
      }
    }

    // Comparison with Other Pages
    if (report.comparisonAnalysis.available) {
      md.push('## 📊 Comparison with Other Pages\n');
      md.push(`**Profile Score**: ${report.comparisonAnalysis.profileScore}/10\n`);
      
      Object.entries(report.comparisonAnalysis.comparisons).forEach(([pageName, comparison]) => {
        const symbol = comparison.comparison === 'PROFILE_BETTER' ? '✅' : 
                     comparison.comparison === 'PROFILE_WORSE' ? '❌' : '➖';
        md.push(`- **${pageName}**: ${comparison.averageScore}/10 ${symbol} (${comparison.difference > 0 ? '+' : ''}${comparison.difference})`);
      });
      md.push('');
    }

    // Recommendations
    md.push('## 🔧 Recommendations\n');
    report.recommendations.forEach(rec => {
      md.push(`- ${rec}`);
    });
    md.push('');

    // Screenshots
    md.push('## 📸 Screenshots Captured\n');
    this.results.forEach(result => {
      if (result.screenshotPath) {
        md.push(`- ${result.page} (${result.viewport}): \`${path.basename(result.screenshotPath)}\``);
      }
    });

    md.push('\n---\n');
    md.push('*Report generated by WikiGaiaLab Profile-Focused UI Healing System*');

    return md.join('\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Main execution
async function main() {
  const healingSystem = new ProfileHealingSystem();
  
  try {
    await healingSystem.initialize();
    await healingSystem.processAllPages();
    const report = await healingSystem.generateReport();
    
    console.log('\n🎉 Profile-Focused UI Healing completed!');
    console.log(`\n📊 Profile Page Summary:`);
    
    if (report.profileAnalysis.status === 'NOT_ACCESSIBLE') {
      console.log('   Status: ❌ NOT ACCESSIBLE');
      console.log('   Issue: Authentication or page loading problem');
    } else {
      console.log(`   Status: ${report.profileAnalysis.status}`);
      console.log(`   Score: ${report.profileAnalysis.averageScore}/10`);
      console.log(`   Viewports Tested: ${report.profileAnalysis.viewportResults.length}`);
    }
    
  } catch (error) {
    console.error('❌ Profile healing failed:', error);
    process.exit(1);
  } finally {
    await healingSystem.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProfileHealingSystem };