# WikiGaiaLab Database Package

## Overview

This package provides the complete database layer for WikiGaiaLab, including schema definitions, migrations, TypeScript types, utility functions, and validation schemas. It's built on top of Supabase PostgreSQL with comprehensive support for real-time features, Row Level Security (RLS), and performance optimization.

## Architecture

### Core Components

- **Schema Management**: Complete PostgreSQL schema with proper relationships and constraints
- **Migrations**: Versioned migration system for schema evolution
- **TypeScript Types**: Comprehensive type definitions for all database entities
- **Utility Functions**: High-level operations for common database tasks
- **Validation**: Zod-based validation schemas for data integrity
- **Real-time Support**: Supabase real-time subscriptions for live updates
- **Security**: Row Level Security policies for data protection

### Database Schema

The database consists of five core tables:

1. **users** - User profiles and authentication data
2. **problems** - Community-proposed problems
3. **votes** - User votes on problems
4. **categories** - Problem categorization
5. **apps** - Developed solutions linked to problems

## Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

## Usage

### Basic Usage

```typescript
import { supabase, getUserProfile, createProblem, castVote } from '@wikigaialab/database';

// Get user profile with related data
const userProfile = await getUserProfile(userId);

// Create a new problem
const problem = await createProblem({
  proposer_id: userId,
  title: 'New Problem Title',
  description: 'Problem description...',
  category_id: categoryId,
});

// Cast a vote
const voteResult = await castVote(userId, problemId);
```

### Database Utilities

The package provides utility functions for common operations:

```typescript
// User operations
import { getUserProfile, updateUserProfile, getUserStats } from '@wikigaialab/database';

// Problem operations
import { getProblems, getProblemWithDetails, createProblem } from '@wikigaialab/database';

// Vote operations
import { castVote, removeVote, toggleVote } from '@wikigaialab/database';

// Category operations
import { getActiveCategories, createCategory, getCategoriesWithCounts } from '@wikigaialab/database';

// App operations
import { getPublishedApps, getAppBySlug, createApp } from '@wikigaialab/database';
```

### Validation

Use Zod schemas for data validation:

```typescript
import { validateProblemInsert, validateUserUpdate } from '@wikigaialab/database';

// Validate problem data
const validation = validateProblemInsert({
  proposer_id: userId,
  title: 'Problem Title',
  description: 'Problem description...',
  category_id: categoryId,
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
} else {
  // Use validation.data for type-safe data
  const problem = await createProblem(validation.data);
}
```

### Real-time Subscriptions

Subscribe to real-time updates:

```typescript
import { subscribeToVotes, subscribeToProblems } from '@wikigaialab/database';

// Subscribe to vote changes
const unsubscribe = subscribeToVotes((event) => {
  console.log('Vote event:', event);
  // Handle vote changes
});

// Subscribe to problem changes
const unsubscribeProblems = subscribeToProblems((event) => {
  console.log('Problem event:', event);
  // Handle problem changes
});

// Cleanup subscriptions
unsubscribe();
unsubscribeProblems();
```

## Database Setup

### Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Migrations

To set up the database schema:

1. **Initial Schema**: Creates all tables, constraints, and indexes
2. **Triggers**: Adds database triggers for real-time updates
3. **RLS Policies**: Configures Row Level Security
4. **Seed Data**: Populates initial data for development

```sql
-- Run migrations in order
\\i packages/database/src/migrations/001_initial_schema.sql
\\i packages/database/src/migrations/002_triggers.sql
\\i packages/database/src/migrations/003_rls_policies.sql
\\i packages/database/src/migrations/004_seed_data.sql
```

### Migration Management

```typescript
import { getMigrations, getMigration, validateMigrations } from '@wikigaialab/database';

// Get all migrations
const migrations = getMigrations();

// Get specific migration
const migration = getMigration('001');

// Validate migration order
const validation = validateMigrations();
if (!validation.isValid) {
  console.error('Migration validation errors:', validation.errors);
}
```

## Schema Details

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'google',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_votes_cast INTEGER DEFAULT 0,
    total_problems_proposed INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'free',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Problems Table

