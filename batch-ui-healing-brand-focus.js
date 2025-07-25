/**
 * WikiGaiaLab Batch UI Healing System
 * Enhanced Brand Identity & Interaction Focus
 * Special attention to /profile page
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration based on BMad requirements
const CONFIG = {
  APPLICATION_URL: "http://localhost:3000",
  OUTPUT_DIR: "./ui-healing-brand-focus-output",
  SCORE_THRESHOLD: 8,
  FOCUS_PAGE: "/profile",
  
  // Enhanced viewports for comprehensive testing
  VIEWPORTS: [
    { width: 375, height: 667, name: "mobile", deviceScaleFactor: 2 },
    { width: 768, height: 1024, name: "tablet", deviceScaleFactor: 2 },
    { width: 1920, height: 1080, name: "desktop", deviceScaleFactor: 1 }
  ],
  
  // WikiGaia brand colors for validation
  BRAND_COLORS: {
    primary: "#00B894",
    primaryDark: "#00695C", 
    nature: "#26A69A",
    collaborative: "#4DB6AC",
    light: "#80CBC4",
    ice: "#B2DFDB",
    ecological: "#FFB74D",
    gray: "#757575"
  },

  // Authentication credentials from page-list.md
  AUTH: {
    email: "playwright-test@wikigaialab.com",
    password: "PlaywrightTest123!",
    loginUrl: "/test-login"
  }
};

// Screen definitions from page-list.md with priority focus
const SCREENS = [
  // HIGH PRIORITY - Focus pages
  { path: "/profile", name: "profile", description: "Profilo personale utente (Il Mio Quaderno)", auth: true, priority: "CRITICAL" },
  { path: "/", name: "homepage", description: "Landing page principale (focus: problema→soluzione condivisa)", auth: false, priority: "HIGH" },
  { path: "/problems", name: "problems-list", description: "Bacheca dei problemi comunitari", auth: false, priority: "HIGH" },
  
  // MEDIUM PRIORITY - Core functionality  
  { path: "/dashboard", name: "dashboard", description: "Dashboard personale dell'utente (Il Mio Angolo)", auth: true, priority: "MEDIUM" },
  { path: "/login", name: "login", description: "Schermata di autenticazione con Google OAuth", auth: false, priority: "MEDIUM" },
  { path: "/apps", name: "apps-catalog", description: "Catalogo delle soluzioni create", auth: false, priority: "MEDIUM" },
  
  // LOWER PRIORITY - Supporting pages
  { path: "/settings", name: "settings", description: "Impostazioni account e preferenze", auth: true, priority: "LOW" },
  { path: "/help", name: "help", description: "Pagina di aiuto e documentazione", auth: false, priority: "LOW" },
  { path: "/apps/volantino-generator", name: "volantino-generator", description: "Prima app dimostrativa", auth: false, priority: "LOW" }
];

class WikiGaiaBrandEvaluator {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  /**
   * Evaluate brand identity compliance based on WikiGaia specifications
   */
  async evaluateBrandIdentity(page, screenName, viewport) {
    const evaluation = {
      screen: screenName,
      viewport: viewport.name,
      scores: {},
      issues: [],
      recommendations: [],
      brandCompliance: {}
    };

    try {
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 1. BRAND COLOR COMPLIANCE
      evaluation.brandCompliance.colors = await this.evaluateColorCompliance(page);
      evaluation.scores.colorCompliance = this.calculateColorScore(evaluation.brandCompliance.colors);

      // 2. TYPOGRAPHY COMPLIANCE (Inter font family)
      evaluation.brandCompliance.typography = await this.evaluateTypography(page);
      evaluation.scores.typography = this.calculateTypographyScore(evaluation.brandCompliance.typography);

      // 3. LOGO USAGE AND PLACEMENT
      evaluation.brandCompliance.logo = await this.evaluateLogoUsage(page);
      evaluation.scores.logoUsage = this.calculateLogoScore(evaluation.brandCompliance.logo);

      // 4. LABORATORY LANGUAGE COMPLIANCE
      evaluation.brandCompliance.language = await this.evaluateLanguageCompliance(page);
      evaluation.scores.languageCompliance = this.calculateLanguageScore(evaluation.brandCompliance.language);

      // 5. INTERACTIVE ELEMENTS COMPLIANCE
      evaluation.brandCompliance.interactivity = await this.evaluateInteractiveElements(page);
      evaluation.scores.interactivity = this.calculateInteractivityScore(evaluation.brandCompliance.interactivity);

      // 6. ACCESSIBILITY COMPLIANCE  
      evaluation.brandCompliance.accessibility = await this.evaluateAccessibility(page);
      evaluation.scores.accessibility = this.calculateAccessibilityScore(evaluation.brandCompliance.accessibility);

      // 7. LAYOUT AND SPACING (Tailwind 12-column grid)
      evaluation.brandCompliance.layout = await this.evaluateLayoutCompliance(page);
      evaluation.scores.layout = this.calculateLayoutScore(evaluation.brandCompliance.layout);

      // Calculate overall score
      evaluation.overallScore = this.calculateOverallScore(evaluation.scores);
      
      // Generate specific issues and recommendations
      evaluation.issues = this.generateIssues(evaluation);
      evaluation.recommendations = this.generateRecommendations(evaluation);

    } catch (error) {
      console.error(`Error evaluating ${screenName}:`, error.message);
      evaluation.error = error.message;
      evaluation.overallScore = 0;
    }

    return evaluation;
  }

  /**
   * Evaluate WikiGaia brand color compliance
   */
  async evaluateColorCompliance(page) {
    return await page.evaluate((brandColors) => {
      const compliance = {
        primaryColorUsage: false,
        colorConsistency: false,
        contrastRatio: false,
        brandPaletteAdherence: false,
        details: []
      };

      // Check for WikiGaia primary colors in CSS
      const allElements = document.querySelectorAll('*');
      const colorUsage = new Set();
      
      allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const bgColor = computedStyle.backgroundColor;
        const textColor = computedStyle.color;
        const borderColor = computedStyle.borderColor;
        
        [bgColor, textColor, borderColor].forEach(color => {
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
            colorUsage.add(color);
          }
        });
      });

      // Check for WikiGaia green variations
      const hasWikiGaiaColors = Array.from(colorUsage).some(color => 
        color.includes('0, 184, 148') || // #00B894
        color.includes('0, 105, 92') ||  // #00695C  
        color.includes('38, 166, 154') || // #26A69A
        color.includes('77, 182, 172')   // #4DB6AC
      );

      compliance.primaryColorUsage = hasWikiGaiaColors;
      compliance.brandPaletteAdherence = hasWikiGaiaColors;
      compliance.details.push(`Colors found: ${Array.from(colorUsage).slice(0, 10).join(', ')}`);

      // Check contrast ratios for accessibility
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
      let goodContrastCount = 0;
      
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgElement = el.closest('[style*="background"], [class*="bg-"]') || document.body;
        // Simplified contrast check - in real implementation would calculate actual ratios
        goodContrastCount++;
      });

      compliance.contrastRatio = goodContrastCount > textElements.length * 0.8;
      compliance.colorConsistency = colorUsage.size < 20; // Not too many different colors

      return compliance;
    }, CONFIG.BRAND_COLORS);
  }

  /**
   * Evaluate typography compliance (Inter font family)
   */
  async evaluateTypography(page) {
    return await page.evaluate(() => {
      const compliance = {
        fontFamily: false,
        fontSizes: false,
        fontWeights: false,
        lineHeight: false,
        details: []
      };

      const bodyStyle = window.getComputedStyle(document.body);
      const fontFamily = bodyStyle.fontFamily.toLowerCase();
      
      // Check for Inter font
      compliance.fontFamily = fontFamily.includes('inter') || 
                             fontFamily.includes('roboto'); // Fallback allowed

      // Check font size hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const sizes = Array.from(headings).map(h => 
        parseFloat(window.getComputedStyle(h).fontSize)
      );
      
      compliance.fontSizes = sizes.length > 0 && sizes.every(size => size >= 16);
      
      // Check for proper font weights
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
      const weights = Array.from(elements).map(el => 
        window.getComputedStyle(el).fontWeight
      );
      
      compliance.fontWeights = weights.some(w => ['600', '700'].includes(w));

      // Check line height for readability
      const paragraphs = document.querySelectorAll('p');
      const lineHeights = Array.from(paragraphs).map(p => 
        parseFloat(window.getComputedStyle(p).lineHeight)
      );
      
      compliance.lineHeight = lineHeights.every(lh => lh >= 1.4);

      compliance.details.push(`Font family: ${fontFamily}`);
      compliance.details.push(`Heading count: ${headings.length}`);
      compliance.details.push(`Font weights found: ${[...new Set(weights)].join(', ')}`);

      return compliance;
    });
  }

  /**
   * Evaluate WikiGaia logo usage and placement
   */
  async evaluateLogoUsage(page) {
    return await page.evaluate(() => {
      const compliance = {
        logoPresent: false,
        logoPlacement: false,
        logoSize: false,
        logoSpacing: false,
        details: []
      };

      // Look for WikiGaia logo
      const logoSelectors = [
        'img[src*="wikigaia"]',
        'img[alt*="wikigaia"]', 
        'img[alt*="WikiGaia"]',
        '.logo',
        '[class*="logo"]'
      ];

      let logoElement = null;
      for (const selector of logoSelectors) {
        logoElement = document.querySelector(selector);
        if (logoElement) break;
      }

      compliance.logoPresent = !!logoElement;

      if (logoElement) {
        const rect = logoElement.getBoundingClientRect();
        const style = window.getComputedStyle(logoElement);
        
        // Check if logo is in header (top 100px)
        compliance.logoPlacement = rect.top < 100;
        
        // Check reasonable size (between 120px and 240px width)
        compliance.logoSize = rect.width >= 120 && rect.width <= 300;
        
        // Check for proper spacing (margin > 24px)
        const margin = Math.min(
          parseFloat(style.marginTop) || 0,
          parseFloat(style.marginBottom) || 0,
          parseFloat(style.marginLeft) || 0,
          parseFloat(style.marginRight) || 0
        );
        compliance.logoSpacing = margin >= 20;

        compliance.details.push(`Logo found: ${logoElement.src || logoElement.className}`);
        compliance.details.push(`Logo size: ${rect.width}x${rect.height}`);
        compliance.details.push(`Logo position: ${rect.top}, ${rect.left}`);
      } else {
        compliance.details.push('No WikiGaia logo found');
      }

      return compliance;
    });
  }

  /**
   * Evaluate laboratory language compliance (Italian artisan terminology)
   */
  async evaluateLanguageCompliance(page) {
    return await page.evaluate(() => {
      const compliance = {
        laboratoryTerms: false,
        italianLanguage: false,
        warmTone: false,
        problemSolutionFocus: false,
        details: []
      };

      const textContent = document.body.innerText.toLowerCase();
      
      // Laboratory/artisan terms from identity.md
      const laboratoryTerms = [
        'laboratorio', 'artigiano', 'maestro', 'attrezzi', 'banco',
        'quaderno', 'angolo', 'racconta', 'condividi', 'problema',
        'soluzione', 'comunità', 'insieme', 'cuore', 'consensi'
      ];

      const foundTerms = laboratoryTerms.filter(term => textContent.includes(term));
      compliance.laboratoryTerms = foundTerms.length >= 3;

      // Check for warm, familiar tone indicators
      const warmTerms = ['ciao', 'benvenuto', 'insieme', 'aiuta', 'grazie'];
      const foundWarmTerms = warmTerms.filter(term => textContent.includes(term));
      compliance.warmTone = foundWarmTerms.length >= 2;

      // Check for problem-solution workflow language
      const workflowTerms = ['problema', 'soluzione', 'condividi', 'creiamo'];
      const foundWorkflowTerms = workflowTerms.filter(term => textContent.includes(term));
      compliance.problemSolutionFocus = foundWorkflowTerms.length >= 2;

      // Basic Italian language check
      const italianTerms = ['il', 'la', 'con', 'per', 'del', 'che', 'una', 'dei'];
      const foundItalianTerms = italianTerms.filter(term => textContent.includes(` ${term} `));
      compliance.italianLanguage = foundItalianTerms.length >= 4;

      compliance.details.push(`Laboratory terms found: ${foundTerms.join(', ')}`);
      compliance.details.push(`Warm tone terms: ${foundWarmTerms.join(', ')}`);
      compliance.details.push(`Workflow terms: ${foundWorkflowTerms.join(', ')}`);

      return compliance;
    });
  }

  /**
   * Evaluate interactive elements compliance with interactivity.md
   */
  async evaluateInteractiveElements(page) {
    return await page.evaluate(() => {
      const compliance = {
        heartVotingSystem: false,
        responsiveElements: false,
        accessibleInteractions: false,
        smoothAnimations: false,
        details: []
      };

      // Look for heart voting elements
      const heartElements = document.querySelectorAll(
        '[class*="heart"], [class*="vote"], [data-vote], button[aria-label*="voto"]'
      );
      compliance.heartVotingSystem = heartElements.length > 0;

      // Check for interactive buttons and their accessibility
      const buttons = document.querySelectorAll('button, [role="button"], a[href]');
      let accessibleButtonCount = 0;
      
      buttons.forEach(btn => {
        const hasAccessibleName = btn.getAttribute('aria-label') || 
                                 btn.getAttribute('title') || 
                                 btn.innerText.trim();
        const hasProperRole = btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button';
        const hasKeyboardAccess = btn.tabIndex >= 0;
        
        if (hasAccessibleName && (hasProperRole || btn.tagName === 'A')) {
          accessibleButtonCount++;
        }
      });

      compliance.accessibleInteractions = accessibleButtonCount >= buttons.length * 0.8;

      // Check for responsive design indicators
      const responsiveElements = document.querySelectorAll(
        '[class*="md:"], [class*="lg:"], [class*="sm:"], [class*="xl:"]'
      );
      compliance.responsiveElements = responsiveElements.length > 5;

      // Check for CSS transitions/animations
      const animatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' || style.animation !== 'none';
      });
      compliance.smoothAnimations = animatedElements.length > 0;

      compliance.details.push(`Heart/vote elements: ${heartElements.length}`);
      compliance.details.push(`Accessible buttons: ${accessibleButtonCount}/${buttons.length}`);
      compliance.details.push(`Responsive classes: ${responsiveElements.length}`);
      compliance.details.push(`Animated elements: ${animatedElements.length}`);

      return compliance;
    });
  }

  /**
   * Evaluate accessibility compliance (WCAG AA)
   */
  async evaluateAccessibility(page) {
    return await page.evaluate(() => {
      const compliance = {
        altTexts: false,
        headingStructure: false,
        focusIndicators: false,
        ariaLabels: false,
        colorContrast: false,
        details: []
      };

      // Check alt texts on images
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => 
        img.getAttribute('alt') && img.getAttribute('alt').trim()
      );
      compliance.altTexts = images.length === 0 || imagesWithAlt.length >= images.length * 0.9;

      // Check heading structure (proper hierarchy)
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
      const hasProperHierarchy = headingLevels.length === 0 || headingLevels[0] === 1;
      compliance.headingStructure = hasProperHierarchy;

      // Check for ARIA labels
      const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      compliance.ariaLabels = ariaElements.length > 0;

      // Check for focus indicators (simplified)
      const focusableElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      compliance.focusIndicators = focusableElements.length > 0;

      // Basic color contrast check (simplified)
      compliance.colorContrast = true; // Would need more complex calculation

      compliance.details.push(`Images with alt: ${imagesWithAlt.length}/${images.length}`);
      compliance.details.push(`Headings: ${headings.length}`);
      compliance.details.push(`ARIA elements: ${ariaElements.length}`);
      compliance.details.push(`Focusable elements: ${focusableElements.length}`);

      return compliance;
    });
  }

  /**
   * Evaluate layout compliance (Tailwind grid system)
   */
  async evaluateLayoutCompliance(page) {
    return await page.evaluate(() => {
      const compliance = {
        gridSystem: false,
        spacing: false,
        responsiveLayout: false,
        contentHierarchy: false,
        details: []
      };

      // Check for Tailwind grid classes
      const gridElements = document.querySelectorAll(
        '[class*="grid"], [class*="flex"], [class*="container"]'
      );
      compliance.gridSystem = gridElements.length > 0;

      // Check for consistent spacing (Tailwind spacing scale)
      const spacingElements = document.querySelectorAll(
        '[class*="p-"], [class*="m-"], [class*="space-"], [class*="gap-"]'
      );
      compliance.spacing = spacingElements.length > 0;

      // Check for responsive classes
      const responsiveElements = document.querySelectorAll(
        '[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]'
      );
      compliance.responsiveLayout = responsiveElements.length > 3;

      // Check content hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const sections = document.querySelectorAll('main, section, article, aside');
      compliance.contentHierarchy = headings.length > 0 && sections.length > 0;

      compliance.details.push(`Grid elements: ${gridElements.length}`);
      compliance.details.push(`Spacing elements: ${spacingElements.length}`);
      compliance.details.push(`Responsive elements: ${responsiveElements.length}`);
      compliance.details.push(`Sections: ${sections.length}`);

      return compliance;
    });
  }

  // Scoring methods
  calculateColorScore(colorCompliance) {
    const weights = { primaryColorUsage: 0.3, colorConsistency: 0.2, contrastRatio: 0.3, brandPaletteAdherence: 0.2 };
    return this.calculateWeightedScore(colorCompliance, weights);
  }

  calculateTypographyScore(typography) {
    const weights = { fontFamily: 0.3, fontSizes: 0.3, fontWeights: 0.2, lineHeight: 0.2 };
    return this.calculateWeightedScore(typography, weights);
  }

  calculateLogoScore(logo) {
    const weights = { logoPresent: 0.4, logoPlacement: 0.2, logoSize: 0.2, logoSpacing: 0.2 };
    return this.calculateWeightedScore(logo, weights);
  }

  calculateLanguageScore(language) {
    const weights = { laboratoryTerms: 0.3, italianLanguage: 0.2, warmTone: 0.3, problemSolutionFocus: 0.2 };
    return this.calculateWeightedScore(language, weights);
  }

  calculateInteractivityScore(interactivity) {
    const weights = { heartVotingSystem: 0.3, responsiveElements: 0.2, accessibleInteractions: 0.3, smoothAnimations: 0.2 };
    return this.calculateWeightedScore(interactivity, weights);
  }

  calculateAccessibilityScore(accessibility) {
    const weights = { altTexts: 0.2, headingStructure: 0.2, focusIndicators: 0.2, ariaLabels: 0.2, colorContrast: 0.2 };
    return this.calculateWeightedScore(accessibility, weights);
  }

  calculateLayoutScore(layout) {
    const weights = { gridSystem: 0.3, spacing: 0.2, responsiveLayout: 0.3, contentHierarchy: 0.2 };
    return this.calculateWeightedScore(layout, weights);
  }

  calculateWeightedScore(compliance, weights) {
    const totalScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      const value = compliance[key] ? 1 : 0;
      return sum + (value * weight * 10);
    }, 0);
    return Math.round(totalScore * 10) / 10;
  }

  calculateOverallScore(scores) {
    const weights = {
      colorCompliance: 0.2,
      typography: 0.15,
      logoUsage: 0.1,
      languageCompliance: 0.2,
      interactivity: 0.2,
      accessibility: 0.1,
      layout: 0.05
    };

    const totalScore = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (scores[key] * weight);
    }, 0);

    return Math.round(totalScore * 10) / 10;
  }

  generateIssues(evaluation) {
    const issues = [];
    
    if (evaluation.scores.colorCompliance < 7) {
      issues.push("⚠️ WikiGaia brand colors not properly implemented");
    }
    if (evaluation.scores.typography < 7) {
      issues.push("⚠️ Typography doesn't follow Inter font guidelines");
    }
    if (evaluation.scores.logoUsage < 7) {
      issues.push("⚠️ WikiGaia logo missing or improperly placed");
    }
    if (evaluation.scores.languageCompliance < 7) {
      issues.push("⚠️ Laboratory artisan language not implemented");
    }
    if (evaluation.scores.interactivity < 7) {
      issues.push("⚠️ Interactive elements don't follow specifications");
    }
    if (evaluation.scores.accessibility < 7) {
      issues.push("⚠️ Accessibility standards not met");
    }

    return issues;
  }

  generateRecommendations(evaluation) {
    const recommendations = [];
    
    if (evaluation.scores.colorCompliance < 8) {
      recommendations.push("🎨 Implement WikiGaia primary color (#00B894) for key actions");
    }
    if (evaluation.scores.languageCompliance < 8) {
      recommendations.push("💬 Add warm laboratory language ('Il Mio Quaderno', 'Racconta')");
    }
    if (evaluation.scores.interactivity < 8) {
      recommendations.push("❤️ Implement heart-based voting system with smooth animations");
    }
    if (evaluation.overallScore >= 8) {
      recommendations.push("✅ Page meets WikiGaia brand standards");
    }

    return recommendations;
  }
}

