'use client';

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../../components/layout';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMultipleVoting } from '../../hooks/useVoting';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { AdvancedSearchFilters } from '../../components/search/AdvancedSearchFilters';
import { SearchResults } from '../../components/search/SearchResults';
import Link from 'next/link';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

export default function ProblemsListPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [proposers, setProposers] = useState<User[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Initialize advanced search
  const {
    filters,
    results,
    pagination,
    loading,
    error,
    activeFiltersCount,
    hasSearchCriteria,
    updateFilters,
    clearFilters,
    goToPage,
  } = useAdvancedSearch({
    highlightResults: true,
    trackAnalytics: true,
    debounceMs: 300,
  });

  // Multiple voting hook for list items
  const { toggleVote: handleQuickVote, isVoting: isItemVoting } = useMultipleVoting();

  // Fetch categories and proposers on mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingCategories(true);
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data || []);
        }

        // Fetch top proposers for filter (optional enhancement)
        // This could be a separate API endpoint that returns users with problems
        // For now, we'll leave it empty as it's not critical
        
      } catch (error) {
        console.warn('Failed to fetch filter data:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchFilterData();
  }, []);

  // Show error toast if search fails
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <AuthenticatedLayout title="Problemi della Comunità">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Problemi della Comunità
            </h1>
            <p className="text-gray-600 mt-2">
              Scopri e vota i problemi più interessanti della comunità
            </p>
          </div>
          <Link href="/problems/new">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Proponi Problema
            </Button>
          </Link>
        </div>

        {/* Advanced Search Filters */}
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          activeFiltersCount={activeFiltersCount}
          categories={categories}
          proposers={proposers}
          loading={loading || loadingCategories}
        />

        {/* Search Results */}
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

        {/* Search Tips (shown when no search criteria) */}
        {!hasSearchCriteria && !loading && results.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Come utilizzare la ricerca avanzata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Ricerca testuale</h4>
                <ul className="space-y-1">
                  <li>• Cerca per titolo o descrizione del problema</li>
                  <li>• Usa termini specifici per risultati più precisi</li>
                  <li>• I suggerimenti automatici ti aiutano durante la digitazione</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Filtri avanzati</h4>
                <ul className="space-y-1">
                  <li>• Filtra per categoria per argomenti specifici</li>
                  <li>• Ordina per rilevanza, voti, data o trend</li>
                  <li>• Usa i filtri per voti e date per ricerche precise</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics (Development Only) */}
        {process.env.NODE_ENV === 'development' && hasSearchCriteria && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <strong>Dev Info:</strong> 
            Risultati: {pagination.totalCount} | 
            Pagina: {pagination.currentPage}/{pagination.totalPages} | 
            Filtri attivi: {activeFiltersCount} |
            Query: {filters.query || 'nessuna'} |
            Ordinamento: {filters.sortBy} ({filters.sortOrder})
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}