'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '../../components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Lightbulb, Search, Filter, Plus, Heart, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useMultipleVoting } from '../../hooks/useVoting';
import { VoteButton } from '../../components/ui/vote-button';
import { SocialShare } from '../../components/ui/social-share';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  vote_count: number;
  created_at: string;
  proposer: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ITEMS_PER_PAGE = 20;

export default function ProblemsListPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // State management
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter and search state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_at');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        // Error handling for categories is non-critical
      }
    };

    fetchCategories();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    if (sortBy !== 'created_at') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const newUrl = params.toString() ? `/problems?${params.toString()}` : '/problems';
    window.history.replaceState({}, '', newUrl);
  }, [debouncedSearch, selectedCategory, selectedStatus, sortBy, sortOrder, currentPage]);

  // Fetch problems when filters change
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedStatus) params.set('status', selectedStatus);
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);

        const response = await fetch(`/api/problems?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei problemi');
        }

        const data = await response.json();
        setProblems(data.data || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } catch (error) {
        toast.error('Errore nel caricamento dei problemi');
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [debouncedSearch, selectedCategory, selectedStatus, sortBy, sortOrder, currentPage]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Multiple voting hook for list items
  const { toggleVote: handleQuickVote, isVoting: isItemVoting } = useMultipleVoting();

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory) count++;
    if (selectedStatus) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedStatus]);

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

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cerca problemi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte le categorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti gli stati</SelectItem>
                  <SelectItem value="Proposed">Proposto</SelectItem>
                  <SelectItem value="In Development">In Sviluppo</SelectItem>
                  <SelectItem value="Completed">Completato</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  setSortBy(field);
                  setSortOrder(direction);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Più recenti</SelectItem>
                  <SelectItem value="vote_count-desc">Più votati</SelectItem>
                  <SelectItem value="created_at-asc">Più vecchi</SelectItem>
                  <SelectItem value="title-asc">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filters and clear */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">
                  {activeFiltersCount} filtro{activeFiltersCount > 1 ? 'i' : ''} attivo{activeFiltersCount > 1 ? 'i' : ''}
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Cancella filtri
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results count and pagination info */}
        {!loading && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {pagination.totalCount === 0 
                ? 'Nessun problema trovato'
                : `${pagination.totalCount} problema${pagination.totalCount !== 1 ? 'i' : ''} trovato${pagination.totalCount !== 1 ? 'i' : ''}`
              }
            </span>
            {pagination.totalPages > 1 && (
              <span>
                Pagina {pagination.currentPage} di {pagination.totalPages}
              </span>
            )}
          </div>
        )}

        {/* Problems Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeFiltersCount > 0 ? 'Nessun risultato trovato' : 'Nessun problema ancora'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFiltersCount > 0 
                  ? 'Prova a modificare i filtri di ricerca per trovare più risultati.'
                  : 'Sii il primo a proporre un problema per la comunità!'
                }
              </p>
              {activeFiltersCount > 0 ? (
                <Button onClick={clearFilters} variant="outline">
                  Cancella filtri
                </Button>
              ) : (
                <Link href="/problems/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Proponi il primo problema
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onQuickVote={handleQuickVote}
                isAuthenticated={!!user}
                isVoting={isItemVoting(problem.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Precedente
            </Button>

            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Successiva
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

interface ProblemCardProps {
  problem: Problem;
  onQuickVote: (
    problemId: string,
    currentHasVoted: boolean,
    currentVoteCount: number,
    onUpdate: (newVoteCount: number, newHasVoted: boolean) => void
  ) => void;
  isAuthenticated: boolean;
  isVoting: boolean;
}

function ProblemCard({ problem, onQuickVote, isAuthenticated, isVoting }: ProblemCardProps) {
  const [localVoteCount, setLocalVoteCount] = useState(problem.vote_count);
  const [localHasVoted, setLocalHasVoted] = useState(false);
  const [voteStatusLoaded, setVoteStatusLoaded] = useState(false);

  const truncatedDescription = problem.description.length > 150 
    ? problem.description.substring(0, 150) + '...' 
    : problem.description;

  // Load initial vote status
  useEffect(() => {
    if (!isAuthenticated) {
      setVoteStatusLoaded(true);
      return;
    }

    const loadVoteStatus = async () => {
      try {
        const response = await fetch(`/api/problems/${problem.id}/vote`);
        if (response.ok) {
          const data = await response.json();
          setLocalHasVoted(data.hasVoted);
          setLocalVoteCount(data.voteCount);
        }
      } catch (error) {
        // Silently handle error, use fallback data
      } finally {
        setVoteStatusLoaded(true);
      }
    };

    loadVoteStatus();
  }, [problem.id, isAuthenticated]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the vote button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(`/problems/${problem.id}`, '_blank');
  };

  const handleVoteUpdate = (newVoteCount: number, newHasVoted: boolean) => {
    setLocalVoteCount(newVoteCount);
    setLocalHasVoted(newHasVoted);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickVote(problem.id, localHasVoted, localVoteCount, handleVoteUpdate);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary-600 transition-colors">
              {problem.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <User className="w-3 h-3" />
              {problem.proposer.name}
            </CardDescription>
          </div>
          <Badge variant="secondary" size="sm">
            {problem.category.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {truncatedDescription}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span className="font-medium">{localVoteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(problem.created_at).toLocaleDateString('it-IT')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SocialShare
              title={problem.title}
              description={problem.description}
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/problems/${problem.id}`}
              voteCount={localVoteCount}
              category={problem.category.name}
              variant="compact"
            />
            <VoteButton
              hasVoted={localHasVoted}
              voteCount={localVoteCount}
              isLoading={!voteStatusLoaded}
              isVoting={isVoting}
              onClick={handleVoteClick}
              disabled={!isAuthenticated}
              size="sm"
              variant="card"
              showCount={false}
            />
          </div>
        </div>

        {problem.status !== 'Proposed' && (
          <div className="mt-3 pt-3 border-t">
            <Badge 
              variant={problem.status === 'Completed' ? 'success' : 'warning'}
              size="sm"
            >
              {problem.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}