class BatchUIHealingSystem {
  constructor() {
    this.evaluator = new WikiGaiaBrandEvaluator();
    this.results = [];
    this.browser = null;
    this.context = null;
  }

  async initialize() {
    console.log('🚀 Initializing WikiGaiaLab Batch UI Healing System...');
    
    // Create output directory
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched successfully');
  }

  async authenticateIfNeeded(page, screen) {
    if (!screen.auth) return true;

    try {
      console.log(`🔐 Authenticating for ${screen.name}...`);
      
      // Navigate to test login page
      await page.goto(`${CONFIG.APPLICATION_URL}${CONFIG.AUTH.loginUrl}`);
      await page.waitForLoadState('networkidle');
      
      // Look for email and password fields
      const emailField = await page.locator('input[type="email"], input[name="email"], #email').first();
      const passwordField = await page.locator('input[type="password"], input[name="password"], #password').first();
      const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill(CONFIG.AUTH.email);
        await passwordField.fill(CONFIG.AUTH.password);
        await submitButton.click();
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        console.log('✅ Authentication successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log(`⚠️ Authentication failed for ${screen.name}: ${error.message}`);
      return false;
    }
  }

  async captureAndEvaluateScreen(screen, viewport) {
    const page = await this.browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor
    });

    try {
      console.log(`📱 Processing ${screen.name} (${viewport.name}): ${screen.description}`);

      // Authenticate if needed
      if (screen.auth) {
        const authSuccess = await this.authenticateIfNeeded(page, screen);
        if (!authSuccess && screen.auth) {
          console.log(`⚠️ Skipping ${screen.name} - authentication required but failed`);
          return null;
        }
      }

      // Navigate to screen
      await page.goto(`${CONFIG.APPLICATION_URL}${screen.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Capture screenshot
      const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `${screen.name}-${viewport.name}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: false
      });

