'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthenticatedLayout } from '../../components/layout';
import { Button } from '../../components/ui/button';
import { Plus, Compass, Filter, TrendingUp, Heart, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMultipleVoting } from '../../hooks/useVoting';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useMonitoring } from '../../components/monitoring/MonitoringProvider';
import { AdvancedSearchFilters } from '../../components/search/AdvancedSearchFilters';
import { SearchResults } from '../../components/search/SearchResults';
import DiscoveryDashboard from '../../components/recommendations/DiscoveryDashboard';
import { LeaderboardWidget } from '../../components/growth/LeaderboardWidget';
import { CampaignWidget } from '../../components/growth/CampaignWidget';
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

function ProblemsListComponent() {
  const { user } = useAuth();
  const { recordUserAction, recordBusinessMetric } = useMonitoring();
  const [categories, setCategories] = useState<Category[]>([]);
  const [proposers, setProposers] = useState<User[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeView, setActiveView] = useState<'discover' | 'search' | 'categories'>('discover');

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

  // Handle problem click navigation
  const handleProblemClick = (problemId: string) => {
    recordUserAction('problem_click', { problemId, source: 'problems_page' });
    window.location.href = `/problems/${problemId}`;
  };

  // Handle collection click navigation
  const handleCollectionClick = (collectionId: string) => {
    recordUserAction('collection_click', { collectionId, source: 'problems_page' });
    window.location.href = `/collections/${collectionId}`;
  };

  // Handle category filter
  const handleCategoryFilter = (categoryId: string) => {
    recordUserAction('category_filter', { categoryId, source: 'problems_page' });
    setActiveView('search');
    updateFilters({ categoryIds: [categoryId] });
  };

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

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                recordUserAction('view_change', { view: 'discover', source: 'problems_page' });
                setActiveView('discover');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'discover'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Scopri
              </div>
            </button>
            
            <button
              onClick={() => {
                recordUserAction('view_change', { view: 'search', source: 'problems_page' });
                setActiveView('search');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Cerca
              </div>
            </button>
            
            <button
              onClick={() => {
                recordUserAction('view_change', { view: 'categories', source: 'problems_page' });
                setActiveView('categories');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'categories'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Categorie
              </div>
            </button>
          </nav>
        </div>

        {/* Content based on active view */}
        {activeView === 'discover' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <DiscoveryDashboard
                onProblemClick={handleProblemClick}
                onCollectionClick={handleCollectionClick}
              />
            </div>
            <div className="space-y-6">
              <LeaderboardWidget
                userId={user?.id}
                compact={true}
                showControls={false}
              />
              <CampaignWidget
                userId={user?.id}
                compact={true}
                showJoined={true}
              />
            </div>
          </div>
        )}

        {activeView === 'search' && (
          <>
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
          </>
        )}

        {activeView === 'categories' && (
          <CategoryDiscoveryView
            categories={categories}
            loading={loadingCategories}
            onCategoryClick={handleCategoryFilter}
            onProblemClick={handleProblemClick}
          />
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

// Category Discovery View Component
interface CategoryDiscoveryViewProps {
  categories: Category[];
  loading: boolean;
  onCategoryClick: (categoryId: string) => void;
  onProblemClick: (problemId: string) => void;
}

function CategoryDiscoveryView({
  categories,
  loading,
  onCategoryClick,
  onProblemClick
}: CategoryDiscoveryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProblems, setCategoryProblems] = useState<any[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Fetch problems for selected category
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProblems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategoryProblems = async (categoryId: string) => {
    setLoadingProblems(true);
    try {
      const response = await fetch(`/api/problems?category_id=${categoryId}&limit=12&sort=vote_count&order=desc`);
      if (response.ok) {
        const data = await response.json();
        setCategoryProblems(data.data?.problems || []);
      }
    } catch (error) {
      console.error('Error fetching category problems:', error);
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Esplora per Categoria
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Clicca per esplorare i problemi
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Problems */}
      {selectedCategory && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Problemi in {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <button
              onClick={() => onCategoryClick(selectedCategory)}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Vedi tutti con filtri avanzati
            </button>
          </div>

          {loadingProblems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-12 bg-gray-300 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : categoryProblems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Star className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600">
                Nessun problema trovato in questa categoria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onProblemClick(problem.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                      {problem.category?.name}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>{problem.vote_count}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {problem.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {problem.description}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <span>di {problem.proposer?.name || 'Anonimo'}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(problem.created_at).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProblemsListPage() {
  return (
    <Suspense fallback={
      <AuthenticatedLayout>
        <div className="container-wide py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-12 bg-gray-300 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    }>
      <ProblemsListComponent />
    </Suspense>
  );
}