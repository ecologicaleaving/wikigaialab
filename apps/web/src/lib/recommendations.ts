// Recommendation utility functions and helpers
import { supabase } from './supabase';

// Types
export interface RecommendationScore {
  problem_id: string;
  score: number;
  reasoning?: {
    [key: string]: number;
  };
}

export interface TrendingScore {
  problem_id: string;
  trending_score: number;
  vote_velocity: number;
  engagement_score: number;
  time_decay_factor: number;
}

export interface SimilarityScore {
  problem_a_id: string;
  problem_b_id: string;
  similarity_score: number;
  similarity_type: string;
}

// Recommendation utility class
export class RecommendationUtils {
  // Calculate text similarity using Jaccard coefficient
  static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Simple tokenization
    const tokens1 = new Set(
      text1.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2)
    );
    
    const tokens2 = new Set(
      text2.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2)
    );

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter(word => tokens2.has(word)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Normalize scores to 0-1 range
  static normalizeScores(scores: number[]): number[] {
    if (scores.length === 0) return [];
    
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min;
    
    if (range === 0) return scores.map(() => 1);
    
    return scores.map(score => (score - min) / range);
  }

  // Apply diversity filtering to recommendation list
  static applyDiversityFilter<T extends { category_id?: string; vote_count?: number }>(
    items: T[],
    diversityScore: number = 0.3,
    maxPerCategory: number = 3
  ): T[] {
    if (diversityScore === 0) return items;

    const result: T[] = [];
    const categoryCount = new Map<string, number>();

    for (const item of items) {
      const categoryId = item.category_id || 'unknown';
      const currentCount = categoryCount.get(categoryId) || 0;

      // Apply diversity rules
      if (currentCount < maxPerCategory) {
        result.push(item);
        categoryCount.set(categoryId, currentCount + 1);
      } else if (Math.random() < (1 - diversityScore)) {
        // Occasionally allow category overflow for high-quality items
        result.push(item);
      }
    }

    return result;
  }

  // Calculate time decay factor
  static calculateTimeDecay(
    createdAt: string,
    halfLifeHours: number = 48
  ): number {
    const ageInMs = Date.now() - new Date(createdAt).getTime();
    const ageInHours = ageInMs / (1000 * 60 * 60);
    
    // Exponential decay
    const decayFactor = Math.pow(0.5, ageInHours / halfLifeHours);
    
    return Math.max(decayFactor, 0.01); // Minimum decay factor
  }

  // Combine multiple recommendation scores using weighted average
  static combineScores(
    scores: { [algorithm: string]: number },
    weights: { [algorithm: string]: number } = {}
  ): number {
    const defaultWeights = {
      collaborative: 0.3,
      content: 0.25,
      trending: 0.25,
      category: 0.15,
      interaction: 0.05
    };

    const finalWeights = { ...defaultWeights, ...weights };
    let totalScore = 0;
    let totalWeight = 0;

    for (const [algorithm, score] of Object.entries(scores)) {
      const weight = finalWeights[algorithm] || 0.1;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Generate recommendation explanation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static generateExplanation(
    reasoning: { [key: string]: number },
    _problemTitle: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): string {
    const explanations: string[] = [];

    if (reasoning.collaborative_score > 0.5) {
      explanations.push('users with similar interests voted for this');
    }

    if (reasoning.content_score > 0.5) {
      explanations.push('similar to problems you\'ve liked');
    }

    if (reasoning.trending_score > 0.5) {
      explanations.push('currently trending');
    }

    if (reasoning.category_match > 0.7) {
      explanations.push('matches your preferred categories');
    }

    if (explanations.length === 0) {
      return `Recommended based on community interest`;
    }

    return `Recommended because: ${explanations.join(', ')}`;
  }

  // Track interaction for learning
  static async trackInteraction(
    userId: string,
    problemId: string,
    interactionType: 'vote' | 'view' | 'favorite' | 'share' | 'comment',
    weight: number = 1.0
  ): Promise<void> {
    try {
      await supabase
        .from('user_problem_interactions')
        .upsert({
          user_id: userId,
          problem_id: problemId,
          interaction_type: interactionType,
          interaction_weight: weight,
          last_interaction: new Date().toISOString(),
          interaction_count: 1
        }, {
          onConflict: 'user_id,problem_id,interaction_type',
          ignoreDuplicates: false
        });

      // Update the count and weight if interaction already exists
      await supabase.rpc('increment_interaction', {
        p_user_id: userId,
        p_problem_id: problemId,
        p_interaction_type: interactionType,
        p_weight_increment: weight
      });

    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Get user interaction patterns for analysis
  static async getUserInteractionPatterns(userId: string): Promise<{
    categories: { [categoryId: string]: number };
    interactions: { [type: string]: number };
    timePatterns: { [hour: string]: number };
  }> {
    try {
      const { data: interactions, error } = await supabase
        .from('user_problem_interactions')
        .select(`
          interaction_type,
          interaction_weight,
          last_interaction,
          problems!inner (
            category_id
          )
        `)
        .eq('user_id', userId)
        .gte('last_interaction', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error || !interactions) {
        return { categories: {}, interactions: {}, timePatterns: {} };
      }

      const categories: { [categoryId: string]: number } = {};
      const interactionTypes: { [type: string]: number } = {};
      const timePatterns: { [hour: string]: number } = {};

      for (const interaction of interactions) {
        // Category patterns
        const categoryId = (interaction.problems as any)?.category_id;
        if (categoryId) {
          categories[categoryId] = (categories[categoryId] || 0) + interaction.interaction_weight;
        }

        // Interaction type patterns
        interactionTypes[interaction.interaction_type] = 
          (interactionTypes[interaction.interaction_type] || 0) + interaction.interaction_weight;

        // Time patterns
        const hour = new Date(interaction.last_interaction).getHours().toString();
        timePatterns[hour] = (timePatterns[hour] || 0) + 1;
      }

      return {
        categories,
        interactions: interactionTypes,
        timePatterns
      };

    } catch (error) {
      console.error('Error getting user interaction patterns:', error);
      return { categories: {}, interactions: {}, timePatterns: {} };
    }
  }

  // Calculate category weights based on user behavior
  static calculateCategoryWeights(
    categoryInteractions: { [categoryId: string]: number }
  ): { [categoryId: string]: number } {
    const total = Object.values(categoryInteractions).reduce((sum, weight) => sum + weight, 0);
    
    if (total === 0) return {};

    const weights: { [categoryId: string]: number } = {};
    for (const [categoryId, weight] of Object.entries(categoryInteractions)) {
      weights[categoryId] = weight / total;
    }

    return weights;
  }

  // Get trending problems with detailed analysis
  static async getTrendingAnalysis(limit: number = 20): Promise<{
    problems: any[];
    insights: {
      totalTrending: number;
      averageVelocity: number;
      topCategories: string[];
      timeRange: string;
    };
  }> {
    try {
      const { data: trending, error } = await supabase
        .from('trending_cache')
        .select(`
          problem_id,
          trending_score,
          vote_velocity,
          engagement_score,
          calculated_at,
          problems!inner (
            id,
            title,
            description,
            category_id,
            vote_count,
            created_at,
            categories:category_id (
              name
            )
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error || !trending) {
        return {
          problems: [],
          insights: {
            totalTrending: 0,
            averageVelocity: 0,
            topCategories: [],
            timeRange: ''
          }
        };
      }

      // Calculate insights
      const totalTrending = trending.length;
      const averageVelocity = trending.reduce((sum, t) => sum + t.vote_velocity, 0) / totalTrending;
      
      const categoryCount = new Map<string, number>();
      for (const item of trending) {
        const categoryName = (item.problems as any)?.categories?.name;
        if (categoryName) {
          categoryCount.set(categoryName, (categoryCount.get(categoryName) || 0) + 1);
        }
      }

      const topCategories = Array.from(categoryCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const oldestCalculation = Math.min(...trending.map(t => new Date(t.calculated_at).getTime()));
      const timeRange = new Date(oldestCalculation).toLocaleString();

      return {
        problems: trending.map(item => ({
          ...item.problems,
          trending_score: item.trending_score,
          vote_velocity: item.vote_velocity,
          engagement_score: item.engagement_score
        })),
        insights: {
          totalTrending,
          averageVelocity,
          topCategories,
          timeRange
        }
      };

    } catch (error) {
      console.error('Error getting trending analysis:', error);
      return {
        problems: [],
        insights: {
          totalTrending: 0,
          averageVelocity: 0,
          topCategories: [],
          timeRange: ''
        }
      };
    }
  }

  // Validate recommendation preferences
  static validatePreferences(preferences: any): {
    isValid: boolean;
    errors: string[];
    sanitized: any;
  } {
    const errors: string[] = [];
    const sanitized: any = {};

    // Validate diversity preference
    if (typeof preferences.diversity_preference === 'number') {
      if (preferences.diversity_preference >= 0 && preferences.diversity_preference <= 1) {
        sanitized.diversity_preference = preferences.diversity_preference;
      } else {
        errors.push('diversity_preference must be between 0 and 1');
      }
    }

    // Validate trending preference
    if (typeof preferences.trending_preference === 'number') {
      if (preferences.trending_preference >= 0 && preferences.trending_preference <= 1) {
        sanitized.trending_preference = preferences.trending_preference;
      } else {
        errors.push('trending_preference must be between 0 and 1');
      }
    }

    // Validate category weights
    if (preferences.category_weights && typeof preferences.category_weights === 'object') {
      const validWeights: { [key: string]: number } = {};
      for (const [categoryId, weight] of Object.entries(preferences.category_weights)) {
        if (typeof weight === 'number' && weight >= 0 && weight <= 1) {
          validWeights[categoryId] = weight;
        } else {
          errors.push(`Invalid weight for category ${categoryId}: must be between 0 and 1`);
        }
      }
      sanitized.category_weights = validWeights;
    }

    // Validate exclude categories
    if (preferences.exclude_categories && Array.isArray(preferences.exclude_categories)) {
      sanitized.exclude_categories = preferences.exclude_categories.filter(
        (id: any) => typeof id === 'string'
      );
    }

    // Validate min vote threshold
    if (typeof preferences.min_vote_threshold === 'number') {
      if (preferences.min_vote_threshold >= 0) {
        sanitized.min_vote_threshold = Math.floor(preferences.min_vote_threshold);
      } else {
        errors.push('min_vote_threshold must be a non-negative integer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
}

// Export convenience functions
export const {
  calculateTextSimilarity,
  normalizeScores,
  applyDiversityFilter,
  calculateTimeDecay,
  combineScores,
  generateExplanation,
  trackInteraction,
  getUserInteractionPatterns,
  calculateCategoryWeights,
  getTrendingAnalysis,
  validatePreferences
} = RecommendationUtils;