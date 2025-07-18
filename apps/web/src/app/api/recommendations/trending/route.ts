import { NextRequest, NextResponse } from 'next/server';
import { supabase, withErrorHandling } from '../../../../lib/supabase';

// Types for trending system
interface TrendingProblem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  trending_score: number;
  vote_velocity: number;
  engagement_score: number;
  category: {
    name: string;
  };
  proposer: {
    name: string;
  };
}

interface TrendingCalculation {
  problem_id: string;
  trending_score: number;
  vote_velocity: number;
  time_decay_factor: number;
  engagement_score: number;
  category_boost: number;
}

// Trending Algorithm Engine
class TrendingAlgorithm {
  private readonly DECAY_HALF_LIFE_HOURS = 48; // Score halves every 48 hours
  private readonly MIN_VOTES_FOR_TRENDING = 5;
  private readonly VELOCITY_WEIGHT = 0.4;
  private readonly ENGAGEMENT_WEIGHT = 0.3;
  private readonly RECENCY_WEIGHT = 0.2;
  private readonly CATEGORY_BOOST_WEIGHT = 0.1;

  // Calculate trending scores for all eligible problems
  async calculateTrendingScores(): Promise<TrendingCalculation[]> {
    try {
      // Get problems with recent activity
      const problems = await this.getEligibleProblems();
      
      // Calculate scores for each problem
      const calculations = await Promise.all(
        problems.map(problem => this.calculateProblemTrendingScore(problem))
      );

      // Filter out problems with low scores
      return calculations.filter(calc => calc.trending_score > 0.1);

    } catch (error) {
      console.error('Error calculating trending scores:', error);
      throw error;
    }
  }

  // Get problems eligible for trending (recent activity, minimum votes)
  private async getEligibleProblems(): Promise<any[]> {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 168); // Last 7 days

    const { data, error } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        category_id,
        vote_count,
        created_at,
        updated_at,
        proposer_id
      `)
      .eq('status', 'Proposed')
      .gte('vote_count', this.MIN_VOTES_FOR_TRENDING)
      .gte('updated_at', hoursAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return data || [];
  }

  // Calculate trending score for a single problem
  private async calculateProblemTrendingScore(problem: any): Promise<TrendingCalculation> {
    try {
      // Calculate vote velocity
      const voteVelocity = await this.calculateVoteVelocity(problem.id);
      
      // Calculate time decay factor
      const timeDecayFactor = this.calculateTimeDecay(problem.created_at);
      
      // Calculate engagement score
      const engagementScore = await this.calculateEngagementScore(problem.id);
      
      // Calculate category boost
      const categoryBoost = await this.calculateCategoryBoost(problem.category_id);

      // Combine all factors into final trending score
      const trendingScore = this.combineTrendingFactors(
        voteVelocity,
        timeDecayFactor,
        engagementScore,
        categoryBoost,
        problem.vote_count
      );

      return {
        problem_id: problem.id,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        time_decay_factor: timeDecayFactor,
        engagement_score: engagementScore,
        category_boost: categoryBoost
      };

    } catch (error) {
      console.error(`Error calculating trending score for problem ${problem.id}:`, error);
      return {
        problem_id: problem.id,
        trending_score: 0,
        vote_velocity: 0,
        time_decay_factor: 0,
        engagement_score: 0,
        category_boost: 1
      };
    }
  }

  // Calculate vote velocity (votes per hour over different time windows)
  private async calculateVoteVelocity(problemId: string): Promise<number> {
    try {
      const now = new Date();
      const timeWindows = [
        { hours: 1, weight: 0.4 },   // Last hour (high weight)
        { hours: 6, weight: 0.3 },   // Last 6 hours
        { hours: 24, weight: 0.2 },  // Last day
        { hours: 168, weight: 0.1 }  // Last week (low weight)
      ];

      let weightedVelocity = 0;
      let totalWeight = 0;

      for (const window of timeWindows) {
        const windowStart = new Date(now);
        windowStart.setHours(windowStart.getHours() - window.hours);

        const { data: votes, error } = await supabase
          .from('votes')
          .select('created_at')
          .eq('problem_id', problemId)
          .gte('created_at', windowStart.toISOString());

        if (!error && votes) {
          const voteCount = votes.length;
          const velocity = voteCount / window.hours; // votes per hour
          weightedVelocity += velocity * window.weight;
          totalWeight += window.weight;
        }
      }

      return totalWeight > 0 ? weightedVelocity / totalWeight : 0;

    } catch (error) {
      console.error('Error calculating vote velocity:', error);
      return 0;
    }
  }

  // Calculate time decay factor based on problem age
  private calculateTimeDecay(createdAt: string): number {
    const problemAge = Date.now() - new Date(createdAt).getTime();
    const ageInHours = problemAge / (1000 * 60 * 60);
    
    // Exponential decay: score = initial * (0.5 ^ (age / half_life))
    const decayFactor = Math.pow(0.5, ageInHours / this.DECAY_HALF_LIFE_HOURS);
    
    // Ensure minimum decay factor for very old problems
    return Math.max(decayFactor, 0.01);
  }

  // Calculate engagement score based on various interactions
  private async calculateEngagementScore(problemId: string): Promise<number> {
    try {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      // Get recent interactions
      const { data: interactions, error } = await supabase
        .from('user_problem_interactions')
        .select('interaction_type, interaction_count')
        .eq('problem_id', problemId)
        .gte('last_interaction', last24Hours.toISOString());

      if (error || !interactions) return 0;

      // Weight different interaction types
      const interactionWeights = {
        vote: 1.0,
        favorite: 0.8,
        view: 0.3,
        share: 1.2,
        comment: 0.9
      };

      let engagementScore = 0;
      for (const interaction of interactions) {
        const weight = interactionWeights[interaction.interaction_type as keyof typeof interactionWeights] || 0.1;
        engagementScore += (interaction.interaction_count || 1) * weight;
      }

      // Normalize engagement score
      return Math.min(engagementScore / 10, 1);

    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  // Calculate category boost based on category popularity and recent activity
  private async calculateCategoryBoost(categoryId: string): Promise<number> {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      // Get category activity in last 7 days
      const { data: categoryActivity, error } = await supabase
        .from('problems')
        .select('vote_count')
        .eq('category_id', categoryId)
        .gte('created_at', last7Days.toISOString());

      if (error || !categoryActivity) return 1.0;

      // Calculate category boost based on recent activity
      const totalVotes = categoryActivity.reduce((sum, p) => sum + p.vote_count, 0);
      const avgVotesPerProblem = categoryActivity.length > 0 ? totalVotes / categoryActivity.length : 0;

      // Boost active categories slightly
      const boost = Math.min(1.0 + (avgVotesPerProblem / 100), 1.5);
      return boost;

    } catch (error) {
      console.error('Error calculating category boost:', error);
      return 1.0;
    }
  }

  // Combine all trending factors into final score
  private combineTrendingFactors(
    voteVelocity: number,
    timeDecayFactor: number,
    engagementScore: number,
    categoryBoost: number,
    totalVotes: number
  ): number {
    // Base score from vote velocity and engagement
    const baseScore = (
      (voteVelocity * this.VELOCITY_WEIGHT) +
      (engagementScore * this.ENGAGEMENT_WEIGHT) +
      (timeDecayFactor * this.RECENCY_WEIGHT) +
      (categoryBoost * this.CATEGORY_BOOST_WEIGHT)
    );

    // Apply logarithmic scaling to total votes to prevent vote count dominance
    const voteBonus = Math.log10(Math.max(totalVotes, 1)) / 3;

    // Final trending score
    const trendingScore = (baseScore + voteBonus) * 100; // Scale to 0-100 range

    return Math.max(trendingScore, 0);
  }

  // Update trending cache with new calculations
  async updateTrendingCache(calculations: TrendingCalculation[]): Promise<void> {
    try {
      // Clear existing cache
      await supabase
        .from('trending_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Insert new calculations
      const cacheEntries = calculations.map(calc => ({
        ...calc,
        calculated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Expires in 1 hour
      }));

      if (cacheEntries.length > 0) {
        const { error } = await supabase
          .from('trending_cache')
          .upsert(cacheEntries, { onConflict: 'problem_id' });

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error updating trending cache:', error);
      throw error;
    }
  }
}

// Get trending problems from cache or calculate fresh
async function getTrendingProblems(limit: number = 20, categoryId?: string): Promise<TrendingProblem[]> {
  try {
    // Check if cache is valid
    const { data: cacheData, error: cacheError } = await supabase
      .from('trending_cache')
      .select(`
        problem_id,
        trending_score,
        vote_velocity,
        engagement_score,
        problems!inner (
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
        )
      `)
      .gt('expires_at', new Date().toISOString())
      .order('trending_score', { ascending: false })
      .limit(limit * 2); // Get more for filtering

    let trendingProblems: TrendingProblem[] = [];

    if (cacheError || !cacheData || cacheData.length === 0) {
      // Cache miss - calculate fresh trending scores
      const algorithm = new TrendingAlgorithm();
      const calculations = await algorithm.calculateTrendingScores();
      await algorithm.updateTrendingCache(calculations);

      // Get fresh data
      return getTrendingProblems(limit, categoryId);
    }

    // Format cache data
    trendingProblems = cacheData
      .filter(item => item.problems && (!categoryId || (item.problems as any).category_id === categoryId))
      .map(item => {
        const problem = item.problems as any;
        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          category_id: problem.category_id,
          vote_count: problem.vote_count,
          created_at: problem.created_at,
          trending_score: item.trending_score,
          vote_velocity: item.vote_velocity,
          engagement_score: item.engagement_score,
          category: { name: problem.categories?.name || 'Unknown' },
          proposer: { name: problem.users?.name || 'Anonymous' }
        };
      })
      .slice(0, limit);

    return trendingProblems;

  } catch (error) {
    console.error('Error getting trending problems:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const categoryId = url.searchParams.get('category_id') || undefined;
    const refresh = url.searchParams.get('refresh') === 'true';

    if (refresh) {
      // Force refresh of trending calculations
      const algorithm = new TrendingAlgorithm();
      const calculations = await algorithm.calculateTrendingScores();
      await algorithm.updateTrendingCache(calculations);
    }

    const trendingProblems = await getTrendingProblems(limit, categoryId);

    // Track trending view for analytics
    try {
      await supabase
        .from('discovery_analytics')
        .insert({
          user_id: null, // Anonymous tracking for trending
          discovery_method: 'trending',
          problems_discovered: trendingProblems.length,
          session_id: `trending_${Date.now()}`,
          created_at: new Date().toISOString()
        });
    } catch (analyticsError) {
      // Don't fail the request if analytics fails
      console.error('Analytics tracking failed:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      data: trendingProblems,
      metadata: {
        total: trendingProblems.length,
        calculated_at: new Date().toISOString(),
        category_filter: categoryId,
        algorithm_version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error in trending API:', error);
    return NextResponse.json(
      { error: 'Failed to get trending problems' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Manual trigger for trending calculation (admin only)
    const body = await request.json();
    const { force_recalculate } = body;

    if (force_recalculate) {
      const algorithm = new TrendingAlgorithm();
      const calculations = await algorithm.calculateTrendingScores();
      await algorithm.updateTrendingCache(calculations);

      return NextResponse.json({
        success: true,
        message: 'Trending scores recalculated successfully',
        calculated_problems: calculations.length,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in trending POST:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate trending scores' },
      { status: 500 }
    );
  }
}