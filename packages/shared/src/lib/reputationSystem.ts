/**
 * Reputation Calculation System
 * Story 4.3: User Profiles & Social Features
 * Advanced reputation calculation with multiple factors and decay
 */

import { UserProfile, UserReputationHistory } from '../types/social';

export interface ReputationConfig {
  databaseClient: any;
  weights?: ReputationWeights;
  decay?: ReputationDecay;
}

export interface ReputationWeights {
  // Base activity points
  problemCreated: number;
  voteGiven: number;
  voteReceived: number;
  achievementEarned: number;
  
  // Quality bonuses
  popularProblem: number; // Problem gets many votes
  earlyVoter: number; // Vote on problems that become popular
  consistency: number; // Regular activity
  
  // Social factors
  followerGained: number;
  profileComplete: number;
  
  // Community contribution
  helpfulActivity: number;
  diverseInteraction: number; // Interact with different categories
  
  // Penalties
  inactivity: number; // Negative for long periods of inactivity
  spam: number; // Penalty for spam-like behavior
}

export interface ReputationDecay {
  enabled: boolean;
  halfLife: number; // Days after which reputation halves
  minimumRetained: number; // Minimum percentage to retain (0.1 = 10%)
}

export interface ReputationBreakdown {
  currentScore: number;
  breakdown: {
    category: string;
    points: number;
    description: string;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  rank: string;
  nextRankRequirement: number;
}

export class ReputationSystem {
  private db: any;
  private weights: ReputationWeights;
  private decay: ReputationDecay;

  constructor(config: ReputationConfig) {
    this.db = config.databaseClient;
    
    // Default weights
    this.weights = {
      problemCreated: 25,
      voteGiven: 1,
      voteReceived: 3,
      achievementEarned: 0, // Handled by achievement points directly
      popularProblem: 50,
      earlyVoter: 5,
      consistency: 10,
      followerGained: 2,
      profileComplete: 20,
      helpfulActivity: 15,
      diverseInteraction: 10,
      inactivity: -1,
      spam: -10,
      ...config.weights
    };

    this.decay = {
      enabled: false,
      halfLife: 365, // 1 year
      minimumRetained: 0.1,
      ...config.decay
    };
  }

  /**
   * Calculate comprehensive reputation for a user
   */
  async calculateUserReputation(userId: string): Promise<ReputationBreakdown> {
    try {
      // Get user stats and activities
      const [userStats, recentActivities, historicalData] = await Promise.all([
        this.getUserStats(userId),
        this.getRecentActivities(userId, 30), // Last 30 days
        this.getHistoricalData(userId, 90) // Last 90 days for trends
      ]);

      // Calculate different reputation components
      const breakdown = [
        await this.calculateBasicActivity(userStats),
        await this.calculateQualityBonuses(userId, userStats),
        await this.calculateSocialFactors(userStats),
        await this.calculateCommunityContribution(userId),
        await this.calculateConsistencyBonus(recentActivities),
        await this.calculatePenalties(userId, userStats)
      ].filter(component => component.points !== 0);

      // Calculate total score
      const currentScore = Math.max(0, breakdown.reduce((sum, item) => sum + item.points, 0));

      // Apply decay if enabled
      const finalScore = this.decay.enabled 
        ? this.applyDecay(currentScore, userStats.created_at)
        : currentScore;

      // Calculate trend
      const { trend, trendPercentage } = this.calculateTrend(historicalData, finalScore);

      // Get rank information
      const { rank, nextRankRequirement } = this.calculateRank(finalScore);

      return {
        currentScore: Math.round(finalScore),
        breakdown,
        trend,
        trendPercentage,
        rank,
        nextRankRequirement
      };
    } catch (error) {
      console.error('Error calculating reputation:', error);
      return {
        currentScore: 0,
        breakdown: [],
        trend: 'stable',
        trendPercentage: 0,
        rank: 'Novizio',
        nextRankRequirement: 100
      };
    }
  }

  /**
   * Update user reputation and log changes
   */
  async updateUserReputation(
    userId: string, 
    pointsChange: number, 
    reason: string,
    relatedEntityType?: string,
    relatedEntityId?: string
  ): Promise<void> {
    try {
      // Update user reputation score
      await this.db
        .from('users')
        .update({
          reputation_score: this.db.raw('GREATEST(reputation_score + ?, 0)', [pointsChange])
        })
        .eq('id', userId);

      // Log reputation history
      await this.db
        .from('user_reputation_history')
        .insert({
          user_id: userId,
          points_change: pointsChange,
          reason,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId
        });
    } catch (error) {
      console.error('Error updating user reputation:', error);
    }
  }

