'use client';

import React from 'react';
import { ArrowRight, Heart, Clock, Users, Lightbulb } from 'lucide-react';
import { useRelatedProblems } from '../../hooks/useRecommendations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RelatedProblem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  similarity_score: number;
  similarity_type: string;
  category: {
    name: string;
  };
  proposer: {
    name: string;
  };
}

interface RelatedProblemsWidgetProps {
  problemId: string;
  title?: string;
  limit?: number;
  compact?: boolean;
  showSimilarityScore?: boolean;
  onProblemClick?: (problemId: string) => void;
}

export default function RelatedProblemsWidget({
  problemId,
  title = 'Related Problems',
  limit = 5,
  compact = false,
  showSimilarityScore = false,
  onProblemClick
}: RelatedProblemsWidgetProps) {
  const { user } = useAuth();
  const {
    relatedProblems,
    isLoading,
    error,
    refresh
  } = useRelatedProblems({ problemId, limit });

  // Handle problem click
  const handleProblemClick = (problem: RelatedProblem) => {
    onProblemClick?.(problem.id);
  };

  // Get similarity type display info
  const getSimilarityTypeInfo = (type: string) => {
    switch (type) {
      case 'content':
        return { 
          label: 'Similar content', 
          color: 'text-blue-600',
          icon: '📝'
        };
      case 'category':
        return { 
          label: 'Same category', 
          color: 'text-green-600',
          icon: '📂'
        };
      case 'voting_pattern':
        return { 
          label: 'Similar voters', 
          color: 'text-purple-600',
          icon: '👥'
        };
      case 'user_interaction':
        return { 
          label: 'Similar engagement', 
          color: 'text-orange-600',
          icon: '💡'
        };
      case 'hybrid':
        return { 
          label: 'Multiple factors', 
          color: 'text-primary-600',
          icon: '⭐'
        };
      default:
        return { 
          label: 'Related', 
          color: 'text-neutral-600',
          icon: '🔗'
        };
    }
  };

  // Format similarity score as percentage
  const formatSimilarityScore = (score: number): string => {
    return `${Math.round(score * 100)}% similar`;
  };

  // Format time ago
  const timeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'less than 1h ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-neutral-600 mb-4">Failed to load related problems</p>
          <button 
            onClick={refresh}
            className="btn-primary btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (relatedProblems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="text-center py-6">
          <Lightbulb className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600">No related problems found</p>
          <p className="text-sm text-neutral-500 mt-1">
            This appears to be a unique problem!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-neutral-500">
            ({relatedProblems.length} found)
          </span>
        </div>
      </div>

      {/* Related problems list */}
      <div className="divide-y divide-neutral-100">
        {relatedProblems.map((problem, index) => {
          const similarityInfo = getSimilarityTypeInfo(problem.similarity_type);
          
          return (
            <div
              key={problem.id}
              className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors group"
              onClick={() => handleProblemClick(problem)}
            >
              <div className="flex items-start gap-4">
                {/* Similarity indicator */}
                <div className="flex-shrink-0 pt-1">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                    <span className="text-sm">{similarityInfo.icon}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Category and similarity info */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                      {problem.category.name}
                    </span>
                    
                    <span className={`text-xs ${similarityInfo.color}`}>
                      {similarityInfo.label}
                    </span>
                    
                    {showSimilarityScore && (
                      <span className="text-xs text-neutral-500">
                        {formatSimilarityScore(problem.similarity_score)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {problem.title}
                  </h4>
                  
                  {/* Description (if not compact) */}
                  {!compact && (
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                      {problem.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{problem.vote_count} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo(problem.created_at)}</span>
                    </div>
                    <span>by {problem.proposer.name}</span>
                  </div>
                </div>

                {/* Action arrow */}
                <div className="flex-shrink-0 pt-1">
                  <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 text-center">
          Related problems are found using content similarity, voting patterns, and user behavior
        </p>
      </div>
    </div>
  );
}