#!/usr/bin/env node

/**
 * Local Performance Monitor Test Script
 * Tests the performance monitoring workflow components locally
 */

const https = require('https');
const http = require('http');

async function testUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        url,
        statusCode: res.statusCode,
        responseTime,
        success: res.statusCode >= 200 && res.statusCode < 400,
        headers: {
          'content-type': res.headers['content-type'],
          'cache-control': res.headers['cache-control']
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        success: false,
        error: 'Timeout',
        responseTime: Date.now() - startTime
      });
    });
  });
}

async function testPerformanceMonitor() {
  console.log('🔍 Testing Performance Monitor Components\n');
  
  // Test URLs that the workflow checks
  const testUrls = [
    'https://wikigaialab.com',
    'https://wikigaialab.com/api/health',
    'https://wikigaialab.com/problems',
    'https://wikigaialab.com/api/monitoring/metrics',
    'https://wikigaialab.com/api/monitoring/alerts'
  ];
  
  console.log('Testing URLs...');
  for (const url of testUrls) {
    const result = await testUrl(url);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${url} - ${result.statusCode || 'ERROR'} (${result.responseTime}ms)`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n📊 Performance Thresholds Check:');
  
  // Test performance metrics that might cause alerts
  const mockMetrics = {
    page_load_time: 3500,      // Should be OK (< 5000ms)
    api_response_time: 4000,   // Should be OK (< 3000ms) - might alert
    memory_usage: 85,          // Should be OK (< 90%)
    bundle_size: 800000,       // Should be OK (< 1MB)
    startup_time: 8000         // Should be OK (< 10000ms)
  };
  
  const thresholds = {
    page_load_time: 5000,
    api_response_time: 3000,
    memory_usage: 90,
    bundle_size: 1000000,
    startup_time: 10000
  };
  
  Object.entries(mockMetrics).forEach(([metric, value]) => {
    const threshold = thresholds[metric];
    const isIssue = value > threshold;
    const status = isIssue ? '⚠️' : '✅';
    const unit = metric.includes('time') ? 'ms' : metric === 'memory_usage' ? '%' : 'bytes';
    
    console.log(`${status} ${metric}: ${value}${unit} (threshold: ${threshold}${unit})`);
  });
  
  console.log('\n🚀 Bundle Analysis Test:');
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check if Next.js config has bundle analyzer
    const nextConfigPath = path.join(__dirname, '../apps/web/next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      const hasBundleAnalyzer = configContent.includes('withBundleAnalyzer');
      console.log(`✅ Bundle analyzer configured: ${hasBundleAnalyzer}`);
    } else {
      console.log('❌ Next.js config not found');
    }
    
    // Check if package.json has analyze script
    const packageJsonPath = path.join(__dirname, '../apps/web/package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasAnalyzeScript = !!packageJson.scripts?.analyze;
      console.log(`✅ Analyze script configured: ${hasAnalyzeScript}`);
    }
    
  } catch (error) {
    console.log(`❌ Bundle analysis check failed: ${error.message}`);
  }
  
  console.log('\n📋 Recommendations:');
  console.log('1. Ensure GitHub secrets are configured: LHCI_GITHUB_APP_TOKEN, PRODUCTION_URL');
  console.log('2. Check that the production site is accessible from GitHub Actions');
  console.log('3. Verify that /api/health returns a successful response');
  console.log('4. Consider running: npm run analyze locally to test bundle analysis');
  console.log('5. Monitor GitHub Actions logs for specific error messages');
}

// Run the test
if (require.main === module) {
  testPerformanceMonitor().catch(console.error);
}

module.exports = { testPerformanceMonitor };