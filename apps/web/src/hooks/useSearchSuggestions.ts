'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface SearchSuggestion {
  text: string;
  type: 'title' | 'category' | 'proposer';
  count?: number;
  id?: string;
}

export interface UseSearchSuggestionsOptions {
  minQueryLength?: number;
  debounceMs?: number;
  maxSuggestions?: number;
  suggestionType?: 'titles' | 'categories' | 'mixed';
}

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

export function useSearchSuggestions(options: UseSearchSuggestionsOptions = {}) {
  const {
    minQueryLength = 2,
    debounceMs = 200,
    maxSuggestions = 5,
    suggestionType = 'mixed',
  } = options;

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: maxSuggestions.toString(),
        type: suggestionType,
      });

      const response = await fetch(`/api/search/suggestions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei suggerimenti');
      }

      const data = await response.json();
      setSuggestions(data.data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei suggerimenti');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [minQueryLength, maxSuggestions, suggestionType]);

  // Debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce(fetchSuggestions, debounceMs),
    [fetchSuggestions, debounceMs]
  );

  // Update query and trigger suggestions fetch
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.length < minQueryLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    debouncedFetch(newQuery);
  }, [debouncedFetch, minQueryLength]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setQuery('');
    setError(null);
  }, []);

  // Filter suggestions by type
  const suggestionsByType = useMemo(() => {
    return {
      titles: suggestions.filter(s => s.type === 'title'),
      categories: suggestions.filter(s => s.type === 'category'),
      proposers: suggestions.filter(s => s.type === 'proposer'),
    };
  }, [suggestions]);

  // Check if we have any suggestions
  const hasSuggestions = suggestions.length > 0;

  return {
    // State
    suggestions,
    suggestionsByType,
    loading,
    error,
    query,
    hasSuggestions,
    
    // Actions
    updateQuery,
    clearSuggestions,
    fetchSuggestions: (q: string) => fetchSuggestions(q),
  };
}