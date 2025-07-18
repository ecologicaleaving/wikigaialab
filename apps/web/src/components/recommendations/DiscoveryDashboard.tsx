'use client';

import React, { useState } from 'react';
import { Compass, TrendingUp, Star, BookOpen, Filter, RefreshCw } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuth } from '../../hooks/useAuth';
import RecommendationWidget from './RecommendationWidget';
import CollectionWidget from './CollectionWidget';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DiscoveryDashboardProps {
  onProblemClick?: (problemId: string) => void;
  onCollectionClick?: (collectionId: string) => void;
  className?: string;
}

function DiscoveryDashboard({
  onProblemClick,
  onCollectionClick,
  className = ''
}: DiscoveryDashboardProps) {
  const { user } = useAuth();
  const {
    personalRecommendations,
    trendingProblems,
    isLoading,
    error,
    refreshRecommendations
  } = useRecommendations({ 
    limit: 12,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'trending' | 'personal' | 'collections'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRecommendations();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'trending':
        return (
          <div className="space-y-6">
            <RecommendationWidget
              type="trending"
              title="Trending Problems"
              limit={12}
              showExplanations={false}
              onProblemClick={onProblemClick}
            />
          </div>
        );

      case 'personal':
        if (!user) {
          return (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Sign in for Personalized Recommendations
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Get problem recommendations tailored to your interests and voting history
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <RecommendationWidget
              type="personal"
              title="Personalized for You"
              limit={12}
              showExplanations={true}
              onProblemClick={onProblemClick}
            />
          </div>
        );

      case 'collections':
        return (
          <div className="space-y-6">
            <CollectionWidget
              title="Featured Collections"
              featuredOnly={true}
              limit={6}
              showProblems={true}
              onCollectionClick={onCollectionClick}
              onProblemClick={onProblemClick}
            />
          </div>
        );

      default: // overview
        return (
          <div className="space-y-8">
            {/* Personalized section for authenticated users */}
            {user && personalRecommendations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary-600" />
                    For You
                  </h2>
                  <button
                    onClick={() => setActiveTab('personal')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <RecommendationWidget
                  type="personal"
                  limit={6}
                  showExplanations={true}
                  onProblemClick={onProblemClick}
                  onViewAll={() => setActiveTab('personal')}
                />
              </section>
            )}

            {/* Trending section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary-600" />
                  Trending Now
                </h2>
                <button
                  onClick={() => setActiveTab('trending')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </button>
              </div>
              <RecommendationWidget
                type="trending"
                limit={6}
                showExplanations={false}
                onProblemClick={onProblemClick}
                onViewAll={() => setActiveTab('trending')}
              />
            </section>

            {/* Collections section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Featured Collections
                </h2>
                <button
                  onClick={() => setActiveTab('collections')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </button>
              </div>
              <CollectionWidget
                featuredOnly={true}
                limit={3}
                showProblems={false}
                compact={true}
                onCollectionClick={onCollectionClick}
                onViewAll={() => setActiveTab('collections')}
              />
            </section>
          </div>
        );
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-neutral-900">Discover Problems</h1>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-ghost btn-sm flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <p className="text-neutral-600 mt-2">
          Explore trending problems, get personalized recommendations, and discover curated collections
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="mb-8">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'trending'
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Trending
            </button>
            
            {user && (
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'personal'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                For You
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'collections'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Collections
            </button>
          </nav>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Failed to Load Recommendations
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="btn-primary btn-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && renderTabContent()}

      {/* Footer insights */}
      {!isLoading && !error && activeTab === 'overview' && (
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {personalRecommendations.length}
              </div>
              <div className="text-sm text-neutral-600">Personal recommendations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary-600 mb-1">
                {trendingProblems.length}
              </div>
              <div className="text-sm text-neutral-600">Trending problems</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                6+
              </div>
              <div className="text-sm text-neutral-600">Curated collections</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscoveryDashboard;