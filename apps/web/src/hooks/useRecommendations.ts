import { useState, useEffect, useCallback } from 'react';
// Using API routes instead of direct Supabase
import { useAuth } from './useAuth';

// Types for recommendation system
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

interface RelatedProblem extends Problem {
  similarity_score: number;
  similarity_type: string;
}

interface RecommendationPreferences {
  category_weights: Record<string, number>;
  interaction_weights: Record<string, number>;
  diversity_preference: number;
  trending_preference: number;
  exclude_categories: string[];
  min_vote_threshold: number;
}

interface UseRecommendationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRecommendationsReturn {
  personalRecommendations: PersonalizedProblem[];
  trendingProblems: TrendingProblem[];
  isLoading: boolean;
  error: string | null;
  preferences: RecommendationPreferences | null;
  refreshRecommendations: () => Promise<void>;
  updatePreferences: (newPreferences: Partial<RecommendationPreferences>) => Promise<void>;
  trackFeedback: (problemId: string, feedbackType: string, recommendationType: string) => Promise<void>;
}

export const useRecommendations = (
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn => {
  const {
    limit = 10,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const { user } = useAuth();
  const [personalRecommendations, setPersonalRecommendations] = useState<PersonalizedProblem[]>([]);
  const [trendingProblems, setTrendingProblems] = useState<TrendingProblem[]>([]);
  const [preferences, setPreferences] = useState<RecommendationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch personalized recommendations
  const fetchPersonalRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/recommendations/personal?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setPersonalRecommendations(result.data);
        if (result.metadata?.user_preferences) {
          setPreferences(result.metadata.user_preferences);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch personal recommendations');
      }
    } catch (err) {
      console.error('Error fetching personal recommendations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user, limit]);

  // Fetch trending problems
  const fetchTrendingProblems = useCallback(async () => {
    try {
      const response = await fetch(`/api/recommendations/trending?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setTrendingProblems(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch trending problems');
      }
    } catch (err) {
      console.error('Error fetching trending problems:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [limit]);

  // Refresh all recommendations
  const refreshRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        user ? fetchPersonalRecommendations() : Promise.resolve(),
        fetchTrendingProblems()
      ]);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchPersonalRecommendations, fetchTrendingProblems]);

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<RecommendationPreferences>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/recommendations/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      const result = await response.json();

      if (result.success) {
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
        // Refresh recommendations after updating preferences
        await fetchPersonalRecommendations();
      } else {
        throw new Error(result.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  }, [user, fetchPersonalRecommendations]);

  // Track recommendation feedback
  const trackFeedback = useCallback(async (
    problemId: string,
    feedbackType: string,
    recommendationType: string
  ) => {
    if (!user) return;

    try {
      // Use API endpoint instead of direct Supabase access
      const response = await fetch('/api/analytics/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_id: problemId,
          recommendation_type: recommendationType,
          feedback_type: feedbackType,
          context: {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track feedback');
      }
    } catch (err) {
      console.error('Error tracking recommendation feedback:', err);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    let isCancelled = false;
    
    const loadRecommendations = async () => {
      if (isCancelled) return;
      
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          user ? fetchPersonalRecommendations() : Promise.resolve(),
          fetchTrendingProblems()
        ]);
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading recommendations:', err);
          setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRecommendations();
    
    return () => {
      isCancelled = true;
    };
  }, [user, limit]); // Only depend on user and limit

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshRecommendations, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]); // Remove refreshRecommendations from dependency

  return {
    personalRecommendations,
    trendingProblems,
    isLoading,
    error,
    preferences,
    refreshRecommendations,
    updatePreferences,
    trackFeedback
  };
};

// Hook for related problems
interface UseRelatedProblemsOptions {
  problemId: string;
  limit?: number;
}

interface UseRelatedProblemsReturn {
  relatedProblems: RelatedProblem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRelatedProblems = ({
  problemId,
  limit = 5
}: UseRelatedProblemsOptions): UseRelatedProblemsReturn => {
  const [relatedProblems, setRelatedProblems] = useState<RelatedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedProblems = useCallback(async () => {
    if (!problemId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problemId}/related?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setRelatedProblems(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch related problems');
      }
    } catch (err) {
      console.error('Error fetching related problems:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [problemId, limit]);

  useEffect(() => {
    fetchRelatedProblems();
  }, [problemId, limit]); // Only depend on problemId and limit

  return {
    relatedProblems,
    isLoading,
    error,
    refresh: fetchRelatedProblems
  };
};

// Hook for collections
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

interface UseCollectionsOptions {
  includeProblems?: boolean;
  featuredOnly?: boolean;
  collectionType?: string;
  limit?: number;
}

interface UseCollectionsReturn {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackCollectionView: (collectionId: string) => Promise<void>;
}

export const useCollections = (
  options: UseCollectionsOptions = {}
): UseCollectionsReturn => {
  const {
    includeProblems = false,
    featuredOnly = false,
    collectionType,
    limit = 20
  } = options;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        include_problems: includeProblems.toString(),
        featured_only: featuredOnly.toString(),
        limit: limit.toString()
      });

      if (collectionType) {
        params.append('type', collectionType);
      }

      const response = await fetch(`/api/collections?${params}`);
      const result = await response.json();

      if (result.success) {
        setCollections(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [includeProblems, featuredOnly, collectionType, limit]);

  const trackCollectionView = useCallback(async (collectionId: string) => {
    try {
      // Use API endpoint instead of direct Supabase access
      const response = await fetch('/api/analytics/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discovery_method: 'collection',
          source_id: collectionId,
          session_id: `collection_view_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to track collection view');
      }
    } catch (err) {
      console.error('Error tracking collection view:', err);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [includeProblems, featuredOnly, collectionType, limit]); // Only depend on options

  return {
    collections,
    isLoading,
    error,
    refresh: fetchCollections,
    trackCollectionView
  };
};

// Hook for a single collection
interface UseCollectionOptions {
  collectionId: string;
  includeProblems?: boolean;
}

interface UseCollectionReturn {
  collection: Collection | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCollection = ({
  collectionId,
  includeProblems = true
}: UseCollectionOptions): UseCollectionReturn => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    if (!collectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        include_problems: includeProblems.toString()
      });

      const response = await fetch(`/api/collections/${collectionId}?${params}`);
      const result = await response.json();

      if (result.success) {
        setCollection(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch collection');
      }
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, includeProblems]);

  useEffect(() => {
    fetchCollection();
  }, [collectionId, includeProblems]); // Only depend on collectionId and includeProblems

  return {
    collection,
    isLoading,
    error,
    refresh: fetchCollection
  };
};