  /**
   * Get user statistics for reputation calculation
   */
  private async getUserStats(userId: string): Promise<any> {
    const { data: user } = await this.db
      .from('users')
      .select(`
        *,
        total_votes_cast,
        total_problems_proposed,
        total_followers,
        total_following,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    // Get additional calculated stats
    const [
      { count: achievementsCount },
      { count: favoritesCount },
      { data: problems }
    ] = await Promise.all([
      this.db.from('user_achievements').select('*', { count: 'exact' }).eq('user_id', userId),
      this.db.from('user_favorites').select('*', { count: 'exact' }).eq('user_id', userId),
      this.db
        .from('problems')
        .select('vote_count')
        .eq('proposer_id', userId)
    ]);

    // Calculate additional metrics
    const totalVotesReceived = problems?.reduce((sum: number, p: any) => sum + (p.vote_count || 0), 0) || 0;
    const profileCompleteness = this.calculateProfileCompleteness(user);

    return {
      ...user,
      achievementsCount: achievementsCount || 0,
      favoritesCount: favoritesCount || 0,
      totalVotesReceived,
      profileCompleteness
    };
  }

  /**
   * Get recent activities for consistency calculation
   */
  private async getRecentActivities(userId: string, days: number): Promise<any[]> {
    const { data } = await this.db
      .from('user_activities')
      .select('created_at, activity_type')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Get historical reputation data for trend calculation
   */
  private async getHistoricalData(userId: string, days: number): Promise<any[]> {
    const { data } = await this.db
      .from('user_reputation_history')
      .select('points_change, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    return data || [];
  }

  /**
   * Calculate basic activity reputation
   */
  private calculateBasicActivity(userStats: any) {
    const points = 
      (userStats.total_problems_proposed * this.weights.problemCreated) +
      (userStats.total_votes_cast * this.weights.voteGiven) +
      (userStats.totalVotesReceived * this.weights.voteReceived);

    return {
      category: 'Attività Base',
      points,
      description: `${userStats.total_problems_proposed} problemi, ${userStats.total_votes_cast} voti dati, ${userStats.totalVotesReceived} voti ricevuti`
    };
  }

  /**
   * Calculate quality bonuses
   */
  private async calculateQualityBonuses(userId: string, userStats: any) {
    // Popular problems bonus (problems with 20+ votes)
    const { count: popularProblems } = await this.db
      .from('problems')
      .select('*', { count: 'exact' })
      .eq('proposer_id', userId)
      .gte('vote_count', 20);

    // Early voter bonus (voted on problems that later became popular)
    const earlyVotes = await this.calculateEarlyVoterBonus(userId);

    const points = 
      (popularProblems || 0) * this.weights.popularProblem +
      earlyVotes * this.weights.earlyVoter;

    return {
      category: 'Bonus Qualità',
      points,
      description: `${popularProblems || 0} problemi popolari, ${earlyVotes} voti precoci`
    };
  }

  /**
   * Calculate social factors
   */
  private calculateSocialFactors(userStats: any) {
    const profileBonus = userStats.profileCompleteness >= 0.8 ? this.weights.profileComplete : 0;
    const followerPoints = userStats.total_followers * this.weights.followerGained;

    const points = profileBonus + followerPoints;

    return {
      category: 'Fattori Sociali',
      points,
      description: `Profilo completo: ${profileBonus > 0 ? 'Sì' : 'No'}, ${userStats.total_followers} follower`
    };
  }

  /**
   * Calculate community contribution
   */
  private async calculateCommunityContribution(userId: string) {
    // Diverse category interaction
    const { data: categoryInteractions } = await this.db
      .from('votes')
      .select(`
        problems!inner(category_id)
      `)
      .eq('user_id', userId);

    const uniqueCategories = new Set(
      categoryInteractions?.map((v: any) => v.problems?.category_id).filter(Boolean) || []
    );

    const diversityBonus = Math.min(uniqueCategories.size, 5) * this.weights.diverseInteraction;

    const points = diversityBonus;

    return {
      category: 'Contributo Comunità',
      points,
      description: `Interazione con ${uniqueCategories.size} categorie diverse`
    };
  }

  /**
   * Calculate consistency bonus
   */
  private calculateConsistencyBonus(recentActivities: any[]) {
    if (recentActivities.length === 0) {
      return {
        category: 'Consistenza',
        points: 0,
        description: 'Nessuna attività recente'
      };
    }

    // Group activities by day
    const activityDays = new Set(
      recentActivities.map(activity => 
        new Date(activity.created_at).toDateString()
      )
    );

    const activeDays = activityDays.size;
    const consistencyMultiplier = Math.min(activeDays / 15, 1); // Max bonus at 15 active days
    const points = Math.round(this.weights.consistency * consistencyMultiplier);

    return {
      category: 'Consistenza',
      points,
      description: `Attivo per ${activeDays} giorni negli ultimi 30`
    };
  }

  /**
   * Calculate penalties
   */
  private async calculatePenalties(userId: string, userStats: any) {
    // Inactivity penalty
    const lastActivityDate = new Date(userStats.last_login_at || userStats.created_at);
    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    const inactivityPenalty = daysSinceLastActivity > 30 
      ? Math.min((daysSinceLastActivity - 30) * this.weights.inactivity, -50)
      : 0;

    const points = inactivityPenalty;

    return {
      category: 'Penalità',
      points,
      description: points < 0 
        ? `Inattività: ${daysSinceLastActivity} giorni dall'ultimo accesso`
        : 'Nessuna penalità'
    };
  }

