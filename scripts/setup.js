#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up WikiGaiaLab development environment...\n');

// Check if .env.local exists
const envFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envFile)) {
  console.log('📝 Creating .env.local from template...');
  fs.copyFileSync(
    path.join(process.cwd(), '.env.local.example'),
    envFile
  );
  console.log('✅ .env.local created. Please update with your actual values.\n');
} else {
  console.log('✅ .env.local already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies with pnpm, trying npm...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully with npm.\n');
  } catch (npmError) {
    console.error('❌ Failed to install dependencies:', npmError.message);
    process.exit(1);
  }
}

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed.\n');
} catch (error) {
  console.log('📦 Installing Supabase CLI...');
  try {
    execSync('npm install -g supabase', { stdio: 'inherit' });
    console.log('✅ Supabase CLI installed successfully.\n');
  } catch (installError) {
    console.log('⚠️  Could not install Supabase CLI automatically.');
    console.log('Please install it manually: npm install -g supabase\n');
  }
}

// Create initial directory structure
console.log('📁 Creating project structure...');
const directories = [
  'apps/web/src/components/ui',
  'apps/web/src/components/layout',
  'apps/web/src/components/forms',
  'apps/web/src/hooks',
  'apps/web/src/utils',
  'apps/web/src/types',
  'apps/web/public/images',
  'apps/web/public/icons',
  'packages/database/src/migrations',
  'packages/shared/src/utils',
  'packages/ui/src/components',
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created ${dir}/`);
  }
});

console.log('\n🎉 WikiGaiaLab monorepo setup completed successfully!\n');
console.log('Next steps:');
console.log('1. Update .env.local with your actual environment variables');
console.log('2. Set up your Supabase project and run: supabase link');
console.log('3. Run database migrations: pnpm run db:push');
console.log('4. Start development server: pnpm run dev');
console.log('5. Run tests: pnpm run test');
console.log('6. Check types: pnpm run type-check');
console.log('\nMonorepo structure:');
console.log('- apps/web/     → Next.js application');
console.log('- packages/ui/  → Shared UI components');
console.log('- packages/shared/ → Shared utilities');
console.log('- packages/database/ → Database types and migrations');
console.log('\nHappy coding! 🚀');