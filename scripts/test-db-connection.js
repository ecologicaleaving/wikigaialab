#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity and performance for WikiGaiaLab
 */

const { checkDatabaseHealth, retryDatabaseOperation } = require('../src/lib/db-health');

async function runDatabaseTests() {
  console.log('🔍 Testing WikiGaiaLab database connection...\n');

  try {
    // Test 1: Basic health check
    console.log('📊 Running health check...');
    const healthCheck = await checkDatabaseHealth();
    
    console.log(`Status: ${getStatusEmoji(healthCheck.status)} ${healthCheck.status.toUpperCase()}`);
    console.log(`Latency: ${healthCheck.latency}ms`);
    console.log(`Timestamp: ${healthCheck.timestamp}`);
    console.log('\n🔍 Individual checks:');
    
    Object.entries(healthCheck.checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    if (healthCheck.error) {
      console.log(`\n❌ Error: ${healthCheck.error}`);
    }

    // Test 2: Retry logic test
    console.log('\n🔄 Testing retry logic...');
    try {
      const retryResult = await retryDatabaseOperation(async () => {
        // Simulate potentially failing operation
        const { supabase } = require('../src/lib/supabase');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        return data;
      }, 3);
      
      console.log('✅ Retry logic test passed');
    } catch (retryError) {
      console.log('❌ Retry logic test failed:', retryError.message);
    }

    // Test 3: Performance benchmarks
    console.log('\n⚡ Running performance benchmarks...');
    const benchmarkResults = await runPerformanceBenchmarks();
    
    console.log(`Average query time: ${benchmarkResults.averageQueryTime}ms`);
    console.log(`Max query time: ${benchmarkResults.maxQueryTime}ms`);
    console.log(`Min query time: ${benchmarkResults.minQueryTime}ms`);
    
    // Test 4: Connection pool test
    console.log('\n🏊 Testing connection pool...');
    const poolTest = await testConnectionPool();
    console.log(`Concurrent connections: ${poolTest.successful}/${poolTest.total}`);
    
    // Summary
    console.log('\n📋 Test Summary:');
    const overallStatus = healthCheck.status === 'healthy' && 
                         benchmarkResults.averageQueryTime < 1000 && 
                         poolTest.successful >= poolTest.total * 0.8;
    
    console.log(`Overall Status: ${overallStatus ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`);
    
    if (!overallStatus) {
      console.log('\n💡 Recommendations:');
      if (healthCheck.status !== 'healthy') {
        console.log('  - Check database connection configuration');
        console.log('  - Verify environment variables are set correctly');
      }
      if (benchmarkResults.averageQueryTime >= 1000) {
        console.log('  - Consider database optimization');
        console.log('  - Check network connectivity');
      }
      if (poolTest.successful < poolTest.total * 0.8) {
        console.log('  - Review connection pool configuration');
        console.log('  - Check for connection leaks');
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'healthy': return '✅';
    case 'degraded': return '⚠️';
    case 'unhealthy': return '❌';
    default: return '❓';
  }
}

async function runPerformanceBenchmarks() {
  const { supabase } = require('../src/lib/supabase');
  const queryTimes = [];
  
  // Run 10 sample queries
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    try {
      await supabase.from('problems').select('id, title').limit(5);
      const time = Date.now() - start;
      queryTimes.push(time);
    } catch (error) {
      console.warn(`Query ${i + 1} failed:`, error.message);
    }
  }
  
  if (queryTimes.length === 0) {
    return { averageQueryTime: 0, maxQueryTime: 0, minQueryTime: 0 };
  }
  
  return {
    averageQueryTime: Math.round(queryTimes.reduce((a, b) => a + b) / queryTimes.length),
    maxQueryTime: Math.max(...queryTimes),
    minQueryTime: Math.min(...queryTimes),
  };
}

async function testConnectionPool() {
  const { supabase } = require('../src/lib/supabase');
  const totalConnections = 5;
  const promises = [];
  
  // Create multiple concurrent connections
  for (let i = 0; i < totalConnections; i++) {
    promises.push(
      supabase.from('users').select('count').limit(1)
        .then(() => true)
        .catch(() => false)
    );
  }
  
  const results = await Promise.all(promises);
  const successful = results.filter(Boolean).length;
  
  return {
    total: totalConnections,
    successful,
    successRate: (successful / totalConnections * 100).toFixed(1) + '%'
  };
}

// Run tests if called directly
if (require.main === module) {
  runDatabaseTests().catch(console.error);
}

module.exports = { runDatabaseTests };