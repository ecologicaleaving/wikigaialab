# WikiGaiaLab Web Application

Community-driven problem solving platform built with Next.js 14, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account (for database)

### Development Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd WikiGaiaLab/apps/web
   pnpm install
   ```

2. **Environment Configuration**:
   - Copy `.env.example` to `.env.local`
   - Configure your Supabase credentials in `.env.local`

3. **Quick Setup Script**:
   ```bash
   ./setup-dev.sh
   ```

4. **Manual Setup**:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## 📱 Key Features

### ✅ Implemented Features

- **User Authentication** with Google OAuth via Supabase
- **Problem Submission System** with real-time voting
- **Advanced Search & Discovery** with filters and categories
- **Premium Feature System** based on community participation
- **Admin Dashboard** with comprehensive management tools
- **Monitoring & Analytics** with real-time system metrics
- **Volantino Generator App** - AI-powered flyer creation tool
- **Responsive Design** optimized for mobile and desktop

### 🔧 Technical Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with Google OAuth
- **Monitoring**: Custom monitoring system with health checks
- **CI/CD**: GitHub Actions with automated testing

## 🎯 Main Application Areas

### User Features
- **Problems Page**: `/problems` - Browse and vote on community problems
- **Apps Catalog**: `/apps` - Discover and use developed solutions
- **User Profile**: `/profile` - Manage account and view activity history

### Demo Applications
- **Volantino Generator**: `/apps/volantino-generator` - Create professional flyers with AI

### Admin Features
- **Admin Dashboard**: `/admin` - System management and analytics
- **Content Management**: `/admin/content` - Manage problems and user content
- **Monitoring**: `/admin/monitoring` - System health and performance metrics
- **Quality Assurance**: `/admin/quality` - Code quality and testing reports

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

### Project Structure

```
src/
├── app/                 # Next.js 14 App Router
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard
│   ├── apps/           # Application pages
│   └── problems/       # Problem management
├── components/         # Reusable React components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── types/             # TypeScript type definitions
```

### Environment Variables

Required environment variables (see `.env.local`):

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Business Configuration
PREMIUM_ACCESS_VOTE_THRESHOLD=5
PROBLEM_DEVELOPMENT_THRESHOLD=100

# Security
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Mock Services (Development)
MOCK_EMAIL_SERVICE=true
MOCK_PAYMENT_SERVICE=true
```

## 🗄️ Database Setup

The application uses Supabase (PostgreSQL) with:

- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Automated migrations** for schema management

Key tables:
- `users` - User profiles and authentication
- `problems` - Community problems and proposals
- `votes` - User voting records
- `apps` - Application catalog
- `app_volantino_flyers` - Volantino Generator data

## 🔍 Monitoring & Analytics

### Built-in Monitoring

- **Health Checks**: `/api/health` - System status endpoint
- **Metrics Collection**: `/api/monitoring/metrics` - Performance data
- **Real-time Monitoring**: Custom monitoring dashboard
- **Error Tracking**: Comprehensive error logging

### Analytics Dashboard

Access the admin monitoring dashboard at `/admin/monitoring` to view:
- System performance metrics
- User activity analytics
- Database health status
- API response times
- Error rates and alerts

## 🚀 Deployment

### Production Deployment

1. **Build the application**:
   ```bash
   pnpm build
   ```

2. **Configure production environment**:
   - Set production environment variables
   - Configure Supabase for production
   - Set up monitoring services

3. **Deploy** (recommended platforms):
   - Vercel (optimized for Next.js)
   - Netlify
   - Railway
   - Self-hosted with Docker

### Environment Setup

For production deployment, ensure all required environment variables are configured:

- Database credentials
- Authentication providers
- External API keys (if using AI features)
- Monitoring services
- Payment processing (if enabled)

## 📊 Performance

### Current Performance Metrics

- **Build Time**: ~45 seconds
- **Bundle Size**: ~2.3MB (optimized)
- **Load Time**: <3 seconds on 3G
- **Lighthouse Score**: 90+ (Performance, Accessibility, SEO)

### Performance Optimization

- Code splitting with Next.js
- Image optimization
- Database query optimization
- Caching strategies
- CDN integration ready

## 🔐 Security

### Implemented Security Features

- **Authentication**: Secure OAuth with Supabase
- **Authorization**: Row Level Security (RLS)
- **Input Validation**: Comprehensive validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Proper origin controls
- **Environment Security**: Secure environment variable handling

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Development Tools
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the GitHub issues page
- Review the documentation
- Contact the development team

---

**WikiGaiaLab** - Community-driven innovation platform