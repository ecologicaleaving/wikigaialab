'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Heart, 
  Calendar, 
  User, 
  TrendingUp, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Search as SearchIcon
} from 'lucide-react';
import { SearchResult } from '../../hooks/useAdvancedSearch';
import { VoteButton } from '../ui/vote-button';
import { SocialShare } from '../ui/social-share';
import Link from 'next/link';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query?: string;
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  onQuickVote?: (problemId: string, currentHasVoted: boolean, currentVoteCount: number, onUpdate: (newVoteCount: number, newHasVoted: boolean) => void) => void;
  isAuthenticated?: boolean;
}

export function SearchResults({
  results,
  loading,
  query,
  totalCount,
  pagination,
  onPageChange,
  onQuickVote,
  isAuthenticated = false,
}: SearchResultsProps) {
  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      onPageChange(pagination.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      onPageChange(pagination.currentPage + 1);
    }
  };

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return <EmptySearchResults query={query} />;
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalCount === 0 
            ? 'Nessun risultato trovato'
            : `${totalCount} risultato${totalCount !== 1 ? 'i' : ''} trovato${totalCount !== 1 ? 'i' : ''}`
          }
          {query && (
            <span className="ml-1">
              per "<span className="font-medium">{query}</span>"
            </span>
          )}
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Pagina {pagination.currentPage} di {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <SearchResultCard
            key={result.id}
            result={result}
            onQuickVote={onQuickVote}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={handlePrevPage}
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
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage}
          >
            Successiva
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onQuickVote?: (problemId: string, currentHasVoted: boolean, currentVoteCount: number, onUpdate: (newVoteCount: number, newHasVoted: boolean) => void) => void;
  isAuthenticated: boolean;
}

function SearchResultCard({ result, onQuickVote, isAuthenticated }: SearchResultCardProps) {
  const [localVoteCount, setLocalVoteCount] = React.useState(result.vote_count);
  const [localHasVoted, setLocalHasVoted] = React.useState(false);
  const [voteStatusLoaded, setVoteStatusLoaded] = React.useState(false);
  const [isVoting, setIsVoting] = React.useState(false);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Development':
        return 'warning';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'Proposed':
        return 'Proposto';
      case 'In Development':
        return 'In Sviluppo';
      case 'Completed':
        return 'Completato';
      case 'Rejected':
        return 'Rifiutato';
      default:
        return status;
    }
  };

  // Truncate description
  const truncatedDescription = result.description.length > 150 
    ? result.description.substring(0, 150) + '...' 
    : result.description;

  // Load initial vote status
  React.useEffect(() => {
    if (!isAuthenticated) {
      setVoteStatusLoaded(true);
      return;
    }

    const loadVoteStatus = async () => {
      try {
        const response = await fetch(`/api/problems/${result.id}/vote`);
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
  }, [result.id, isAuthenticated]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(`/problems/${result.id}`, '_blank');
  };

  const handleVoteUpdate = (newVoteCount: number, newHasVoted: boolean) => {
    setLocalVoteCount(newVoteCount);
    setLocalHasVoted(newHasVoted);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickVote) {
      setIsVoting(true);
      onQuickVote(result.id, localHasVoted, localVoteCount, (newCount, newHasVoted) => {
        handleVoteUpdate(newCount, newHasVoted);
        setIsVoting(false);
      });
    }
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
              {/* Render highlighted title if it contains HTML */}
              {result.title.includes('<mark>') ? (
                <span dangerouslySetInnerHTML={{ __html: result.title }} />
              ) : (
                result.title
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <User className="w-3 h-3" />
              {result.proposer.name}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" size="sm">
              {result.category.name}
            </Badge>
            {result.trending_score && (
              <Badge variant="outline" size="sm" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {/* Render highlighted description if it contains HTML */}
            {result.description.includes('<mark>') ? (
              <span dangerouslySetInnerHTML={{ __html: truncatedDescription }} />
            ) : (
              truncatedDescription
            )}
          </p>

          {/* Metrics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="font-medium">{localVoteCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(result.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SocialShare
                title={result.title}
                description={result.description}
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/problems/${result.id}`}
                voteCount={localVoteCount}
                category={result.category.name}
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

          {/* Status badge */}
          {result.status !== 'Proposed' && (
            <div className="pt-3 border-t">
              <Badge 
                variant={getStatusVariant(result.status)}
                size="sm"
              >
                {formatStatus(result.status)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptySearchResults({ query }: { query?: string }) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <SearchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessun risultato trovato
        </h3>
        <p className="text-gray-600 mb-6">
          {query 
            ? `Non abbiamo trovato problemi che corrispondono a "${query}". Prova a modificare i termini di ricerca o i filtri.`
            : 'Prova a utilizzare termini di ricerca diversi o modificare i filtri.'
          }
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Suggerimenti:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Verifica l'ortografia delle parole chiave</li>
            <li>Prova termini più generali</li>
            <li>Rimuovi alcuni filtri</li>
            <li>Cerca per categoria o propositore</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}