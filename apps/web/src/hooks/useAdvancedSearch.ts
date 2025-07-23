'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Custom debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface SearchFilters {
  query: string;
  category: string;
  status: string;
  proposer: string;
  minVotes: number | undefined;
  maxVotes: number | undefined;
  dateFrom: string;
  dateTo: string;
  sortBy: 'relevance' | 'vote_count' | 'created_at' | 'updated_at' | 'trending';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
  proposer: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  category: {
    id: string;
    name: string;
  };
  trending_score?: number;
}

export interface SearchResponse {
  problems: SearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  search: {
    query?: string;
    filters: any;
    sort: {
      by: string;
      order: string;
    };
    highlighting: boolean;
    search_id?: string;
  };
}

export interface UseAdvancedSearchOptions {
  defaultFilters?: Partial<SearchFilters>;
  highlightResults?: boolean;
  trackAnalytics?: boolean;
  debounceMs?: number;
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    defaultFilters = {},
    highlightResults = true,
    trackAnalytics = true,
    debounceMs = 300,
  } = options;

  // Initialize filters from URL params
  const initialFilters: SearchFilters = {
    query: searchParams.get('q') || defaultFilters.query || '',
    category: searchParams.get('category') || defaultFilters.category || '',
    status: searchParams.get('status') || defaultFilters.status || '',
    proposer: searchParams.get('proposer') || defaultFilters.proposer || '',
    minVotes: searchParams.get('min_votes') ? parseInt(searchParams.get('min_votes')!) : defaultFilters.minVotes,
    maxVotes: searchParams.get('max_votes') ? parseInt(searchParams.get('max_votes')!) : defaultFilters.maxVotes,
    dateFrom: searchParams.get('date_from') || defaultFilters.dateFrom || '',
    dateTo: searchParams.get('date_to') || defaultFilters.dateTo || '',
    sortBy: (searchParams.get('sort_by') as any) || defaultFilters.sortBy || 'relevance',
    sortOrder: (searchParams.get('sort_order') as any) || defaultFilters.sortOrder || 'desc',
  };

  // State management
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId] = useState(() => `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Current page state
  const [currentPage, setCurrentPage] = useState(
    searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
  );

  // Update URL params when filters change
  const updateURLParams = useCallback((newFilters: SearchFilters, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.proposer) params.set('proposer', newFilters.proposer);
    if (newFilters.minVotes !== undefined) params.set('min_votes', newFilters.minVotes.toString());
    if (newFilters.maxVotes !== undefined) params.set('max_votes', newFilters.maxVotes.toString());
    if (newFilters.dateFrom) params.set('date_from', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('date_to', newFilters.dateTo);
    if (newFilters.sortBy !== 'relevance') params.set('sort_by', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sort_order', newFilters.sortOrder);
    if (page !== 1) params.set('page', page.toString());

    const newUrl = params.toString() ? `/problems?${params.toString()}` : '/problems';
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Perform search
  const performSearch = useCallback(async (searchFilters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      // Add search filters to params - Updated for /api/problems endpoint
      if (searchFilters.query) params.set('search', searchFilters.query);
      if (searchFilters.category) params.set('category_id', searchFilters.category);
      if (searchFilters.status) params.set('status', searchFilters.status);
      // Note: Other filters not yet supported by /api/problems
      params.set('sort', searchFilters.sortBy === 'relevance' ? 'created_at' : searchFilters.sortBy);
      params.set('order', searchFilters.sortOrder);

      const response = await fetch(`/api/problems?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }

      const data: { data: { problems: SearchResult[], pagination: any } } = await response.json();
      setResults(data.data.problems || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, totalCount: 0, hasMore: false });
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [highlightResults, searchId]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchFilters: SearchFilters, page: number = 1) => {
      performSearch(searchFilters, page);
      updateURLParams(searchFilters, page);
    }, debounceMs),
    [performSearch, updateURLParams, debounceMs]
  );

  // Update filters and trigger search
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters, 1);
  }, [filters, debouncedSearch]);

  // Update specific filter
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    updateFilters({ [key]: value });
  }, [updateFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      query: '',
      category: '',
      status: '',
      proposer: '',
      minVotes: undefined,
      maxVotes: undefined,
      dateFrom: '',
      dateTo: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    debouncedSearch(clearedFilters, 1);
  }, [debouncedSearch]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    performSearch(filters, page);
    updateURLParams(filters, page);
  }, [filters, performSearch, updateURLParams]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.proposer) count++;
    if (filters.minVotes !== undefined) count++;
    if (filters.maxVotes !== undefined) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  // Check if search has any criteria
  const hasSearchCriteria = useMemo(() => {
    return filters.query || activeFiltersCount > 0;
  }, [filters.query, activeFiltersCount]);

  // Initial search effect
  useEffect(() => {
    performSearch(filters, currentPage);
  }, []); // Only run on mount

  return {
    // State
    filters,
    results,
    pagination,
    loading,
    error,
    currentPage,
    activeFiltersCount,
    hasSearchCriteria,
    
    // Actions
    updateFilters,
    updateFilter,
    clearFilters,
    goToPage,
    search: () => performSearch(filters, 1),
    
    // Utilities
    searchId,
  };
}