```sql
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposer_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    status TEXT DEFAULT 'Proposed',
    vote_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Votes Table

```sql
CREATE TABLE votes (
    user_id UUID NOT NULL REFERENCES users(id),
    problem_id UUID NOT NULL REFERENCES problems(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);
```

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

- **Users**: Can view all profiles, update own profile
- **Problems**: Can view all, create own, update own, admins can manage all
- **Votes**: Can view all, cast own votes, delete own votes
- **Categories**: Users can view active, admins can manage all
- **Apps**: Users can view published, admins can manage all

### Data Validation

- Email format validation
- UUID format validation
- Business rule validation (e.g., no self-voting)
- Input sanitization and length limits
- Status transition validation

## Performance Features

### Indexes

Comprehensive indexing strategy for common queries:

- **Problems**: Status, category, vote count, timestamps
- **Votes**: User ID, problem ID, timestamps
- **Categories**: Order index, active status
- **Users**: Email, admin status, subscription status
- **Apps**: Problem ID, slug, published status

### Query Optimization

- Efficient pagination support
- Optimized vote counting with triggers
- Real-time updates without polling
- Composite indexes for complex queries

## Testing

The package includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run specific test files
pnpm test validation.test.ts
pnpm test migrations.test.ts
```

### Test Coverage

- **Validation Tests**: All Zod schemas and custom validators
- **Migration Tests**: Migration structure and content validation
- **Database Operations**: CRUD operations and business logic
- **Security Tests**: RLS policy validation
- **Performance Tests**: Query optimization verification

## API Reference

### User Operations

```typescript
// Get user profile with related data
getUserProfile(userId: string): Promise<DatabaseOperationResult<UserProfile>>

// Create or update user profile
upsertUserProfile(userData: UserInsert): Promise<DatabaseOperationResult<User>>

// Update user profile
updateUserProfile(userId: string, updates: UserUpdate): Promise<DatabaseOperationResult<User>>

// Get user statistics
getUserStats(userId: string): Promise<DatabaseOperationResult<UserStats>>

// Get user's voting history
getUserVotingHistory(userId: string, options?: PaginationOptions): Promise<DatabaseOperationResult<{ data: any[]; count: number }>>
```

### Problem Operations

```typescript
// Get problem with full details
getProblemWithDetails(problemId: string, userId?: string): Promise<DatabaseOperationResult<ProblemWithDetails>>

// Get problems with filtering and sorting
getProblems(filters?: ProblemFilters, sortOptions?: ProblemSortOptions, pagination?: PaginationOptions): Promise<DatabaseOperationResult<{ data: ProblemWithDetails[]; count: number }>>

// Create a new problem
createProblem(problemData: ProblemInsert): Promise<DatabaseOperationResult<Problem>>

// Update a problem
updateProblem(problemId: string, updates: ProblemUpdate): Promise<DatabaseOperationResult<Problem>>

// Get trending problems
getTrendingProblems(limit?: number): Promise<DatabaseOperationResult<ProblemWithDetails[]>>
```

### Vote Operations

```typescript
// Cast a vote for a problem
castVote(userId: string, problemId: string): Promise<DatabaseOperationResult<VotingResult>>

// Remove a vote from a problem
removeVote(userId: string, problemId: string): Promise<DatabaseOperationResult<VotingResult>>

// Toggle vote (cast if not voted, remove if voted)
toggleVote(userId: string, problemId: string): Promise<DatabaseOperationResult<VotingResult>>

// Check if user has voted on a problem
hasUserVoted(userId: string, problemId: string): Promise<DatabaseOperationResult<boolean>>
```

### Category Operations

```typescript
// Get all active categories
getActiveCategories(): Promise<DatabaseOperationResult<Category[]>>

// Get categories with problem counts
getCategoriesWithCounts(): Promise<DatabaseOperationResult<CategoryWithStats[]>>

// Create a new category
createCategory(categoryData: CategoryInsert): Promise<DatabaseOperationResult<Category>>

// Update a category
updateCategory(categoryId: string, updates: CategoryUpdate): Promise<DatabaseOperationResult<Category>>

// Reorder categories
reorderCategories(categoryOrders: { id: string; order_index: number }[]): Promise<DatabaseOperationResult<void>>
```

### App Operations

```typescript
// Get all published apps
getPublishedApps(options?: PaginationOptions): Promise<DatabaseOperationResult<{ data: AppWithDetails[]; count: number }>>

// Get app by slug
getAppBySlug(slug: string): Promise<DatabaseOperationResult<AppWithDetails>>

// Create a new app
createApp(appData: AppInsert): Promise<DatabaseOperationResult<App>>

// Update an app
updateApp(appId: string, updates: AppUpdate): Promise<DatabaseOperationResult<App>>

// Publish an app
publishApp(appId: string): Promise<DatabaseOperationResult<App>>
```

## Development Guidelines

### Adding New Features

1. **Schema Changes**: Add new migration files with proper numbering
2. **Type Updates**: Update TypeScript types in `types.ts`
3. **Validation**: Add Zod schemas for new entities
4. **Utilities**: Create utility functions for common operations
5. **Tests**: Add comprehensive tests for new functionality
6. **Documentation**: Update README and inline documentation

### Best Practices

1. **Always use transactions** for multi-table operations
2. **Validate input data** before database operations
3. **Handle errors gracefully** with proper error types
4. **Use RLS policies** for security
5. **Optimize queries** with appropriate indexes
6. **Test thoroughly** including edge cases

## Troubleshooting

### Common Issues

1. **Migration Errors**: Check migration order and dependencies
2. **RLS Policy Conflicts**: Verify user permissions and policy logic
3. **Performance Issues**: Check query plans and index usage
4. **Validation Errors**: Review Zod schemas and input data
5. **Real-time Issues**: Verify Supabase connection and subscriptions

### Debug Mode

Enable debug logging for development:

```typescript
// Enable query logging
const { data, error } = await supabase
  .from('problems')
  .select('*')
  .explain({ analyze: true, verbose: true });
```

## Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all validations pass
5. Test with real Supabase instance

## License

This package is part of the WikiGaiaLab project and follows the project's license terms.

---

**Author**: James (Dev Agent)  
**Date**: 2025-07-17  
**Version**: 1.0.0