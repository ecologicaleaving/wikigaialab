import { NextRequest, NextResponse } from 'next/server';
import { supabase, withErrorHandling } from '../../../../lib/supabase';
import { getUser } from '../../../../lib/supabase';

// Types for recommendation system
interface UserPreferences {
  category_weights: Record<string, number>;
  interaction_weights: Record<string, number>;
  diversity_preference: number;
  trending_preference: number;
  exclude_categories: string[];
  min_vote_threshold: number;
}

interface ProblemScore {
  problem_id: string;
  score: number;
  reasoning: {
    collaborative_score: number;
    content_score: number;
    trending_score: number;
    category_match: number;
    interaction_history: number;
  };
}

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

// Personalized Recommendation Engine
class PersonalRecommendationEngine {
  private userId: string;
  private preferences: UserPreferences;

  constructor(userId: string, preferences: UserPreferences) {
    this.userId = userId;
    this.preferences = preferences;
  }

  // Main recommendation generation method
  async generateRecommendations(limit: number = 10): Promise<Problem[]> {
    try {
      // Get candidate problems (exclude already voted, own problems, excluded categories)
      const candidates = await this.getCandidateProblems();
      
      // Calculate scores for each candidate
      const scoredProblems = await Promise.all(
        candidates.map(problem => this.scoreProblem(problem))
      );

      // Sort by score and apply diversity filter
      const sortedProblems = scoredProblems
        .sort((a, b) => b.score - a.score)
        .slice(0, limit * 2); // Get more for diversity filtering

      // Apply diversity filtering
      const diverseProblems = this.applyDiversityFilter(sortedProblems, limit);

      // Get full problem details
      const recommendations = await this.getProblemsDetails(
        diverseProblems.map(p => p.problem_id)
      );

      // Track recommendation generation for analytics
      await this.trackRecommendationGeneration(recommendations.length);

      return recommendations;
    } catch (error) {
      console.error('Error generating personal recommendations:', error);
      throw error;
    }
  }

