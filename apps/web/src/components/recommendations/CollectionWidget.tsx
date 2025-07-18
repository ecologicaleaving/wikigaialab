'use client';

import React, { useState } from 'react';
import { BookOpen, Star, Users, ChevronRight, Heart, Clock, Filter } from 'lucide-react';
import { useCollections } from '../../hooks/useRecommendations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Problem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  item_order: number;
  added_at: string;
  category: {
    name: string;
  };
  proposer: {
    name: string;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string;
  curator_id: string;
  is_featured: boolean;
  is_public: boolean;
  collection_type: string;
  curator: {
    name: string;
  };
  items_count: number;
  problems?: Problem[];
}

interface CollectionWidgetProps {
  title?: string;
  featuredOnly?: boolean;
  collectionType?: string;
  limit?: number;
  showProblems?: boolean;
  compact?: boolean;
  onCollectionClick?: (collectionId: string) => void;
  onProblemClick?: (problemId: string) => void;
  onViewAll?: () => void;
}

export default function CollectionWidget({
  title = 'Problem Collections',
  featuredOnly = true,
  collectionType,
  limit = 6,
  showProblems = true,
  compact = false,
  onCollectionClick,
  onProblemClick,
  onViewAll
}: CollectionWidgetProps) {
  const { user } = useAuth();
  const {
    collections,
    isLoading,
    error,
    refresh,
    trackCollectionView
  } = useCollections({
    includeProblems: showProblems,
    featuredOnly,
    collectionType,
    limit
  });

  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  // Handle collection click
  const handleCollectionClick = async (collection: Collection) => {
    await trackCollectionView(collection.id);
    
    if (showProblems && collection.problems && collection.problems.length > 0) {
      // Toggle expansion for inline viewing
      setExpandedCollection(
        expandedCollection === collection.id ? null : collection.id
      );
    } else {
      onCollectionClick?.(collection.id);
    }
  };

  // Handle problem click
  const handleProblemClick = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();
    onProblemClick?.(problemId);
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

  // Get collection type icon and color
  const getCollectionTypeInfo = (type: string) => {
    switch (type) {
      case 'auto_trending':
        return { icon: '🔥', color: 'text-orange-600', label: 'Trending' };
      case 'auto_category':
        return { icon: '📂', color: 'text-blue-600', label: 'Category' };
      case 'auto_recommended':
        return { icon: '⭐', color: 'text-yellow-600', label: 'Top Picks' };
      default:
        return { icon: '📚', color: 'text-purple-600', label: 'Curated' };
    }
  };

  if (isLoading && collections.length === 0) {
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
          <p className="text-neutral-600 mb-4">Failed to load collections</p>
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

  if (collections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600">No collections available</p>
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
            <BookOpen className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>

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

      {/* Collections list */}
      <div className="divide-y divide-neutral-100">
        {collections.map((collection) => {
          const typeInfo = getCollectionTypeInfo(collection.collection_type);
          const isExpanded = expandedCollection === collection.id;

          return (
            <div key={collection.id} className="group">
              {/* Collection header */}
              <div
                className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                onClick={() => handleCollectionClick(collection)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Collection metadata */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className={`text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {collection.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      <span className="text-xs text-neutral-500">
                        {collection.items_count} problems
                      </span>
                    </div>

                    {/* Collection title and description */}
                    <h4 className="font-medium text-neutral-900 mb-1">
                      {collection.name}
                    </h4>
                    
                    {collection.description && !compact && (
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                        {collection.description}
                      </p>
                    )}

                    {/* Curator info */}
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Users className="h-3 w-3" />
                      <span>Curated by {collection.curator.name}</span>
                    </div>
                  </div>

                  {/* Expand/view button */}
                  <div className="flex items-center gap-2">
                    {showProblems && collection.problems && collection.problems.length > 0 && (
                      <button className="text-neutral-400 group-hover:text-neutral-600">
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded problems list */}
              {isExpanded && collection.problems && (
                <div className="bg-neutral-50 border-t border-neutral-100">
                  <div className="p-4 space-y-3">
                    {collection.problems.slice(0, 3).map((problem) => (
                      <div
                        key={problem.id}
                        className="bg-white rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={(e) => handleProblemClick(e, problem.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                                {problem.category.name}
                              </span>
                            </div>
                            
                            <h5 className="font-medium text-sm text-neutral-900 line-clamp-1 mb-1">
                              {problem.title}
                            </h5>
                            
                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{problem.vote_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{timeAgo(problem.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProblemClick(e, problem.id);
                            }}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {collection.problems.length > 3 && (
                      <button
                        onClick={() => onCollectionClick?.(collection.id)}
                        className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
                      >
                        View all {collection.items_count} problems
                      </button>
                    )}
                  </div>
                </div>
              )}
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
            Explore all collections
          </button>
        </div>
      )}
    </div>
  );
}