# Story 3.4: Category Management System

## Story Overview
**Epic**: Community Engagement  
**Priority**: High  
**Effort**: 8 story points  
**Status**: In Development  

### User Story
As a platform admin, I need a dynamic category management system so that I can organize content effectively, adapt to community needs, and maintain a well-structured problem taxonomy.

## Acceptance Criteria

### AC3.4.1: Category Administration Interface
- **GIVEN** an authenticated admin user
- **WHEN** they access `/admin/categories`
- **THEN** they see a comprehensive category management dashboard with:
  - List of all categories with usage statistics
  - Create new category form
  - Edit/delete actions for existing categories
  - Category ordering controls (drag & drop)
  - Active/inactive status toggles

### AC3.4.2: Category Creation & Editing
- **GIVEN** an admin creating or editing a category
- **WHEN** they submit the category form
- **THEN** they can specify:
  - Category name (2-50 characters, unique)
  - Description (optional, up to 200 characters)
  - Display order/priority
  - Active status (visible to users or hidden)
  - Icon/color selection for visual identification

### AC3.4.3: Category Usage Analytics
- **GIVEN** categories in the system
- **WHEN** admin views category statistics
- **THEN** they see for each category:
  - Total problems count
  - Problems added this week/month
  - Average votes per problem in category
  - User engagement metrics
  - Trending status (growing/declining usage)

### AC3.4.4: Category Migration Tools
- **GIVEN** existing problems in a category
- **WHEN** admin needs to reorganize content
- **THEN** they can:
  - Bulk move problems between categories
  - Merge two categories (move all problems to target category)
  - Split category (create new category and move subset)
  - Preview migration impact before confirmation

### AC3.4.5: Category Recommendations
- **GIVEN** user submitting a new problem
- **WHEN** they type in title/description
- **THEN** system suggests appropriate categories based on:
  - Keyword matching
  - ML-based content analysis
  - Historical categorization patterns
  - Admin-defined keyword mappings

### AC3.4.6: Category Validation & Constraints
- **GIVEN** any category operation
- **WHEN** admin attempts to modify categories
- **THEN** system enforces:
  - Cannot delete category with existing problems (must migrate first)
  - Cannot create duplicate category names
  - Must have at least one active category
  - Category names follow consistent naming conventions

## Technical Requirements

### Database Schema Extensions
```sql
-- Add new fields to categories table
ALTER TABLE categories ADD COLUMN icon_name TEXT DEFAULT 'folder';
ALTER TABLE categories ADD COLUMN color_hex TEXT DEFAULT '#6B7280';
ALTER TABLE categories ADD COLUMN keywords TEXT[]; -- For auto-suggestion
ALTER TABLE categories ADD COLUMN problems_count INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;

-- Category analytics table
CREATE TABLE category_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    problems_added INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, date)
);

-- Category history for audit trails
CREATE TABLE category_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'merged'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints
- `GET /api/admin/categories` - List all categories with analytics
- `POST /api/admin/categories` - Create new category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category (with validation)
- `POST /api/admin/categories/reorder` - Update category display order
- `POST /api/admin/categories/:id/migrate` - Move problems between categories
- `GET /api/categories/suggest` - Get category suggestions for problem content

### Category Enhancement Features

#### Smart Category Suggestions
```typescript
interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1 score
  reasons: string[]; // Why this category was suggested
}

// Example keywords mapping
const categoryKeywords = {
  'tecnologia': ['AI', 'app', 'software', 'digital', 'automazione'],
  'ambiente': ['sostenibile', 'green', 'rifiuti', 'energia', 'clima'],
  'sociale': ['comunità', 'volontariato', 'sociale', 'charity'],
  'economia': ['business', 'finanza', 'startup', 'mercato'],
  'salute': ['salute', 'fitness', 'medicina', 'benessere']
};
```

#### Category Icons & Colors
Predefined icon and color combinations for visual consistency:
```typescript
const categoryIcons = [
  'laptop', 'leaf', 'users', 'trending-up', 'heart',
  'shield', 'home', 'book', 'globe', 'star'
];

const categoryColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];
```

## Implementation Tasks

### Phase 1: Enhanced Category Model (2 days)
1. **Database Migration**: Add new category fields and analytics tables
2. **Category Entity**: Update TypeScript types and Supabase schema
3. **Seed Data Update**: Enhance existing categories with icons/colors

### Phase 2: Admin Interface (3 days)
1. **Category Dashboard**: Admin overview with statistics
2. **CRUD Operations**: Create, edit, delete category forms
3. **Drag & Drop Ordering**: Visual category reordering
4. **Validation Logic**: Enforce business rules and constraints

### Phase 3: Analytics & Migration (2 days)
1. **Usage Analytics**: Track category performance metrics
2. **Migration Tools**: Bulk problem movement between categories
3. **Audit Trails**: Track all category changes for compliance

### Phase 4: Smart Suggestions (1 day)
1. **Suggestion Algorithm**: Keyword-based category recommendations
2. **Integration**: Add suggestions to problem creation form
3. **Learning System**: Track suggestion accuracy for improvements

## Testing Requirements

### Unit Tests
- Category CRUD operations
- Validation rules enforcement
- Analytics calculation logic
- Suggestion algorithm accuracy

### Integration Tests
- Admin authentication for category operations
- Problem-category relationship integrity
- Migration operation atomicity
- API endpoint functionality

### User Acceptance Tests
- Admin can create/edit categories efficiently
- Category suggestions improve user experience
- Migration tools work without data loss
- Analytics provide actionable insights

## Security Considerations

### Admin Authorization
- Only admin users can access category management
- Action logging for audit compliance
- Rate limiting on category operations
- Input sanitization for category data

### Data Integrity
- Foreign key constraints prevent orphaned problems
- Transaction rollback for failed migrations
- Backup procedures before major changes
- Validation of category relationships

## Success Metrics

### Content Organization
- Category distribution balance (no category >40% of problems)
- User category selection accuracy >80%
- Admin category management efficiency >90%
- Suggestion acceptance rate >60%

### System Performance
- Category list load time <1 second
- Migration operations complete <30 seconds
- Suggestion generation <500ms
- Analytics dashboard refresh <3 seconds

## Definition of Done

- [ ] Database migrations executed successfully
- [ ] Admin can create, edit, delete, and reorder categories
- [ ] Category analytics dashboard displays usage metrics
- [ ] Migration tools allow bulk problem movement
- [ ] Smart category suggestions work in problem creation
- [ ] Icons and colors enhance visual category identification
- [ ] All admin operations logged for audit trails
- [ ] Validation prevents data integrity issues
- [ ] API endpoints secured with admin authentication
- [ ] Unit and integration tests pass
- [ ] Performance metrics meet requirements
- [ ] User acceptance testing completed

## Dependencies
- Admin authentication system (Epic 1)
- Problem-category relationships (Epic 2)
- Content management system (Story 3.3)

## Integration Points

### With Story 3.3 (Content Management)
- Category assignment during problem moderation
- Bulk category operations in admin dashboard
- Featured content can be filtered by category

### With Problem Creation (Epic 2)
- Enhanced category selection with suggestions
- Visual category identification with icons/colors
- Improved user experience in problem submission

### With Search & Discovery (Epic 2)
- Category-based filtering and navigation
- Category analytics inform search optimization
- Category trends influence content discovery

## Risks & Mitigation

**Risk**: Category proliferation leads to fragmentation
**Mitigation**: Set limits on category creation, require admin approval

**Risk**: Poor category suggestions frustrate users
**Mitigation**: A/B testing, user feedback collection, continuous improvement

**Risk**: Migration operations cause data loss
**Mitigation**: Comprehensive testing, transaction rollback, backup procedures

**Risk**: Analytics performance impact on dashboard
**Mitigation**: Efficient queries, caching, background calculation