  // Get candidate problems excluding user's own problems, voted problems, and excluded categories
  private async getCandidateProblems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        category_id,
        vote_count,
        created_at,
        proposer_id
      `)
      .gte('vote_count', this.preferences.min_vote_threshold)
      .neq('proposer_id', this.userId)
      .not('category_id', 'in', `(${this.preferences.exclude_categories.join(',')})`)
      .not('id', 'in', `(
        SELECT problem_id FROM votes WHERE user_id = '${this.userId}'
      )`)
      .eq('status', 'Proposed')
      .order('created_at', { ascending: false })
      .limit(200); // Get more candidates for better selection

    if (error) throw error;
    return data || [];
  }

  // Score a single problem using hybrid approach
  private async scoreProblem(problem: any): Promise<ProblemScore> {
    const collaborativeScore = await this.calculateCollaborativeScore(problem);
    const contentScore = await this.calculateContentScore(problem);
    const trendingScore = await this.calculateTrendingScore(problem);
    const categoryMatch = this.calculateCategoryMatch(problem);
    const interactionHistory = await this.calculateInteractionScore(problem);

    // Combine scores with user preferences
    const finalScore = 
      (collaborativeScore * 0.3) +
      (contentScore * 0.25) +
      (trendingScore * this.preferences.trending_preference * 0.2) +
      (categoryMatch * 0.15) +
      (interactionHistory * 0.1);

    return {
      problem_id: problem.id,
      score: finalScore,
      reasoning: {
        collaborative_score: collaborativeScore,
        content_score: contentScore,
        trending_score: trendingScore,
        category_match: categoryMatch,
        interaction_history: interactionHistory
      }
    };
  }

  // Collaborative filtering based on similar users' voting patterns
  private async calculateCollaborativeScore(problem: any): Promise<number> {
    try {
      // Find users with similar voting patterns
      const { data: similarUsers, error } = await supabase.rpc('find_similar_users', {
        target_user_id: this.userId,
        limit_users: 50
      });

      if (error || !similarUsers) return 0;

      // Check how many similar users voted for this problem
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('problem_id', problem.id)
        .in('user_id', similarUsers.map((u: any) => u.user_id));

      if (votesError) return 0;

      // Score based on similar users' engagement
      const similarUserVotes = votes?.length || 0;
      const totalSimilarUsers = similarUsers.length;
      
      return totalSimilarUsers > 0 ? (similarUserVotes / totalSimilarUsers) : 0;
    } catch (error) {
      console.error('Error calculating collaborative score:', error);
      return 0;
    }
  }

  // Content-based filtering using problem similarity
  private async calculateContentScore(problem: any): Promise<number> {
    try {
      // Get problems the user has voted for
      const { data: userVotedProblems, error } = await supabase
        .from('votes')
        .select('problem_id')
        .eq('user_id', this.userId)
        .limit(20);

      if (error || !userVotedProblems?.length) return 0;

      // Find similarity scores with user's voted problems
      const { data: similarities, error: simError } = await supabase
        .from('problem_similarities')
        .select('similarity_score')
        .eq('problem_b_id', problem.id)
        .in('problem_a_id', userVotedProblems.map(v => v.problem_id))
        .order('similarity_score', { ascending: false })
        .limit(10);

      if (simError || !similarities?.length) return 0;

      // Average of top similarities
      const avgSimilarity = similarities.reduce(
        (sum, sim) => sum + sim.similarity_score, 0
      ) / similarities.length;

      return avgSimilarity;
    } catch (error) {
      console.error('Error calculating content score:', error);
      return 0;
    }
  }

  // Trending score from cached calculations
  private async calculateTrendingScore(problem: any): Promise<number> {
    try {
      const { data: trending, error } = await supabase
        .from('trending_cache')
        .select('trending_score')
        .eq('problem_id', problem.id)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !trending) return 0;

      // Normalize trending score (0-1)
      return Math.min(trending.trending_score / 100, 1);
    } catch (error) {
      return 0;
    }
  }

  // Category preference matching
  private calculateCategoryMatch(problem: any): number {
    const categoryWeight = this.preferences.category_weights[problem.category_id] || 0;
    return Math.min(categoryWeight, 1);
  }

  // User interaction history score
  private async calculateInteractionScore(problem: any): Promise<number> {
    try {
      // Get user's interaction patterns with similar problems
      const { data: interactions, error } = await supabase
        .from('user_problem_interactions')
        .select('interaction_weight')
        .eq('user_id', this.userId)
        .eq('problem_id', problem.id)
        .single();

      if (error || !interactions) return 0;

      return Math.min(interactions.interaction_weight / 10, 1);
    } catch (error) {
      return 0;
    }
  }

  // Apply diversity filtering to avoid too similar recommendations
  private applyDiversityFilter(scoredProblems: ProblemScore[], limit: number): ProblemScore[] {
    if (this.preferences.diversity_preference === 0) {
      return scoredProblems.slice(0, limit);
    }

    const selected: ProblemScore[] = [];
    const candidates = [...scoredProblems];

    while (selected.length < limit && candidates.length > 0) {
      if (selected.length === 0) {
        // Add the highest scored problem first
        selected.push(candidates.shift()!);
        continue;
      }

      // Find the most diverse candidate
      let bestCandidate = candidates[0];
      let bestDiversityScore = this.calculateDiversityScore(bestCandidate, selected);

      for (let i = 1; i < Math.min(candidates.length, 10); i++) {
        const candidate = candidates[i];
        const diversityScore = this.calculateDiversityScore(candidate, selected);
        
        if (diversityScore > bestDiversityScore) {
          bestCandidate = candidate;
          bestDiversityScore = diversityScore;
        }
      }

      selected.push(bestCandidate);
      candidates.splice(candidates.indexOf(bestCandidate), 1);
    }

    return selected;
  }

  // Calculate diversity score for a candidate against selected problems
  private calculateDiversityScore(candidate: ProblemScore, selected: ProblemScore[]): number {
    // Simplified diversity calculation - in real implementation would use category, similarity, etc.
    const scoreComponent = candidate.score * (1 - this.preferences.diversity_preference);
    const diversityComponent = this.preferences.diversity_preference;
    
    return scoreComponent + diversityComponent;
  }

  // Get full problem details
  private async getProblemsDetails(problemIds: string[]): Promise<Problem[]> {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        category_id,
        vote_count,
        created_at,
        categories:category_id (
          name
        ),
        users:proposer_id (
          name
        )
      `)
      .in('id', problemIds)
      .order('vote_count', { ascending: false });

    if (error) throw error;

    return (data || []).map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      category_id: problem.category_id,
      vote_count: problem.vote_count,
      created_at: problem.created_at,
      category: { name: (problem.categories as any)?.name || 'Unknown' },
      proposer: { name: (problem.users as any)?.name || 'Anonymous' }
    }));
  }

  // Track recommendation generation for analytics
  private async trackRecommendationGeneration(count: number): Promise<void> {
    try {
      await supabase
        .from('discovery_analytics')
        .insert({
          user_id: this.userId,
          discovery_method: 'recommendations',
          problems_discovered: count,
          session_id: `rec_${Date.now()}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking recommendation generation:', error);
    }
  }
}

// Get or create user preferences
async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data: existing, error } = await supabase
    .from('user_recommendation_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing && !error) {
    return {
      category_weights: existing.category_weights || {},
      interaction_weights: existing.interaction_weights || {},
      diversity_preference: existing.diversity_preference || 0.3,
      trending_preference: existing.trending_preference || 0.5,
      exclude_categories: existing.exclude_categories || [],
      min_vote_threshold: existing.min_vote_threshold || 1
    };
  }

  // Create default preferences
  const defaultPreferences: UserPreferences = {
    category_weights: {},
    interaction_weights: { vote: 1.0, favorite: 0.8, view: 0.3 },
    diversity_preference: 0.3,
    trending_preference: 0.5,
    exclude_categories: [],
    min_vote_threshold: 1
  };

  // Save default preferences
  await supabase
    .from('user_recommendation_preferences')
    .insert({
      user_id: userId,
      ...defaultPreferences
    });

  return defaultPreferences;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const refresh = url.searchParams.get('refresh') === 'true';

    // Get user preferences
    const preferences = await getUserPreferences(user.id);

    // Create recommendation engine
    const engine = new PersonalRecommendationEngine(user.id, preferences);

    // Generate recommendations
    const recommendations = await engine.generateRecommendations(limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        total: recommendations.length,
        generated_at: new Date().toISOString(),
        user_preferences: preferences
      }
    });

  } catch (error) {
    console.error('Error in personal recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_weights,
      interaction_weights,
      diversity_preference,
      trending_preference,
      exclude_categories,
      min_vote_threshold
    } = body;

    // Update user preferences
    const { data, error } = await supabase
      .from('user_recommendation_preferences')
      .upsert({
        user_id: user.id,
        category_weights: category_weights || {},
        interaction_weights: interaction_weights || { vote: 1.0, favorite: 0.8, view: 0.3 },
        diversity_preference: diversity_preference || 0.3,
        trending_preference: trending_preference || 0.5,
        exclude_categories: exclude_categories || [],
        min_vote_threshold: min_vote_threshold || 1,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Recommendation preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating recommendation preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}