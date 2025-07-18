# Contributing to WikiGaiaLab

Thank you for your interest in contributing to WikiGaiaLab! We welcome contributions from everyone, whether you're a seasoned developer or just starting out. This guide will help you get started.

## 🎯 Mission

WikiGaiaLab is a community-driven platform for solving real-world problems through collaborative app development. Our mission is to democratize innovation by connecting problem-solvers with developers and creating solutions that benefit everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## 📜 Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@wikigaialab.com](mailto:conduct@wikigaialab.com).

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Docker** (for local Supabase)
- **Git** for version control
- **pnpm** (recommended package manager)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/wikigaialab.git
   cd wikigaialab
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   # Run the automated setup script
   npm run setup:dev
   
   # Or manual setup:
   npm run db:start     # Start local Supabase
   npm run db:reset     # Apply migrations and seed data
   npm run db:generate  # Generate TypeScript types
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Visit http://localhost:3000
   - Check Supabase Studio at http://localhost:54323
   - Run tests: `npm test`

## 🔧 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix issues and improve stability
- ✨ **New features** - Add functionality that benefits users
- 📚 **Documentation** - Improve or add documentation
- 🎨 **UI/UX improvements** - Enhance user experience
- ⚡ **Performance optimizations** - Make the app faster
- 🔒 **Security enhancements** - Improve security
- 🧪 **Tests** - Add or improve test coverage
- 🔧 **Tooling** - Improve development experience

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Create an issue** to discuss significant changes
3. **Fork the repository** and create a feature branch
4. **Follow coding standards** and write tests
5. **Update documentation** if needed

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm test              # Run all tests
   npm run lint          # Check code style
   npm run type-check    # TypeScript checking
   npm run build         # Ensure it builds
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📥 Pull Request Process

1. **Use the PR Template** - Fill out all sections
2. **Link Related Issues** - Reference any related issues
3. **Add Screenshots** - For UI changes, include before/after screenshots
4. **Write Clear Descriptions** - Explain what changes and why
5. **Ensure CI Passes** - All tests and checks must pass
6. **Request Review** - Tag relevant maintainers
7. **Address Feedback** - Make requested changes promptly

### PR Requirements

- [ ] Tests pass (unit, integration, e2e)
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards met

## 🐛 Issue Guidelines

### Before Creating an Issue

- Search existing issues first
- Check if it's already fixed in the latest version
- Gather all relevant information

### Issue Types

- **Bug Reports** - Use the bug report template
- **Feature Requests** - Use the feature request template
- **Documentation** - For documentation improvements
- **Security** - For security-related issues (email privately for vulnerabilities)

### Issue Quality

Good issues include:
- Clear, descriptive titles
- Detailed descriptions
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots/videos when helpful
- Environment details (browser, OS, etc.)

## 🎨 Code Style

### General Guidelines

- Use **TypeScript** for type safety
- Follow **ESLint** and **Prettier** configurations
- Write **self-documenting code** with clear variable names
- Add **JSDoc comments** for complex functions
- Use **meaningful commit messages**

### Code Organization

```
apps/
├── web/                 # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # Reusable components
│   │   ├── hooks/      # Custom hooks
│   │   └── lib/        # Utility functions
packages/
├── database/           # Database schemas and migrations
├── shared/            # Shared utilities and types
└── ui/               # UI component library
```

### Component Guidelines

- Use **functional components** with hooks
- Implement **proper TypeScript interfaces**
- Add **error boundaries** for critical components
- Follow **accessibility best practices**
- Use **CSS-in-JS** or **Tailwind CSS**

### Database Guidelines

- Use **Supabase/PostgreSQL** best practices
- Write **proper migrations**
- Add **proper indexing**
- Use **Row Level Security (RLS)**
- Document **schema changes**

## 🧪 Testing

### Testing Strategy

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test feature workflows
- **End-to-End Tests** - Test complete user journeys
- **Manual Testing** - Test on different devices/browsers

### Writing Tests

```typescript
// Unit test example
describe('UserProfile', () => {
  it('should display user name', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Test Requirements

- **Minimum 80% code coverage** for new features
- **Test both happy and error paths**
- **Mock external dependencies**
- **Use descriptive test names**

## 📚 Documentation

### What to Document

- **Code changes** - Update relevant documentation
- **New features** - Add usage examples
- **API changes** - Update API documentation
- **Breaking changes** - Document migration steps

### Documentation Standards

- Use **clear, concise language**
- Add **code examples** where helpful
- Include **screenshots** for UI features
- Keep documentation **up to date**

## 🌟 Recognition

Contributors are recognized in:
- GitHub contributor list
- Monthly contributor highlights
- Annual contributor awards
- Project acknowledgments

## 🏷️ Commit Message Guidelines

Use conventional commits:

```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
style: format code with prettier
refactor: simplify user validation
test: add unit tests for auth
chore: update dependencies
```

## 📞 Getting Help

### Communication Channels

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and ideas
- **Discord** - For real-time chat (coming soon)
- **Email** - [contributors@wikigaialab.com](mailto:contributors@wikigaialab.com)

### Mentorship

New contributors can request mentorship for:
- First-time contributions
- Complex feature development
- Code review guidance
- Architecture discussions

## 🎉 First-Time Contributors

Welcome! Here are some good first issues:
- Documentation improvements
- Bug fixes with clear reproduction steps
- UI/UX enhancements
- Test coverage improvements

Look for issues labeled `good first issue` or `help wanted`.

## 📈 Roadmap

Check our [project roadmap](https://github.com/wikigaialab/wikigaialab/projects) to see:
- Current priorities
- Upcoming features
- Long-term goals
- How you can contribute

## 🙏 Thank You

Every contribution, no matter how small, helps make WikiGaiaLab better. Thank you for being part of our community!

---

**Questions?** Feel free to reach out to the maintainers or create a GitHub discussion. We're here to help! 🚀