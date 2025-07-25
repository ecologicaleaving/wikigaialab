#!/usr/bin/env node

/**
 * WikiGaiaLab Total UI Healing System
 * Using Playwright for browser automation and screenshot capture
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  APPLICATION_URL: "http://localhost:3000",
  DOCS_PATH: "./docs/ui/",
  SCORE_THRESHOLD: 8,
  SCREENS_FILE: "./docs/ui/page-list.md",
  OUTPUT_DIR: "./ui-healing-output"
};

async function readScreensList() {
  try {
    const content = await fs.readFile(CONFIG.SCREENS_FILE, 'utf-8');
    const screens = [];
    
    content.split('\n').forEach(line => {
      // Parse format: URL_PATH | SCREEN_NAME | DESCRIPTION
      if (line.trim() && !line.startsWith('#')) {
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
    
    return screens;
  } catch (error) {
    console.error('Error reading screens file:', error);
    return [];
  }
}

async function captureScreenshots(screens) {
  const browser = await chromium.launch({ 
    headless: false, // Set to true for production
    viewport: { width: 1920, height: 1080 }
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Ensure output directory exists
  await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
  
  const results = [];
  
  for (const screen of screens) {
    console.log(`📸 Capturing: ${screen.name} (${screen.path})`);
    
    try {
      // Navigate to screen
      const url = CONFIG.APPLICATION_URL + screen.path;
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for page to stabilize
      await page.waitForTimeout(3000);
      
      // Capture screenshot
      const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `${screen.name}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true
      });
      
      // Get accessibility tree for analysis
      const accessibility = await page.accessibility.snapshot();
      
      results.push({
        screen,
        screenshotPath,
        accessibility,
        status: 'success'
      });
      
      console.log(`✅ Captured: ${screen.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to capture ${screen.name}:`, error.message);
      results.push({
        screen,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  await browser.close();
  return results;
}

async function evaluateScreens(results) {
  console.log('\n🔍 Starting UI Evaluation...');
  
  const evaluations = [];
  
  for (const result of results) {
    if (result.status !== 'success') continue;
    
    // Basic evaluation criteria based on WikiGaia standards
    const evaluation = {
      screen: result.screen.name,
      scores: {
        brand_identity: 0,    // WikiGaia colors, typography
        language: 0,          // Artisanal laboratory language
        accessibility: 0,     // WCAG AA compliance
        responsiveness: 0,    // Mobile-first design
        interactions: 0       // Heart-based voting, animations
      },
      total_score: 0,
      issues: [],
      recommendations: []
    };
    
    // TODO: Implement actual evaluation logic here
    // This would analyze the accessibility tree and screenshot
    
    // For now, assign placeholder scores
    evaluation.scores.brand_identity = Math.floor(Math.random() * 4) + 6; // 6-10
    evaluation.scores.language = Math.floor(Math.random() * 4) + 6;
    evaluation.scores.accessibility = Math.floor(Math.random() * 4) + 6;
    evaluation.scores.responsiveness = Math.floor(Math.random() * 4) + 6;
    evaluation.scores.interactions = Math.floor(Math.random() * 4) + 6;
    
    evaluation.total_score = Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / 5;
    
    if (evaluation.total_score < CONFIG.SCORE_THRESHOLD) {
      evaluation.needs_healing = true;
    }
    
    evaluations.push(evaluation);
    console.log(`📊 ${result.screen.name}: ${evaluation.total_score.toFixed(1)}/10`);
  }
  
  return evaluations;
}

async function generateReport(results, evaluations) {
  const report = {
    timestamp: new Date().toISOString(),
    total_screens: results.length,
    successful_captures: results.filter(r => r.status === 'success').length,
    average_score: evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length,
    screens_needing_healing: evaluations.filter(e => e.needs_healing).length,
    results: results,
    evaluations: evaluations
  };
  
  const reportPath = path.join(CONFIG.OUTPUT_DIR, 'ui-healing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 UI HEALING REPORT GENERATED');
  console.log(`📁 Output Directory: ${CONFIG.OUTPUT_DIR}`);
  console.log(`📊 Average Score: ${report.average_score.toFixed(1)}/10`);
  console.log(`🩹 Screens Needing Healing: ${report.screens_needing_healing}`);
  
  return report;
}

async function main() {
  try {
    console.log('🚀 WikiGaiaLab Total UI Healing System');
    console.log('=====================================\n');
    
    // Step 1: Read screens list
    const screens = await readScreensList();
    console.log(`📋 Found ${screens.length} screens to evaluate`);
    
    // Step 2: Capture screenshots
    const results = await captureScreenshots(screens);
    
    // Step 3: Evaluate screens
    const evaluations = await evaluateScreens(results);
    
    // Step 4: Generate report
    await generateReport(results, evaluations);
    
  } catch (error) {
    console.error('❌ UI Healing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, captureScreenshots, evaluateScreens };