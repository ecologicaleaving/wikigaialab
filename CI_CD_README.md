# CI/CD Pipeline Documentation

This document describes the CI/CD pipeline setup for WikiGaiaLab.

## 🚀 Pipeline Overview

Our CI/CD pipeline is built with GitHub Actions and includes:

- **Continuous Integration** (CI) - Automated testing and quality checks
- **Continuous Deployment** (CD) - Automated deployments to staging and production
- **Security Monitoring** - Dependency audits and vulnerability checks
- **Performance Monitoring** - Lighthouse audits and performance regression detection
- **Release Management** - Automated releases with semantic versioning

## 📋 Workflows

### 1. Main CI/CD Pipeline (`ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests
**Jobs**:
- **Lint and Type Check** - ESLint, TypeScript validation
- **Test** - Unit and integration tests with PostgreSQL
- **Security Audit** - Dependency vulnerability scanning
- **Deploy Staging** - Auto-deploy `develop` branch to staging
- **Deploy Production** - Auto-deploy `main` branch to production

### 2. PR Preview (`pr-preview.yml`)

**Triggers**: Pull request opened/updated
**Features**:
- Deploys preview environment for each PR
- Comments on PR with preview URL
- Includes testing checklist
- Mobile and accessibility preview links

### 3. Dependency Updates (`dependency-update.yml`)

**Triggers**: Weekly schedule (Mondays 9 AM UTC), Manual trigger
**Features**:
- Automated dependency updates
- Security vulnerability fixes
- Automated testing after updates
- Creates PR with changes
- Weekly security audit reports

### 4. Performance Monitoring (`performance-monitoring.yml`)

**Triggers**: Daily schedule, Deployment events
**Features**:
- Lighthouse performance audits
- Bundle size analysis
- Uptime monitoring
- Performance regression detection
- Automated issue creation for problems

### 5. Release Management (`release.yml`)

**Triggers**: Git tags (v*)
**Features**:
- Semantic version validation
- Automated changelog generation
- Production deployment
- Post-release tasks
- Rollback on failure
- Health checks

## 🔧 Setup Instructions

### 1. Required GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Vercel Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# Lighthouse CI (Optional)
LHCI_GITHUB_APP_TOKEN=your-lighthouse-token

# Database (for testing)
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
```

### 2. Environment Setup

The pipeline expects:
- Node.js 18+
- pnpm package manager
- PostgreSQL database for testing
- Vercel for deployment

### 3. Branch Protection

Configure branch protection for `main`:
- Require PR reviews
- Require status checks
- Require branches to be up to date
- Restrict pushes to specific people/teams

## 🎯 Quality Gates

### Code Quality
- ✅ ESLint passes
- ✅ TypeScript compilation successful
- ✅ Tests pass (unit + integration)
- ✅ Security audit clean
- ✅ Build successful

### Performance
- ✅ Lighthouse score > 80 (performance)
- ✅ Lighthouse score > 95 (accessibility)
- ✅ Bundle size within limits
- ✅ No performance regressions

### Security
- ✅ No high/critical vulnerabilities
- ✅ Dependencies up to date
- ✅ Security headers configured
- ✅ Sensitive data not exposed

## 📊 Monitoring

### Automated Monitoring
- **Uptime checks** - Every 6 hours
- **Performance audits** - Daily
- **Security scans** - Weekly
- **Dependency updates** - Weekly

### Alert Conditions
- Website downtime
- Performance regression > 10%
- Security vulnerabilities found
- Build failures
- Test failures

## 🚀 Deployment Process

### Staging Deployment
1. Push to `develop` branch
2. CI pipeline runs automatically
3. If all checks pass, deploys to staging
4. Available at staging.wikigaialab.com

### Production Deployment
1. Create release tag (e.g., `v1.0.0`)
2. Release workflow runs
3. Full test suite executes
4. Deploys to production
5. Health checks run
6. GitHub release created

### Rollback Process
1. Automatic rollback on deployment failure
2. Issue created for investigation
3. Manual rollback available via GitHub Actions
4. Database rollback (if needed)

## 🔍 Testing Strategy

### Unit Tests
- Component testing with Jest + React Testing Library
- Utility function testing
- Hook testing
- Minimum 80% code coverage

### Integration Tests
- API endpoint testing
- Database integration testing
- Authentication flow testing
- Real database with PostgreSQL

### End-to-End Tests
- Critical user journeys
- Cross-browser testing
- Mobile responsiveness
- Performance testing

## 📈 Performance Metrics

### Lighthouse Targets
- Performance: > 80
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: > 60

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## 🔐 Security Measures

### Dependency Security
- Weekly vulnerability scans
- Automated security updates
- Dependency audit reports
- Critical vulnerability alerts

### Code Security
- ESLint security rules
- TypeScript strict mode
- Input validation
- XSS protection
- CSRF protection

## 📝 Contributing

### PR Requirements
- All CI checks must pass
- Code review required
- Tests added for new features
- Documentation updated
- No security vulnerabilities

### Release Process
1. Create PR to `main`
2. Code review and approval
3. Merge to `main`
4. Create release tag
5. Automated deployment

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version compatibility
- Verify dependencies are locked
- Review TypeScript errors
- Check test failures

**Deployment Issues**
- Verify Vercel configuration
- Check environment variables
- Review build logs
- Test locally first

**Test Failures**
- Check database connection
- Verify test data setup
- Review test isolation
- Check async operations

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review error messages carefully
3. Test locally with same Node.js version
4. Check secret configuration
5. Open issue if needed

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Lighthouse CI Setup](https://github.com/GoogleChrome/lighthouse-ci)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint Configuration](https://eslint.org/)

---

**Questions?** Open an issue or check the GitHub Actions logs for detailed error information. 🚀