# WikiGaiaLab - Development Environment Guide

## Overview

WikiGaiaLab is a community-driven platform where users propose problems, vote on solutions, and access AI-powered applications. Built with Next.js, Supabase, and modern web technologies.

## Prerequisites

### Required Software
- **Node.js** >= 18.0.0 (LTS recommended)
- **npm** >= 8.0.0 or **pnpm** >= 8.0.0
- **Git** >= 2.30.0
- **Supabase CLI** >= 1.100.0

### Optional Tools
- **VS Code** with recommended extensions
- **Docker** for containerized development
- **Stripe CLI** for webhook testing

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/wikigaialab.git
cd wikigaialab

# Install dependencies
npm install
# or
pnpm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Configure your `.env.local`:

```env
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Payments
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=WikiGaiaLab
```

### 3. Database Setup

```bash
# Initialize Supabase locally
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev
# or
pnpm dev

# Open browser
open http://localhost:3000
```

## Project Structure

```
wikigaialab/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   ├── components/    # React components
│       │   ├── lib/          # Utility functions
│       │   └── types/        # TypeScript types
│       ├── public/           # Static assets
│       └── package.json
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── database/             # Database schemas and migrations
│   ├── auth/                 # Authentication utilities
│   └── emails/               # Email templates
├── docs/                     # Project documentation
│   ├── prd.md
│   ├── architecture.md
│   └── front_end_spec.md
├── scripts/                  # Build and deployment scripts
└── package.json             # Root package.json
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/user-voting-system

# Make changes
# Test locally
npm run test

# Commit changes
git add .
git commit -m "feat: implement user voting system"

# Push and create PR
git push origin feature/user-voting-system
```

### 2. Database Changes

```bash
# Create new migration
supabase migration new add_voting_table

# Edit migration file
# supabase/migrations/20231201000000_add_voting_table.sql

# Apply migration locally
supabase db push

# Generate new types
supabase gen types typescript --local > types/supabase.ts
```

### 3. Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- VotingSystem.test.ts

# Run E2E tests
npm run test:e2e
```

## Environment-Specific Setup

### Development
- Uses local Supabase instance
- Hot reload enabled
- Debug logging active
- Mock external services

### Staging
- Production-like environment
- Real external services
- Performance monitoring
- Limited data set

### Production
- Optimized builds
- Full monitoring
- Real user data
- Backup strategies

## Common Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript checks

# Database
npm run db:push            # Push schema changes
npm run db:reset           # Reset local database
npm run db:generate        # Generate types
npm run db:seed            # Seed test data

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run test:coverage      # Run with coverage

# Deployment
npm run deploy:staging     # Deploy to staging
npm run deploy:production  # Deploy to production
```

## VS Code Setup

### Recommended Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode",
    "stripe.vscode-stripe",
    "ms-vscode.vscode-json"
  ]
}
```

### Settings

Add to your `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## External Services Setup

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Copy project URL and anon key
3. Enable Google OAuth in Authentication settings
4. Configure RLS policies

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Configure webhook events: `checkout.session.completed`, `customer.subscription.updated`

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

### AI Services
1. **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
2. **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)

## Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check Supabase connection
supabase status

# Restart local services
supabase stop
supabase start
```

**Build Issues:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install
```

**Type Errors:**
```bash
# Regenerate Supabase types
supabase gen types typescript --local > types/supabase.ts

# Check TypeScript
npm run type-check
```

### Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: Create GitHub issue with reproduction steps
- **Team Chat**: Use project Slack/Discord channel
- **Code Review**: Request review from team members

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow code style guidelines
4. Write tests for new features
5. Update documentation
6. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.