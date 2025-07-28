#!/usr/bin/env node

/**
 * Debug CI/CD Pipeline Issues
 * This script reproduces the exact steps that GitHub Actions runs
 * to identify and fix the failing CI pipeline
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 CI/CD Pipeline Debug Tool');
console.log('=' .repeat(50));

const runCommand = (command, description, options = {}) => {
  console.log(`\n📋 ${description}`);
  console.log(`💻 Running: ${command}`);
  console.log('-'.repeat(40));
  
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    console.log(`✅ ${description} - SUCCESS`);
    return { success: true, result };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Exit code: ${error.status}`);
    if (error.stdout) console.log('STDOUT:', error.stdout.toString());
    if (error.stderr) console.log('STDERR:', error.stderr.toString());
    return { success: false, error };
  }
};

const checkFileExists = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
};

async function debugPipeline() {
  console.log('\n🔧 STEP 1: Environment Check');
  console.log('=' .repeat(30));
  
  // Check Node and pnpm versions
  runCommand('node --version', 'Node.js version');
  runCommand('pnpm --version', 'pnpm version');
  
  // Check important files
  checkFileExists('package.json', 'Root package.json');
  checkFileExists('apps/web/package.json', 'Web app package.json');
  checkFileExists('pnpm-lock.yaml', 'pnpm lockfile');
  
  console.log('\n🔧 STEP 2: Dependencies Installation');
  console.log('=' .repeat(30));
  
  const installResult = runCommand('pnpm install --frozen-lockfile', 'Install dependencies');
  if (!installResult.success) {
    console.log('❌ Installation failed, trying without frozen lockfile...');
    runCommand('pnpm install', 'Install dependencies (fallback)');
  }
  
  console.log('\n🔧 STEP 3: Build Test');
  console.log('=' .repeat(30));
  
  const buildResult = runCommand('pnpm run build', 'Build all packages');
  if (!buildResult.success) {
    console.log('❌ Global build failed, trying web app only...');
    runCommand('cd apps/web && pnpm run build', 'Build web app only');
  }
  
  console.log('\n🔧 STEP 4: Lint Check');  
  console.log('=' .repeat(30));
  
  runCommand('pnpm run lint', 'ESLint check');
  
  console.log('\n🔧 STEP 5: Type Check');
  console.log('=' .repeat(30));
  
  runCommand('pnpm run type-check', 'TypeScript type check');
  
  console.log('\n🔧 STEP 6: Test Check');
  console.log('=' .repeat(30));
  
  // Check what test scripts are available
  console.log('\n📝 Available scripts in root package.json:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    Object.keys(scripts).filter(key => key.includes('test')).forEach(key => {
      console.log(`  - ${key}: ${scripts[key]}`);
    });
  } catch (error) {
    console.log('❌ Could not read package.json scripts');
  }
  
  runCommand('pnpm run test', 'Run tests');
  
  console.log('\n🔧 STEP 7: Security Audit');
  console.log('=' .repeat(30));
  
  runCommand('pnpm audit --prod', 'Security audit (production)');
  
  console.log('\n🔧 STEP 8: Workspace Analysis');
  console.log('=' .repeat(30));
  
  // Check each workspace
  const workspaces = ['apps/web', 'packages/ui', 'packages/shared', 'packages/database'];
  
  workspaces.forEach(workspace => {
    if (fs.existsSync(workspace)) {
      console.log(`\n📦 Checking workspace: ${workspace}`);
      
      const packageJsonPath = path.join(workspace, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          console.log(`  Name: ${pkg.name}`);
          console.log(`  Scripts: ${Object.keys(pkg.scripts || {}).join(', ')}`);
          
          // Check if build script exists
          if (pkg.scripts && pkg.scripts.build) {
            runCommand(`cd ${workspace} && pnpm run build`, `Build ${workspace}`);
          } else {
            console.log(`  ⚠️ No build script in ${workspace}`);
          }
        } catch (error) {
          console.log(`  ❌ Could not read package.json in ${workspace}`);
        }
      } else {
        console.log(`  ❌ No package.json in ${workspace}`);
      }
    } else {
      console.log(`  ❌ Workspace does not exist: ${workspace}`);
    }
  });
  
  console.log('\n🎯 FINAL SUMMARY');
  console.log('=' .repeat(30));
  console.log('Check the output above to identify specific failure points.');
  console.log('Each ❌ indicates an issue that needs to be fixed.');
  console.log('\nNext steps:');
  console.log('1. Fix the identified issues');
  console.log('2. Re-run this script to verify fixes');
  console.log('3. Update CI workflow accordingly');
}

debugPipeline().catch(console.error);