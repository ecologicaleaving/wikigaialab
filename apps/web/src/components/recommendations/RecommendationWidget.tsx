'use client';

import React, { useState } from 'react';
import { Heart, TrendingUp, Users, Clock, ChevronRight, Star, Filter } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Problem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  category: {
    name: string;
  };
  proposer: {
    name: string;
  };
}

interface PersonalizedProblem extends Problem {
  score?: number;
  reasoning?: {
    collaborative_score: number;
    content_score: number;
    trending_score: number;
    category_match: number;
    interaction_history: number;
  };
}

interface TrendingProblem extends Problem {
  trending_score: number;
  vote_velocity: number;
  engagement_score: number;
}

interface RecommendationWidgetProps {
  title?: string;
  type: 'personal' | 'trending' | 'mixed';
  limit?: number;
  showExplanations?: boolean;
  compact?: boolean;
  onProblemClick?: (problemId: string) => void;
  onViewAll?: () => void;
}

export default function RecommendationWidget({
  title,
  type = 'mixed',
  limit = 6,
  showExplanations = true,
  compact = false,
  onProblemClick,
  onViewAll
}: RecommendationWidgetProps) {
  const { user } = useAuth();
  const {
    personalRecommendations,
    trendingProblems,
    isLoading,
    error,
    refreshRecommendations,
    trackFeedback
  } = useRecommendations({ limit });

  const [activeTab, setActiveTab] = useState<'personal' | 'trending'>(
    user ? 'personal' : 'trending'
  );

  // Handle problem interaction
  const handleProblemClick = async (problem: Problem, recommendationType: string) => {
    if (user) {
      await trackFeedback(problem.id, 'clicked', recommendationType);
    }
    onProblemClick?.(problem.id);
  };

  // Handle vote button click
  const handleVoteClick = async (e: React.MouseEvent, problem: Problem, recommendationType: string) => {
    e.stopPropagation();
    if (user) {
      await trackFeedback(problem.id, 'voted', recommendationType);
    }
    // Add vote logic here
  };

  // Generate explanation for a recommendation
  const getExplanation = (problem: PersonalizedProblem): string => {
    if (!problem.reasoning) return 'Recommended for you';

    const reasons: string[] = [];
    
    if (problem.reasoning.collaborative_score > 0.5) {
      reasons.push('similar users voted');
    }
    if (problem.reasoning.trending_score > 0.5) {
      reasons.push('trending now');
    }
    if (problem.reasoning.category_match > 0.7) {
      reasons.push('matches interests');
    }
    if (problem.reasoning.content_score > 0.5) {
      reasons.push('similar content');
    }

    if (reasons.length === 0) return 'Recommended for you';
    return `Because: ${reasons.join(', ')}`;
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

  // Get problems to display based on type and tab
  const getProblemsToDisplay = () => {
    if (type === 'personal') return personalRecommendations;
    if (type === 'trending') return trendingProblems;
    
    // Mixed type - show based on active tab
    return activeTab === 'personal' ? personalRecommendations : trendingProblems;
  };

  const problems = getProblemsToDisplay();
  const recommendationType = type === 'mixed' ? activeTab : type;

  if (isLoading && problems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-neutral-600 mb-4">Failed to load recommendations</p>
          <button 
            onClick={refreshRecommendations}
            className="btn-primary btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-neutral-600">No recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {recommendationType === 'personal' ? (
              <Star className="h-5 w-5 text-primary-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-secondary-600" />
            )}
            <h3 className="text-lg font-semibold">
              {title || (recommendationType === 'personal' ? 'For You' : 'Trending Now')}
            </h3>
          </div>
          
          {/* Tab selector for mixed type */}
          {type === 'mixed' && user && (
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-primary-600'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white text-secondary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-secondary-600'
                }`}
              >
                Trending
              </button>
            </div>
          )}

          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Problems list */}
      <div className="divide-y divide-neutral-100">
        {problems.slice(0, limit).map((problem) => {
          const isTrending = 'trending_score' in problem;
          const isPersonalized = 'reasoning' in problem;
          
          return (
            <div
              key={problem.id}
              className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={() => handleProblemClick(problem, recommendationType)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category and metrics */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                      {problem.category.name}
                    </span>
                    
                    {isTrending && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>{Math.round((problem as TrendingProblem).trending_score)}</span>
                        {(problem as TrendingProblem).vote_velocity > 0 && (
                          <>
                            <span>•</span>
                            <span>{(problem as TrendingProblem).vote_velocity.toFixed(1)} votes/hr</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title and description */}
                  <h4 className="font-medium text-neutral-900 mb-1 line-clamp-1">
                    {problem.title}
                  </h4>
                  
                  {!compact && (
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                      {problem.description}
                    </p>
                  )}

                  {/* Explanation */}
                  {showExplanations && isPersonalized && (
                    <p className="text-xs text-primary-600 mb-2">
                      {getExplanation(problem as PersonalizedProblem)}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{problem.vote_count} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo(problem.created_at)}</span>
                    </div>
                    <span>by {problem.proposer.name}</span>
                  </div>
                </div>

                {/* Vote button */}
                <button
                  onClick={(e) => handleVoteClick(e, problem, recommendationType)}
                  className="flex-shrink-0 btn-ghost btn-sm flex items-center gap-1"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Vote</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {onViewAll && (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          <button 
            onClick={onViewAll}
            className="w-full btn-ghost btn-sm text-center"
          >
            View all {recommendationType === 'personal' ? 'recommendations' : 'trending problems'}
          </button>
        </div>
      )}
    </div>
  );
}