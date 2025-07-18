/**
 * User Discovery Component
 * Story 4.3: User Profiles & Social Features
 * Search and discover users with filters, suggestions, and recommendations
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { FollowButton } from './SocialInteractions';
import { UserSearchResult, UserSearchResponse } from '../../../../../packages/shared/src/types/social';

interface UserDiscoveryProps {
  initialQuery?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  layout?: 'grid' | 'list';
  limit?: number;
}

interface UserSearchState {
  users: UserSearchResult[];
  suggestions: UserSearchResult[];
  loading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

interface SearchFilters {
  query: string;
  category: string;
  minReputation: number;
  hasAchievements: boolean;
  isActive: boolean;
  location: string;
  sortBy: 'relevance' | 'reputation' | 'followers' | 'recent';
}

export const UserDiscovery: React.FC<UserDiscoveryProps> = ({
  initialQuery = '',
  showFilters = true,
  showSuggestions = true,
  layout = 'grid',
  limit = 20
}) => {
  const { user: currentUser } = useAuth();
  
  const [state, setState] = useState<UserSearchState>({
    users: [],
    suggestions: [],
    loading: false,
    suggestionsLoading: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: false
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    category: '',
    minReputation: 0,
    hasAchievements: false,
    isActive: false,
    location: '',
    sortBy: 'relevance'
  });

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load suggestions on component mount
  useEffect(() => {
    if (showSuggestions && currentUser) {
      loadSuggestions();
    }
  }, [currentUser, showSuggestions]);

  // Search users when filters change (with debounce)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (filters.query || Object.values(filters).some(v => v && v !== filters.query && v !== 'relevance')) {
        searchUsers(1, true);
      } else {
        setState(prev => ({ ...prev, users: [], total: 0, hasMore: false }));
      }
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [filters]);

  const searchUsers = useCallback(async (page: number = 1, reset: boolean = true) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.query && { q: filters.query }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minReputation > 0 && { min_reputation: filters.minReputation.toString() }),
        ...(filters.hasAchievements && { has_achievements: 'true' }),
        ...(filters.isActive && { is_active: 'true' }),
        ...(filters.location && { location: filters.location }),
        ...(filters.sortBy !== 'relevance' && { sort_by: filters.sortBy }),
        ...(currentUser && { requesting_user_id: currentUser.id })
      });

      const response = await fetch(`/api/users/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca utenti');
      }

      const data: UserSearchResponse = await response.json();

      setState(prev => ({
        ...prev,
        users: reset ? data.users : [...prev.users, ...data.users],
        total: data.total,
        page,
        hasMore: data.hasMore,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, [currentUser, filters, limit]);

  const loadSuggestions = useCallback(async () => {
    if (!currentUser) return;

    try {
      setState(prev => ({ ...prev, suggestionsLoading: true }));

      const response = await fetch('/api/users/search/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          suggestions: data.suggestions || [],
          suggestionsLoading: false
        }));
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setState(prev => ({ ...prev, suggestionsLoading: false }));
    }
  }, [currentUser]);

  const loadMore = () => {
    if (!state.loading && state.hasMore) {
      searchUsers(state.page + 1, false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      minReputation: 0,
      hasAchievements: false,
      isActive: false,
      location: '',
      sortBy: 'relevance'
    });
  };

  const interestCategories = [
    'Tecnologia', 'Ambiente', 'Salute', 'Educazione', 'Arte', 'Sport',
    'Scienza', 'Politica', 'Economia', 'Sociale', 'Innovazione', 'Design'
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Scopri Utenti
        </h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cerca per nome, email o bio..."
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria Interessi
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tutte le categorie</option>
                {interestCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reputazione Minima
              </label>
              <select
                value={filters.minReputation}
                onChange={(e) => handleFilterChange('minReputation', parseInt(e.target.value))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value={0}>Qualsiasi</option>
                <option value={100}>100+</option>
                <option value={500}>500+</option>
                <option value={1000}>1000+</option>
                <option value={2500}>2500+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordina per
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="relevance">Rilevanza</option>
                <option value="reputation">Reputazione</option>
                <option value="followers">Follower</option>
                <option value="recent">Più recenti</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posizione
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Città, Paese..."
              />
            </div>
          </div>
        )}

        {/* Filter Checkboxes */}
        {showFilters && (
          <div className="mt-4 flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasAchievements}
                onChange={(e) => handleFilterChange('hasAchievements', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Ha Achievement</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Attivo di recente</span>
            </label>
          </div>
        )}

        {/* Clear Filters */}
        {(filters.query || filters.category || filters.minReputation > 0 || 
          filters.hasAchievements || filters.isActive || filters.location) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Cancella tutti i filtri
            </button>
          </div>
        )}
      </div>

      {/* Suggestions Section */}
      {showSuggestions && state.suggestions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Suggerimenti per te
            </h3>
            <button
              onClick={loadSuggestions}
              disabled={state.suggestionsLoading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {state.suggestionsLoading ? 'Caricamento...' : 'Aggiorna'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.suggestions.map(user => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Risultati Ricerca
            </h3>
            {state.total > 0 && (
              <p className="text-sm text-gray-500">
                {state.total} utenti trovati
              </p>
            )}
          </div>
        </div>

        <div className="p-6">
          {state.loading && state.users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : state.error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{state.error}</p>
            </div>
          ) : state.users.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun utente trovato</h3>
              <p className="mt-1 text-sm text-gray-500">
                Prova a modificare i criteri di ricerca
              </p>
            </div>
          ) : (
            <>
              <div className={
                layout === 'grid' 
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }>
                {state.users.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                    layout={layout}
                  />
                ))}
              </div>

              {/* Load More */}
              {state.hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={state.loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {state.loading ? (
                      <>
                        <LoadingSpinner size="xs" className="mr-2" />
                        Caricamento...
                      </>
                    ) : (
                      'Carica altri utenti'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * User Card Component
 */
interface UserCardProps {
  user: UserSearchResult;
  currentUserId?: string;
  layout?: 'grid' | 'list';
  compact?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUserId,
  layout = 'grid',
  compact = false
}) => {
  const isOwnProfile = currentUserId === user.id;

  if (layout === 'list') {
    return (
      <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        <Link href={`/users/${user.id}`} className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-gray-600">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-gray-900 truncate">
              {user.name || user.email.split('@')[0]}
            </h4>
            {user.bio && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>⭐ {user.reputation_score}</span>
              <span>👥 {user.total_followers} follower</span>
              {user.mutualFollowers > 0 && (
                <span>🤝 {user.mutualFollowers} in comune</span>
              )}
            </div>
          </div>
        </Link>

        {!isOwnProfile && (
          <div className="flex-shrink-0">
            <FollowButton
              targetUserId={user.id}
              initialIsFollowing={user.isFollowing}
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${compact ? 'p-4' : 'p-6'}`}>
      <div className="text-center">
        <Link href={`/users/${user.id}`} className="block">
          <div className={`mx-auto ${compact ? 'h-12 w-12' : 'h-16 w-16'} rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mb-3`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={`${compact ? 'text-lg' : 'text-2xl'} font-medium text-gray-600`}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate mb-1`}>
            {user.name || user.email.split('@')[0]}
          </h4>
          
          {user.bio && !compact && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{user.bio}</p>
          )}
        </Link>

        <div className={`flex items-center justify-center space-x-3 ${compact ? 'text-xs' : 'text-sm'} text-gray-500 mb-3`}>
          <span>⭐ {user.reputation_score}</span>
          <span>👥 {user.total_followers}</span>
        </div>

        {user.mutualFollowers > 0 && (
          <p className="text-xs text-blue-600 mb-3">
            {user.mutualFollowers} follower in comune
          </p>
        )}

        {!isOwnProfile && (
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={user.isFollowing}
            size={compact ? 'sm' : 'md'}
            variant="primary"
          />
        )}
      </div>
    </div>
  );
};

export default UserDiscovery;