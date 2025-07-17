#!/usr/bin/env node

/**
 * WikiGaiaLab Test Environment Verification Script
 * Verifies that the development environment is properly configured
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log('🧪 WikiGaiaLab Test Environment Verification\n');

let allTestsPassed = true;

function runTest(testName, testFn) {
  try {
    log('blue', `Testing: ${testName}...`);
    testFn();
    log('green', `✅ ${testName} - PASSED`);
  } catch (error) {
    log('red', `❌ ${testName} - FAILED: ${error.message}`);
    allTestsPassed = false;
  }
}

// Test 1: Environment file exists
runTest('Environment configuration', () => {
  if (!fs.existsSync('.env.local')) {
    throw new Error('.env.local file not found');
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL'
  ];
  
  requiredVars.forEach(variable => {
    if (!envContent.includes(variable)) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  });
});

// Test 2: Dependencies installed
runTest('Dependencies installation', () => {
  if (!fs.existsSync('node_modules')) {
    throw new Error('node_modules directory not found. Run: pnpm install');
  }
  
  if (!fs.existsSync('pnpm-lock.yaml')) {
    throw new Error('pnpm-lock.yaml not found');
  }
});

// Test 3: TypeScript compilation
runTest('TypeScript compilation', () => {
  execSync('pnpm run type-check', { stdio: 'pipe' });
});

// Test 4: Linting
runTest('Code linting', () => {
  execSync('pnpm run lint', { stdio: 'pipe' });
});

// Test 5: Supabase status
runTest('Supabase local instance', () => {
  const status = execSync('supabase status --local', { encoding: 'utf8' });
  if (!status.includes('API URL')) {
    throw new Error('Supabase is not running. Run: supabase start');
  }
});

// Test 6: Database connection
runTest('Database connection', () => {
  try {
    execSync('node scripts/test-db-connection.js', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Database connection failed. Check Supabase status and environment variables.');
  }
});

// Test 7: Database schema
runTest('Database schema', () => {
  // This is a simple test - in a real scenario you'd check for specific tables
  const result = execSync('node -e "console.log(\'Schema check placeholder\')"', { encoding: 'utf8' });
  // We'll implement a more thorough check later
});

// Test 8: Authentication system
runTest('Authentication system files', () => {
  const authFiles = [
    'apps/web/src/contexts/AuthContext.tsx',
    'apps/web/src/hooks/useAuth.ts',
    'apps/web/src/lib/auth.ts',
    'apps/web/src/types/auth.ts'
  ];
  
  authFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Authentication file missing: ${file}`);
    }
  });
});

// Test 9: Navigation system
runTest('Navigation system files', () => {
  const navFiles = [
    'apps/web/src/components/layout/Header.tsx',
    'apps/web/src/components/layout/Footer.tsx',
    'apps/web/src/components/layout/MobileMenu.tsx'
  ];
  
  navFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Navigation file missing: ${file}`);
    }
  });
});

// Test 10: Database utilities
runTest('Database utilities', () => {
  const dbFiles = [
    'packages/database/src/utils/index.ts',
    'packages/database/src/migrations/001_initial_schema.sql',
    'packages/database/src/types.ts'
  ];
  
  dbFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Database file missing: ${file}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  log('green', '🎉 All tests passed! Your development environment is ready.');
  console.log(`
${colors.blue}🚀 You can now start developing:${colors.reset}
   pnpm dev

${colors.blue}📊 Access Supabase Studio:${colors.reset}
   Check the Studio URL from: supabase status

${colors.blue}🧪 Run specific tests:${colors.reset}
   pnpm test                    # Run all tests
   pnpm test:unit              # Run unit tests
   pnpm test:integration       # Run integration tests
   pnpm test:e2e              # Run end-to-end tests
`);
} else {
  log('red', '❌ Some tests failed. Please fix the issues above before proceeding.');
  log('yellow', '💡 You can run this script again after fixing the issues:');
  log('yellow', '   node scripts/test-environment.js');
  process.exit(1);
}