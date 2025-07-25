#!/usr/bin/env node

/**
 * Quick UI Test for WikiGaiaLab
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function quickUITest() {
  console.log('🚀 Starting Quick UI Test for WikiGaiaLab...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to homepage
    console.log('📱 Navigating to homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: '/Users/davidecrescentini/00-Progetti/000-WikiGaiaLab/homepage-test.png', 
      fullPage: true 
    });
    
    // Check for key WikiGaia brand elements
    const brandElements = await page.evaluate(() => {
      const results = {
        hasWikiGaiaLogo: !!document.querySelector('[alt*="WikiGaia"], [src*="wikigaia"], img[src*="logo"]'),
        hasWikiGaiaColors: !!document.querySelector('[class*="teal"], [class*="green"], [style*="#00B894"], [style*="teal"]'),
        hasItalianContent: document.body.textContent.includes('problema') || document.body.textContent.includes('laboratorio'),
        hasAuthButton: !!document.querySelector('button[class*="login"], a[href*="login"], [class*="auth"]'),
        hasProblemsSection: document.body.textContent.includes('problem') || document.body.textContent.includes('Problem'),
        title: document.title,
        primaryHeading: document.querySelector('h1')?.textContent || 'No H1 found'
      };
      
      return results;
    });
    
    console.log('🔍 Brand Analysis Results:', brandElements);
    
    // Basic scoring
    let score = 0;
    if (brandElements.hasWikiGaiaLogo) score += 2;
    if (brandElements.hasWikiGaiaColors) score += 2;
    if (brandElements.hasItalianContent) score += 2;
    if (brandElements.hasAuthButton) score += 2;
    if (brandElements.hasProblemsSection) score += 2;
    
    const finalScore = Math.min(10, score);
    
    console.log(`📊 Homepage Score: ${finalScore}/10`);
    console.log('✅ Quick test completed! Check homepage-test.png for visual reference.');
    
    await browser.close();
    return finalScore;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
    return 0;
  }
}

quickUITest();