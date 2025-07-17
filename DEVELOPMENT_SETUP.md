# WikiGaiaLab Development Setup Guide

## Prerequisites

### Required Software
```bash
# Node.js 18+ (check version)
node --version

# pnpm package manager
npm install -g pnpm

# Supabase CLI
npm install -g supabase

# Docker (for local Supabase)
# Download from https://www.docker.com/products/docker-desktop/
```

## 1. Project Setup

### Clone and Install Dependencies
```bash
# Navigate to project directory
cd /Users/davidecrescentini/00-Progetti/000-WikiGaiaLab

# Install all dependencies
pnpm install

# Verify installation
pnpm run type-check
pnpm run lint
```

## 2. Local Supabase Setup

### Initialize Supabase Locally
```bash
# Initialize Supabase in project root
supabase init

# Start local Supabase (this will download Docker images)
supabase start

# This will output something like:
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
# JWT secret: your-jwt-secret
# anon key: your-anon-key
# service_role key: your-service-role-key
```

### Apply Database Schema
```bash
# Run our custom database migrations
node packages/database/scripts/setup-database.js

# Or apply migrations manually:
supabase db reset --local
```

## 3. Environment Configuration

### Create Environment Files
```bash
# Copy the example file
cp .env.local.example .env.local
```

### Configure .env.local
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-local-anon-key"
SUPABASE_SERVICE_KEY="your-local-service-role-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WikiGaiaLab"
NEXT_PUBLIC_APP_DESCRIPTION="Community-driven problem solving platform"
NODE_ENV="development"

# Optional: Google OAuth (for authentication testing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-development-secret"

# Optional: Testing APIs (set to test values)
OPENAI_API_KEY="sk-test-key"
ANTHROPIC_API_KEY="sk-ant-test-key"
RESEND_API_KEY="re_test_key"
```

## 4. Automated Setup (Recommended)

### Quick Setup
```bash
# Run the automated setup script
pnpm run setup:dev

# This script will:
# 1. Check all prerequisites
# 2. Install dependencies
# 3. Start local Supabase
# 4. Create .env.local file
# 5. Apply database schema
# 6. Run initial tests
```

### Verify Setup
```bash
# Test your environment
pnpm run test:env

# This will verify:
# - Environment configuration
# - Dependencies installation
# - TypeScript compilation
# - Database connection
# - All required files exist
```

## 5. Manual Setup (Alternative)

### Start Supabase Manually
```bash
# Check if Supabase is running
pnpm run db:status

# Start Supabase if not running
pnpm run db:start

# Apply database schema
pnpm run db:setup

# Check connection
pnpm run db:test
```

### Get Supabase Connection Details
```bash
# View all connection details
supabase status --local

# Copy the output values to your .env.local file
```

## 6. Google OAuth Setup (Optional)

### For Authentication Testing
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Copy Client ID and Secret to `.env.local`:

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-min-32-characters"
```

## 7. Development Workflow

### Daily Development
```bash
# Start Supabase (if not running)
pnpm run db:start

# Start development server
pnpm dev

# In another terminal, run tests
pnpm test:watch
```

### Useful Commands
```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm run db:start       # Start local Supabase
pnpm run db:stop        # Stop local Supabase
pnpm run db:status      # Check Supabase status
pnpm run db:reset       # Reset database
pnpm run db:setup       # Apply our schema

# Testing
pnpm test               # Run all tests
pnpm test:unit          # Run unit tests only
pnpm test:integration   # Run integration tests
pnpm test:e2e          # Run end-to-end tests
pnpm test:watch        # Run tests in watch mode

# Code Quality
pnpm run lint          # Check linting
pnpm run type-check    # Check TypeScript
pnpm run format        # Format code
```

## 8. Accessing Services

### Local URLs
- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **API**: http://localhost:54321

### Supabase Studio Features
- **Table Editor**: View and edit database tables
- **Authentication**: Manage users and auth settings
- **Storage**: File storage management
- **Edge Functions**: Serverless functions
- **Logs**: Real-time logs and monitoring

## 9. Testing Different Features

### Authentication Testing
```bash
# Test authentication flows
pnpm test:integration -- auth

# Or manually test:
# 1. Go to http://localhost:3000/login
# 2. Click "Accedi con Google" (if OAuth configured)
# 3. Check user creation in Supabase Studio
```

### Database Testing
```bash
# Test database operations
pnpm run db:test

# View data in Supabase Studio
# Go to http://localhost:54323
# Navigate to Table Editor
```

### API Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/auth/session
curl http://localhost:3000/api/analytics/track

# Or use Postman/Insomnia for more complex testing
```

## 10. Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop
```

#### Port Already in Use
```bash
# Error: Port 54321 already in use
# Solution: Stop existing Supabase or change ports
supabase stop
```

#### Environment Variables Not Loaded
```bash
# Error: Missing environment variables
# Solution: Restart development server after .env.local changes
```

#### Database Connection Failed
```bash
# Check Supabase status
pnpm run db:status

# Restart if needed
pnpm run db:stop
pnpm run db:start
```

### Getting Help
- Check logs with `pnpm run db:status`
- View Supabase logs in Docker Desktop
- Check browser console for frontend errors
- Run `pnpm run test:env` to diagnose issues

## 11. Production-like Testing

### Build and Test Production Version
```bash
# Build the application
pnpm build

# Start production server
pnpm start

# Test production build
curl http://localhost:3000
```

### Performance Testing
```bash
# Run Lighthouse tests
npx lighthouse http://localhost:3000

# Check bundle size
npx @next/bundle-analyzer
```

## 12. Database Schema Development

### Making Schema Changes
```bash
# Create new migration
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Apply changes
supabase db reset --local

# Generate TypeScript types
pnpm run db:generate
```

### Seed Data
```bash
# Apply seed data
pnpm run db:seed

# Or manually add test data via Supabase Studio
```

---

**🎉 Your WikiGaiaLab development environment is now ready!**

Start with: `pnpm run setup:dev` and then `pnpm dev`