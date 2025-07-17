# 🚀 WikiGaiaLab Quick Start Guide

## ⚡ Super Quick Setup (5 minutes)

### 1. Prerequisites Check
Make sure you have:
- **Node.js 18+** installed
- **Docker Desktop** running
- **Git** installed

### 2. One-Command Setup
```bash
# Navigate to project directory
cd /Users/davidecrescentini/00-Progetti/000-WikiGaiaLab

# Run automated setup (installs everything for you)
pnpm run setup:dev
```

### 3. Start Development
```bash
# Start the app
pnpm dev
```

### 4. Open Your Browser
- **App**: http://localhost:3000
- **Database Admin**: http://localhost:54323

**🎉 That's it! WikiGaiaLab is running locally with Supabase!**

---

## 🔧 Manual Setup (if automated fails)

### Step-by-Step Manual Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Install Supabase CLI (if not installed)
npm install -g supabase

# 3. Start Supabase
pnpm run db:start

# 4. Get connection details and create .env.local
pnpm run db:status

# 5. Copy .env.local.example to .env.local and fill in values
cp .env.local.example .env.local

# 6. Apply database schema
pnpm run db:setup

# 7. Test everything
pnpm run test:env

# 8. Start development
pnpm dev
```

---

## 🎯 What You Get

### ✅ Complete Development Environment
- **Next.js 14** app running on http://localhost:3000
- **Local Supabase** with PostgreSQL database
- **Supabase Studio** for database management
- **Authentication** system with Google OAuth
- **Italian-first** interface
- **Mobile-responsive** design
- **TypeScript** with full type safety
- **Testing suite** (unit, integration, E2E)

### ✅ Ready-to-Use Features
- 🏠 **Landing page** with value proposition
- 🔐 **Authentication** with Google OAuth
- 📱 **Responsive navigation** for mobile/desktop
- 🗄️ **Database** with users, problems, votes, categories
- 🧪 **Testing environment** with sample data
- 📊 **Analytics** and conversion tracking

---

## 🚀 Next Steps

### Start Building
1. **Explore the code** in `apps/web/src/`
2. **Check the database** at http://localhost:54323
3. **Test authentication** at http://localhost:3000/login
4. **Run tests** with `pnpm test`

### Available Scripts
```bash
pnpm dev              # Start development server
pnpm test             # Run all tests
pnpm run db:status    # Check database status
pnpm run lint         # Check code quality
pnpm build            # Build for production
```

### Key Directories
```
📁 apps/web/           # Main Next.js application
📁 packages/database/  # Database schema and utilities
📁 packages/shared/    # Shared utilities and types
📁 docs/              # Project documentation
📁 scripts/           # Development scripts
```

---

## 🆘 Need Help?

### Quick Fixes
```bash
# Database not working?
pnpm run db:stop && pnpm run db:start

# Environment issues?
pnpm run test:env

# Dependencies issues?
pnpm install

# Reset everything?
pnpm run db:reset && pnpm run db:setup
```

### Common URLs
- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323  
- **API**: http://localhost:54321
- **Docs**: Check `DEVELOPMENT_SETUP.md` for detailed guide

### Support
- Check `DEVELOPMENT_SETUP.md` for comprehensive setup guide
- Look at `docs/` folder for project documentation
- Run `pnpm run test:env` to diagnose issues

---

**🎊 Happy coding! You're ready to build the future of community-driven problem solving!**