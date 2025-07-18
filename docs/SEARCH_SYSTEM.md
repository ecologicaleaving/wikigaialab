# WikiGaiaLab Advanced Search System

## Overview

WikiGaiaLab's advanced search system provides comprehensive search and filtering capabilities for community problems, enabling users to quickly discover relevant content through intelligent search algorithms, real-time suggestions, and powerful filtering options.

## Features

### 🔍 Core Search Capabilities
- **Full-text search** across problem titles and descriptions
- **Real-time search suggestions** with autocomplete
- **Advanced filtering** by category, status, proposer, vote count, and date ranges
- **Multiple sorting options**: relevance, popularity, date, trending
- **Search result highlighting** for better visibility
- **URL-based search state** for shareable searches
- **Search analytics** for performance tracking

### 🎯 Smart Features
- **Debounced search input** (300ms default) for optimal performance
- **Trending algorithm** that considers both votes and recency
- **Fuzzy text matching** for typo tolerance
- **Search ranking system** based on engagement and freshness
- **Performance optimization** with under 200ms response times

## Architecture

### API Endpoints

#### Search Problems
```
GET /api/search/problems
```

**Query Parameters:**
- `q`: Search query string
- `category`: Filter by category UUID
- `status`: Filter by problem status
- `proposer`: Filter by proposer UUID  
- `min_votes`, `max_votes`: Vote count range
- `date_from`, `date_to`: Date range filters
- `sort_by`: `relevance` | `vote_count` | `created_at` | `updated_at` | `trending`
- `sort_order`: `asc` | `desc`
- `page`, `limit`: Pagination parameters
- `highlight`: Enable result highlighting
- `search_id`: Analytics tracking ID

**Response:**
```json
{
  "data": {
    "problems": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 98,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    },
    "search": {
      "query": "AI assistente",
      "filters": {...},
      "sort": {...},
      "highlighting": true,
      "search_id": "search_1234567890_abc"
    }
  }
}
```

#### Search Suggestions
```
GET /api/search/suggestions
```

**Query Parameters:**
- `q`: Query string (minimum 1 character)
- `limit`: Maximum suggestions (default: 5, max: 10)
- `type`: `titles` | `categories` | `mixed`

**Response:**
```json
{
  "data": {
    "suggestions": [
      {
        "text": "Piattaforma AI per assistenza coding",
        "type": "title",
        "count": 42
      },
      {
        "text": "Tecnologia",
        "type": "category",
        "id": "uuid-here",
        "count": 15
      }
    ],
    "query": "AI",
    "type": "mixed",
    "total": 2
  }
}
```

### React Hooks

#### useAdvancedSearch
Main hook for search functionality with state management, URL synchronization, and debouncing.

```typescript
const {
  filters,           // Current search filters
  results,           // Search results
  pagination,        // Pagination info
  loading,           // Loading state
  error,             // Error message
  activeFiltersCount, // Number of active filters
  hasSearchCriteria, // Whether any search/filters are active
  updateFilters,     // Update filters function
  clearFilters,      // Clear all filters
  goToPage,         // Navigate to page
} = useAdvancedSearch({
  highlightResults: true,
  trackAnalytics: true,
  debounceMs: 300,
});
```

#### useSearchSuggestions
Dedicated hook for search autocomplete functionality.

```typescript
const {
  suggestions,       // Array of suggestions
  suggestionsByType, // Grouped by type
  loading,           // Loading state
  updateQuery,       // Update search query
  clearSuggestions,  // Clear suggestions
  hasSuggestions,    // Whether suggestions exist
} = useSearchSuggestions({
  maxSuggestions: 5,
  debounceMs: 200,
  suggestionType: 'mixed',
});
```

### Components

#### AdvancedSearchFilters
Complete search interface with:
- Search input with autocomplete
- Sort dropdown
- Expandable advanced filters
- Active filter badges
- Clear filters functionality

```tsx
<AdvancedSearchFilters
  filters={filters}
  onFiltersChange={updateFilters}
  onClearFilters={clearFilters}
  activeFiltersCount={activeFiltersCount}
  categories={categories}
  proposers={proposers}
  loading={loading}
/>
```

#### SearchResults
Results display with:
- Search result cards
- Pagination controls
- Empty state handling
- Loading skeletons
- Vote functionality integration

```tsx
<SearchResults
  results={results}
  loading={loading}
  query={filters.query}
  totalCount={pagination.totalCount}
  pagination={pagination}
  onPageChange={goToPage}
  onQuickVote={handleQuickVote}
  isAuthenticated={!!user}
/>
```

#### SearchInput
Standalone search input with suggestions:
- Real-time autocomplete
- Keyboard navigation
- Grouped suggestions by type
- Loading indicators

```tsx
<SearchInput
  value={query}
  onChange={setQuery}
  onSuggestionSelect={handleSuggestionSelect}
  showSuggestions={true}
  maxSuggestions={5}
/>
```