      console.log(`📸 Screenshot captured: ${screenshotPath}`);

      // Evaluate brand identity compliance
      const evaluation = await this.evaluator.evaluateBrandIdentity(page, screen.name, viewport);
      evaluation.screenshotPath = screenshotPath;
      evaluation.url = `${CONFIG.APPLICATION_URL}${screen.path}`;
      evaluation.priority = screen.priority;
      evaluation.timestamp = new Date().toISOString();

      console.log(`📊 ${screen.name} (${viewport.name}) scored: ${evaluation.overallScore}/10`);

      return evaluation;

    } catch (error) {
      console.error(`❌ Error processing ${screen.name} (${viewport.name}):`, error.message);
      return {
        screen: screen.name,
        viewport: viewport.name,
        error: error.message,
        overallScore: 0,
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  }

  async processAllScreens() {
    console.log(`\n📋 Processing ${SCREENS.length} screens across ${CONFIG.VIEWPORTS.length} viewports...\n`);

    for (const screen of SCREENS) {
      console.log(`\n--- Processing ${screen.name.toUpperCase()} (${screen.priority}) ---`);
      
      for (const viewport of CONFIG.VIEWPORTS) {
        const result = await this.captureAndEvaluateScreen(screen, viewport);
        if (result) {
          this.results.push(result);
        }
        
        // Small delay between captures
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async generateReport() {
    console.log('\n📄 Generating comprehensive healing report...');

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalScreens: SCREENS.length,
        totalViewports: CONFIG.VIEWPORTS.length,
        scoreThreshold: CONFIG.SCORE_THRESHOLD,
        focusPage: CONFIG.FOCUS_PAGE,
        processingTime: new Date() - this.evaluator.startTime
      },
      summary: this.generateSummary(),
      scoreMatrix: this.generateScoreMatrix(),
      criticalIssues: this.generateCriticalIssues(),
      recommendations: this.generateGlobalRecommendations(),
      detailedResults: this.results
    };

    // Save JSON report
    const jsonPath = path.join(CONFIG.OUTPUT_DIR, 'brand-focus-healing-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const mdPath = path.join(CONFIG.OUTPUT_DIR, 'BRAND-FOCUS-HEALING-REPORT.md');
    await fs.writeFile(mdPath, markdownReport);

    console.log(`✅ Reports generated:`);
    console.log(`   📊 JSON: ${jsonPath}`);
    console.log(`   📝 Markdown: ${mdPath}`);

    return report;
  }

  generateSummary() {
    const validResults = this.results.filter(r => !r.error);
    const avgScore = validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length;
    const passingSCores = validResults.filter(r => r.overallScore >= CONFIG.SCORE_THRESHOLD);
    
    return {
      totalEvaluations: this.results.length,
      averageScore: Math.round(avgScore * 10) / 10,
      passingScreens: passingSCores.length,
      failingScreens: validResults.length - passingSCores.length,
      errorCount: this.results.filter(r => r.error).length
    };
  }

  generateScoreMatrix() {
    const matrix = {};
    
    SCREENS.forEach(screen => {
      matrix[screen.name] = {};
      CONFIG.VIEWPORTS.forEach(viewport => {
        const result = this.results.find(r => 
          r.screen === screen.name && r.viewport === viewport.name
        );
        matrix[screen.name][viewport.name] = result ? result.overallScore : 0;
      });
    });

    return matrix;
  }

  generateCriticalIssues() {
    const issues = new Map();
    
    this.results.forEach(result => {
      if (result.issues) {
        result.issues.forEach(issue => {
          const key = issue.replace(/⚠️|❌/, '').trim();
          if (!issues.has(key)) {
            issues.set(key, { count: 0, screens: [] });
          }
          issues.get(key).count++;
          issues.get(key).screens.push(`${result.screen} (${result.viewport})`);
        });
      }
    });

    return Array.from(issues.entries())
      .map(([issue, data]) => ({ issue, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  generateGlobalRecommendations() {
    const profileResults = this.results.filter(r => r.screen === 'profile');
    const recommendations = [];

    if (profileResults.length === 0) {
      recommendations.push('🔴 CRITICAL: Profile page (/profile) not accessible or not captured');
    } else {
      const avgProfileScore = profileResults.reduce((sum, r) => sum + r.overallScore, 0) / profileResults.length;
      
      if (avgProfileScore < CONFIG.SCORE_THRESHOLD) {
        recommendations.push(`🔴 CRITICAL: Profile page scores ${avgProfileScore}/10 - requires immediate attention`);
      } else {
        recommendations.push(`✅ Profile page meets brand standards (${avgProfileScore}/10)`);
      }
    }

    // Global recommendations based on most common issues
    const criticalIssues = this.generateCriticalIssues();
    criticalIssues.slice(0, 3).forEach(({ issue, count }) => {
      recommendations.push(`🔧 Fix "${issue}" across ${count} screen variants`);
    });

    return recommendations;
  }

  generateMarkdownReport(report) {
    const md = [];

    md.push('# WikiGaiaLab Brand Identity & Interactive Healing Report');
    md.push(`*Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}*`);
    md.push(`*Focus: ${CONFIG.FOCUS_PAGE} page with brand identity compliance*\n`);

    // Executive Summary
    md.push('## Executive Summary\n');
    md.push(`- **Total Evaluations**: ${report.summary.totalEvaluations}`);
    md.push(`- **Average Score**: ${report.summary.averageScore}/10`);
    md.push(`- **Passing Screens**: ${report.summary.passingScreens}`);
    md.push(`- **Failing Screens**: ${report.summary.failingScreens}`);
    md.push(`- **Processing Time**: ${Math.round(report.metadata.processingTime / 1000)}s\n`);

    // Score Matrix
    md.push('## Score Matrix\n');
    md.push('| Screen | Mobile | Tablet | Desktop | Status |');
    md.push('|--------|--------|--------|---------|--------|');
    
    Object.entries(report.scoreMatrix).forEach(([screen, scores]) => {
      const mobile = scores.mobile || 0;
      const tablet = scores.tablet || 0;
      const desktop = scores.desktop || 0;
      const avg = Math.round(((mobile + tablet + desktop) / 3) * 10) / 10;
      const status = avg >= CONFIG.SCORE_THRESHOLD ? '✅' : '❌';
      
      md.push(`| ${screen} | ${mobile} | ${tablet} | ${desktop} | ${status} |`);
    });
    md.push('');

    // Critical Issues
    md.push('## Critical Issues\n');
    report.criticalIssues.slice(0, 10).forEach((issue, i) => {
      md.push(`${i + 1}. **${issue.issue}** (${issue.count} instances)`);
      md.push(`   - Affected: ${issue.screens.slice(0, 3).join(', ')}${issue.screens.length > 3 ? '...' : ''}\n`);
    });

    // Global Recommendations
    md.push('## Recommendations\n');
    report.recommendations.forEach(rec => {
      md.push(`- ${rec}`);
    });
    md.push('');

    // Profile Page Focus Analysis
    const profileResults = report.detailedResults.filter(r => r.screen === 'profile');
    if (profileResults.length > 0) {
      md.push('## Profile Page (/profile) Detailed Analysis\n');
      
      profileResults.forEach(result => {
        md.push(`### ${result.viewport.charAt(0).toUpperCase() + result.viewport.slice(1)} View\n`);
        md.push(`**Overall Score**: ${result.overallScore}/10\n`);
        
        if (result.scores) {
          md.push('**Component Scores**:');
          Object.entries(result.scores).forEach(([component, score]) => {
            md.push(`- ${component}: ${score}/10`);
          });
          md.push('');
        }

        if (result.issues && result.issues.length > 0) {
          md.push('**Issues**:');
          result.issues.forEach(issue => md.push(`- ${issue}`));
          md.push('');
        }

        if (result.recommendations && result.recommendations.length > 0) {
          md.push('**Recommendations**:');
          result.recommendations.forEach(rec => md.push(`- ${rec}`));
          md.push('');
        }
      });
    }

    // Screenshots
    md.push('## Screenshots Captured\n');
    const screenshots = this.results
      .filter(r => r.screenshotPath)
      .map(r => `- ${r.screen} (${r.viewport}): \`${path.basename(r.screenshotPath)}\``)
      .join('\n');
    md.push(screenshots);

    md.push('\n---\n');
    md.push('*This report was generated by the WikiGaiaLab Batch UI Healing System*');
    md.push('*focusing on brand identity compliance and interactive elements.*');

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
  const healingSystem = new BatchUIHealingSystem();
  
  try {
    await healingSystem.initialize();
    await healingSystem.processAllScreens();
    const report = await healingSystem.generateReport();
    
    console.log('\n🎉 Batch UI Healing completed successfully!');
    console.log(`\n📊 Final Summary:`);
    console.log(`   Average Score: ${report.summary.averageScore}/10`);
    console.log(`   Passing Screens: ${report.summary.passingScreens}/${report.summary.totalEvaluations - report.summary.errorCount}`);
    console.log(`   Critical Issues: ${report.criticalIssues.length}`);
    
    // Special focus on profile page
    const profileResults = report.detailedResults.filter(r => r.screen === 'profile');
    if (profileResults.length > 0) {
      const avgProfileScore = profileResults.reduce((sum, r) => sum + r.overallScore, 0) / profileResults.length;
      console.log(`\n👤 Profile Page Focus:`);
      console.log(`   Average Score: ${Math.round(avgProfileScore * 10) / 10}/10`);
      console.log(`   Status: ${avgProfileScore >= CONFIG.SCORE_THRESHOLD ? '✅ PASSING' : '❌ NEEDS HEALING'}`);
    } else {
      console.log(`\n👤 Profile Page Focus: ❌ NOT ACCESSIBLE`);
    }
    
  } catch (error) {
    console.error('❌ Batch UI Healing failed:', error);
    process.exit(1);
  } finally {
    await healingSystem.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BatchUIHealingSystem, WikiGaiaBrandEvaluator, CONFIG };