  /**
   * Calculate early voter bonus
   */
  private async calculateEarlyVoterBonus(userId: string): Promise<number> {
    // Find votes on problems that later became popular (20+ votes)
    // where user voted when problem had < 5 votes
    const { data: earlyVotes } = await this.db
      .from('votes')
      .select(`
        problem_id,
        created_at,
        problems!inner(vote_count)
      `)
      .eq('user_id', userId)
      .gte('problems.vote_count', 20);

    if (!earlyVotes) return 0;

    let earlyVoteCount = 0;
    for (const vote of earlyVotes) {
      // Check vote count when user voted (simplified - assumes linear growth)
      const voteRank = await this.getVoteRank(vote.problem_id, vote.created_at);
      if (voteRank <= 5) {
        earlyVoteCount++;
      }
    }

    return earlyVoteCount;
  }

  /**
   * Get vote rank (position when vote was cast)
   */
  private async getVoteRank(problemId: string, voteTime: string): Promise<number> {
    const { count } = await this.db
      .from('votes')
      .select('*', { count: 'exact' })
      .eq('problem_id', problemId)
      .lte('created_at', voteTime);

    return count || 1;
  }

  /**
   * Calculate profile completeness
   */
  private calculateProfileCompleteness(user: any): number {
    const fields = [
      user.name,
      user.avatar_url,
      user.bio,
      user.interests?.length > 0,
      user.location
    ];

    const completedFields = fields.filter(Boolean).length;
    return completedFields / fields.length;
  }

  /**
   * Apply time-based decay to reputation
   */
  private applyDecay(score: number, createdAt: string): number {
    if (!this.decay.enabled) return score;

    const accountAge = Date.now() - new Date(createdAt).getTime();
    const ageInDays = accountAge / (24 * 60 * 60 * 1000);

    if (ageInDays < this.decay.halfLife) return score;

    const decayFactor = Math.pow(0.5, ageInDays / this.decay.halfLife);
    const decayedScore = score * Math.max(decayFactor, this.decay.minimumRetained);

    return decayedScore;
  }

  /**
   * Calculate reputation trend
   */
  private calculateTrend(historicalData: any[], currentScore: number) {
    if (historicalData.length < 2) {
      return { trend: 'stable' as const, trendPercentage: 0 };
    }

    const recentChanges = historicalData.slice(-7); // Last week
    const olderChanges = historicalData.slice(-14, -7); // Week before

    const recentSum = recentChanges.reduce((sum, item) => sum + item.points_change, 0);
    const olderSum = olderChanges.reduce((sum, item) => sum + item.points_change, 0);

    if (Math.abs(recentSum - olderSum) < 5) {
      return { trend: 'stable' as const, trendPercentage: 0 };
    }

    const isIncreasing = recentSum > olderSum;
    const percentage = olderSum === 0 ? 100 : Math.abs((recentSum - olderSum) / olderSum) * 100;

    return {
      trend: isIncreasing ? 'increasing' as const : 'decreasing' as const,
      trendPercentage: Math.round(percentage)
    };
  }

  /**
   * Calculate user rank based on reputation score
   */
  private calculateRank(score: number) {
    const ranks = [
      { name: 'Novizio', min: 0, max: 99 },
      { name: 'Apprendista', min: 100, max: 299 },
      { name: 'Contributore', min: 300, max: 699 },
      { name: 'Esperto', min: 700, max: 1499 },
      { name: 'Veterano', min: 1500, max: 2999 },
      { name: 'Maestro', min: 3000, max: 5999 },
      { name: 'Leggenda', min: 6000, max: Infinity }
    ];

    const currentRank = ranks.find(rank => score >= rank.min && score <= rank.max);
    const nextRank = ranks.find(rank => rank.min > score);

    return {
      rank: currentRank?.name || 'Novizio',
      nextRankRequirement: nextRank ? nextRank.min - score : 0
    };
  }
}

/**
 * Helper functions for reputation display
 */
export function formatReputationScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  } else if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

export function getReputationColor(score: number): string {
  if (score >= 6000) return 'text-purple-600';
  if (score >= 3000) return 'text-gold-600';
  if (score >= 1500) return 'text-blue-600';
  if (score >= 700) return 'text-green-600';
  if (score >= 300) return 'text-yellow-600';
  if (score >= 100) return 'text-orange-600';
  return 'text-gray-600';
}

export function getReputationBadge(score: number): string {
  if (score >= 6000) return '👑';
  if (score >= 3000) return '🏆';
  if (score >= 1500) return '🥇';
  if (score >= 700) return '🥈';
  if (score >= 300) return '🥉';
  if (score >= 100) return '⭐';
  return '🌱';
}