## Database Optimization

### Performance Features
- **Full-text search indexes** using PostgreSQL tsvector
- **Trigram indexes** for fuzzy matching
- **Composite indexes** for complex filtering
- **Search ranking function** for relevance scoring
- **Materialized view** for search analytics

### Key Indexes
```sql
-- Full-text search
CREATE INDEX idx_problems_search_vector ON problems USING gin(search_vector);

-- Trigram fuzzy search
CREATE INDEX idx_problems_title_trgm ON problems USING gin(title gin_trgm_ops);

-- Composite search + filter
CREATE INDEX idx_problems_search_category ON problems USING gin(search_vector, category_id);

-- Search ranking
CREATE INDEX idx_problems_search_rank ON problems(search_rank DESC, created_at DESC);
```

### Search Ranking Algorithm
```sql
-- Combines multiple factors for relevance
calculate_search_rank(vote_count, created_at, updated_at) =
  age_factor * 0.3 + engagement_factor * 0.6 + recency_bonus
```

## Analytics & Monitoring

### Tracked Events
- `search_problems`: Full search operations
- `search_suggestions`: Suggestion requests

### Metrics Collected
- Search query terms
- Filter usage patterns
- Results count and quality
- User engagement with results
- Performance metrics

### Analytics Dashboard
Access search insights via:
- Search volume trends
- Popular search terms
- Zero-result queries
- Filter usage patterns
- Performance monitoring

## Performance Specifications

### Response Times
- **Search results**: < 200ms (target), < 500ms (maximum)
- **Suggestions**: < 100ms (target), < 200ms (maximum)
- **Large datasets**: Optimized for 10,000+ problems

### Optimizations
- **Debounced inputs**: Reduces API calls by 80-90%
- **Indexed searches**: 10-100x faster than table scans
- **Pagination**: Prevents large payload transfers
- **Caching**: Suggestion results cached for common queries

## Usage Examples

### Basic Search
```typescript
// Simple text search
updateFilters({ query: "AI assistente" });

// Search with category filter
updateFilters({ 
  query: "piattaforma", 
  category: "tech-category-uuid" 
});
```

### Advanced Filtering
```typescript
// Complex search with multiple filters
updateFilters({
  query: "sviluppo",
  category: "tech-uuid",
  status: "Proposed",
  minVotes: 10,
  dateFrom: "2024-01-01",
  sortBy: "trending",
  sortOrder: "desc"
});
```

### URL-based Searches
```
# Shareable search URLs
/problems?q=AI&category=tech-uuid&sort_by=vote_count&sort_order=desc&page=2
```

## Best Practices

### For Developers
1. **Always use debounced inputs** for search queries
2. **Implement proper loading states** for better UX
3. **Handle empty states gracefully** with helpful messaging
4. **Use URL state** for shareable and bookmarkable searches
5. **Monitor search analytics** for optimization opportunities

### For Users
1. **Use specific terms** for better results
2. **Leverage filters** to narrow down results
3. **Try different sort options** for different needs
4. **Use trending sort** to discover popular problems
5. **Bookmark useful searches** via URL sharing

## Troubleshooting

### Common Issues

**Slow search performance:**
- Check database indexes are created
- Monitor query execution plans
- Consider result pagination

**No search results:**
- Verify search terms spelling
- Try broader search terms
- Check active filters
- Use suggestions for guidance

**Suggestions not appearing:**
- Ensure minimum query length (2 characters)
- Check network connectivity
- Verify API endpoint availability

### Debugging

```typescript
// Enable debug mode in development
const searchHook = useAdvancedSearch({
  // ... other options
  debounceMs: 0, // Disable debouncing for testing
});

// Monitor search performance
console.log('Search took:', performance.now() - startTime, 'ms');
```

## Future Enhancements

### Planned Features
- **AI-powered search** with semantic understanding
- **Search result caching** for common queries
- **Advanced search syntax** (boolean operators, quotes)
- **Saved searches** and search alerts
- **Voice search** capability
- **Multi-language search** support

### Performance Improvements
- **Elasticsearch integration** for advanced text search
- **Redis caching** for frequent queries
- **Search result prefetching**
- **CDN integration** for static search components

## API Rate Limits

| Endpoint | Limit | Window |
|----------|--------|--------|
| Search Problems | 100 requests | 15 minutes |
| Search Suggestions | 200 requests | 15 minutes |

## Contributing

When contributing to the search system:

1. **Maintain backwards compatibility** for existing API endpoints
2. **Add comprehensive tests** for new features
3. **Update this documentation** for any changes
4. **Monitor performance impact** of modifications
5. **Follow existing code patterns** and conventions

## Related Documentation

- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Analytics System](./ANALYTICS.md)
- [Performance Guidelines](./PERFORMANCE.md)