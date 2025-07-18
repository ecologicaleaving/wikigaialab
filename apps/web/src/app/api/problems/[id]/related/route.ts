import { NextRequest, NextResponse } from 'next/server';
import { supabase, withErrorHandling } from '../../../../../lib/supabase';

// Types for related problems system
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

interface SimilarityScore {
  problem_id: string;
  similarity_score: number;
  similarity_type: string;
}

// Related Problems Algorithm Engine
class RelatedProblemsEngine {
  private targetProblemId: string;
  private targetProblem: any;

  constructor(targetProblemId: string) {
    this.targetProblemId = targetProblemId;
  }

  // Find related problems using multiple similarity approaches
  async findRelatedProblems(limit: number = 10): Promise<RelatedProblem[]> {
    try {
      // Get target problem details
      this.targetProblem = await this.getTargetProblem();
      if (!this.targetProblem) {
        throw new Error('Target problem not found');
      }

      // Calculate similarities using different approaches
      const similarities = await this.calculateAllSimilarities();

      // Get problem details for similar problems
      const relatedProblems = await this.getRelatedProblemsDetails(similarities, limit);

      // Track related problems view for analytics
      await this.trackRelatedProblemsView(relatedProblems.length);

      return relatedProblems;

    } catch (error) {
      console.error('Error finding related problems:', error);
      throw error;
    }
  }

  // Get target problem details
  private async getTargetProblem(): Promise<any> {
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
      .eq('id', this.targetProblemId)
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate all types of similarities
  private async calculateAllSimilarities(): Promise<SimilarityScore[]> {
    try {
      // Check cache first
      const cachedSimilarities = await this.getCachedSimilarities();
      if (cachedSimilarities.length > 0) {
        return cachedSimilarities;
      }

      // Calculate fresh similarities
      const similarities: SimilarityScore[] = [];

      // 1. Content-based similarity (text similarity)
      const contentSimilarities = await this.calculateContentSimilarity();
      similarities.push(...contentSimilarities);

      // 2. Category-based similarity
      const categorySimilarities = await this.calculateCategorySimilarity();
      similarities.push(...categorySimilarities);

      // 3. Voting pattern similarity
      const votingSimilarities = await this.calculateVotingPatternSimilarity();
      similarities.push(...votingSimilarities);

      // 4. User interaction similarity
      const interactionSimilarities = await this.calculateUserInteractionSimilarity();
      similarities.push(...interactionSimilarities);

      // Cache the calculated similarities
      await this.cacheSimilarities(similarities);

      return similarities;

    } catch (error) {
      console.error('Error calculating similarities:', error);
      return [];
    }
  }

  // Get cached similarities from database
  private async getCachedSimilarities(): Promise<SimilarityScore[]> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data, error } = await supabase
        .from('problem_similarities')
        .select('problem_b_id, similarity_score, similarity_type')
        .eq('problem_a_id', this.targetProblemId)
        .gte('calculated_at', oneHourAgo.toISOString())
        .order('similarity_score', { ascending: false });

      if (error || !data) return [];

      return data.map(item => ({
        problem_id: item.problem_b_id,
        similarity_score: item.similarity_score,
        similarity_type: item.similarity_type
      }));

    } catch (error) {
      console.error('Error getting cached similarities:', error);
      return [];
    }
  }

  // Calculate content-based similarity using text analysis
  private async calculateContentSimilarity(): Promise<SimilarityScore[]> {
    try {
      // Get candidate problems for comparison
      const { data: candidates, error } = await supabase
        .from('problems')
        .select('id, title, description, category_id')
        .neq('id', this.targetProblemId)
        .eq('status', 'Proposed')
        .limit(200);

      if (error || !candidates) return [];

      const similarities: SimilarityScore[] = [];

      for (const candidate of candidates) {
        const score = this.calculateTextSimilarity(
          this.targetProblem.title + ' ' + this.targetProblem.description,
          candidate.title + ' ' + candidate.description
        );

        if (score > 0.1) { // Only include meaningful similarities
          similarities.push({
            problem_id: candidate.id,
            similarity_score: score,
            similarity_type: 'content'
          });
        }
      }

      return similarities.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 20);

    } catch (error) {
      console.error('Error calculating content similarity:', error);
      return [];
    }
  }

  // Simple text similarity using Jaccard coefficient
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple tokenization and similarity calculation
    const tokens1 = new Set(text1.toLowerCase().split(/\W+/).filter(word => word.length > 2));
    const tokens2 = new Set(text2.toLowerCase().split(/\W+/).filter(word => word.length > 2));

    const intersection = new Set([...tokens1].filter(word => tokens2.has(word)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate category-based similarity
  private async calculateCategorySimilarity(): Promise<SimilarityScore[]> {
    try {
      // Find problems in the same category
      const { data: sameCategory, error } = await supabase
        .from('problems')
        .select('id, vote_count')
        .eq('category_id', this.targetProblem.category_id)
        .neq('id', this.targetProblemId)
        .eq('status', 'Proposed')
        .order('vote_count', { ascending: false })
        .limit(15);

      if (error || !sameCategory) return [];

      // Score based on vote count similarity and category match
      return sameCategory.map(problem => {
        const voteRatio = Math.min(
          problem.vote_count / Math.max(this.targetProblem.vote_count, 1),
          this.targetProblem.vote_count / Math.max(problem.vote_count, 1)
        );
        
        return {
          problem_id: problem.id,
          similarity_score: 0.7 + (voteRatio * 0.3), // Base category similarity + vote similarity
          similarity_type: 'category'
        };
      });

    } catch (error) {
      console.error('Error calculating category similarity:', error);
      return [];
    }
  }

  // Calculate voting pattern similarity (users who voted for this also voted for...)
  private async calculateVotingPatternSimilarity(): Promise<SimilarityScore[]> {
    try {
      // Get users who voted for the target problem
      const { data: targetVoters, error: votersError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('problem_id', this.targetProblemId);

      if (votersError || !targetVoters?.length) return [];

      const voterIds = targetVoters.map(v => v.user_id);

      // Find problems these users also voted for
      const { data: otherVotes, error: otherVotesError } = await supabase
        .from('votes')
        .select('problem_id')
        .in('user_id', voterIds)
        .neq('problem_id', this.targetProblemId);

      if (otherVotesError || !otherVotes) return [];

      // Count votes per problem
      const problemVoteCounts = new Map<string, number>();
      for (const vote of otherVotes) {
        problemVoteCounts.set(
          vote.problem_id, 
          (problemVoteCounts.get(vote.problem_id) || 0) + 1
        );
      }

      // Calculate similarity scores
      const similarities: SimilarityScore[] = [];
      const totalTargetVoters = voterIds.length;

      for (const [problemId, voteCount] of problemVoteCounts.entries()) {
        if (voteCount >= 2) { // At least 2 shared voters
          const similarity = voteCount / totalTargetVoters;
          similarities.push({
            problem_id: problemId,
            similarity_score: Math.min(similarity, 1.0),
            similarity_type: 'voting_pattern'
          });
        }
      }

      return similarities
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 15);

    } catch (error) {
      console.error('Error calculating voting pattern similarity:', error);
      return [];
    }
  }

  // Calculate user interaction similarity
  private async calculateUserInteractionSimilarity(): Promise<SimilarityScore[]> {
    try {
      // Get users who interacted with the target problem
      const { data: targetInteractions, error } = await supabase
        .from('user_problem_interactions')
        .select('user_id, interaction_type, interaction_weight')
        .eq('problem_id', this.targetProblemId);

      if (error || !targetInteractions?.length) return [];

      const userIds = [...new Set(targetInteractions.map(i => i.user_id))];

      // Find problems these users also interacted with
      const { data: otherInteractions, error: otherError } = await supabase
        .from('user_problem_interactions')
        .select('problem_id, user_id, interaction_weight')
        .in('user_id', userIds)
        .neq('problem_id', this.targetProblemId);

      if (otherError || !otherInteractions) return [];

      // Calculate weighted interaction similarities
      const problemInteractionScores = new Map<string, number>();
      const problemUserCounts = new Map<string, number>();

      for (const interaction of otherInteractions) {
        const currentScore = problemInteractionScores.get(interaction.problem_id) || 0;
        const weight = interaction.interaction_weight || 1;
        
        problemInteractionScores.set(interaction.problem_id, currentScore + weight);
        problemUserCounts.set(
          interaction.problem_id,
          (problemUserCounts.get(interaction.problem_id) || 0) + 1
        );
      }

      // Convert to similarity scores
      const similarities: SimilarityScore[] = [];
      const totalUsers = userIds.length;

      for (const [problemId, score] of problemInteractionScores.entries()) {
        const userCount = problemUserCounts.get(problemId) || 0;
        if (userCount >= 2) { // At least 2 shared users
          const similarity = Math.min((userCount / totalUsers) * (score / userCount / 5), 1.0);
          similarities.push({
            problem_id: problemId,
            similarity_score: similarity,
            similarity_type: 'user_interaction'
          });
        }
      }

      return similarities
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 10);

    } catch (error) {
      console.error('Error calculating user interaction similarity:', error);
      return [];
    }
  }

  // Cache calculated similarities
  private async cacheSimilarities(similarities: SimilarityScore[]): Promise<void> {
    try {
      if (similarities.length === 0) return;

      const cacheEntries = similarities.map(sim => ({
        problem_a_id: this.targetProblemId,
        problem_b_id: sim.problem_id,
        similarity_score: sim.similarity_score,
        similarity_type: sim.similarity_type,
        calculated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('problem_similarities')
        .upsert(cacheEntries, { 
          onConflict: 'problem_a_id,problem_b_id,similarity_type' 
        });

      if (error) {
        console.error('Error caching similarities:', error);
      }

    } catch (error) {
      console.error('Error in cacheSimilarities:', error);
    }
  }

  // Get full problem details for related problems
  private async getRelatedProblemsDetails(
    similarities: SimilarityScore[], 
    limit: number
  ): Promise<RelatedProblem[]> {
    if (similarities.length === 0) return [];

    // Combine and rank similarities using hybrid scoring
    const combinedScores = this.combineSimilarityScores(similarities);
    const topSimilarities = combinedScores.slice(0, limit);

    if (topSimilarities.length === 0) return [];

    const problemIds = topSimilarities.map(s => s.problem_id);

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
      .eq('status', 'Proposed');

    if (error) throw error;

    // Map back to include similarity scores
    return (data || []).map(problem => {
      const similarity = topSimilarities.find(s => s.problem_id === problem.id);
      return {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        category_id: problem.category_id,
        vote_count: problem.vote_count,
        created_at: problem.created_at,
        similarity_score: similarity?.similarity_score || 0,
        similarity_type: similarity?.similarity_type || 'unknown',
        category: { name: (problem.categories as any)?.name || 'Unknown' },
        proposer: { name: (problem.users as any)?.name || 'Anonymous' }
      };
    }).sort((a, b) => b.similarity_score - a.similarity_score);
  }

  // Combine different similarity scores using hybrid approach
  private combineSimilarityScores(similarities: SimilarityScore[]): SimilarityScore[] {
    const problemScores = new Map<string, {
      scores: { [type: string]: number },
      combinedScore: number
    }>();

    // Group similarities by problem
    for (const sim of similarities) {
      if (!problemScores.has(sim.problem_id)) {
        problemScores.set(sim.problem_id, {
          scores: {},
          combinedScore: 0
        });
      }
      problemScores.get(sim.problem_id)!.scores[sim.similarity_type] = sim.similarity_score;
    }

    // Calculate combined scores with weights
    const typeWeights = {
      content: 0.3,
      category: 0.25,
      voting_pattern: 0.3,
      user_interaction: 0.15
    };

    const result: SimilarityScore[] = [];

    for (const [problemId, data] of problemScores.entries()) {
      let combinedScore = 0;
      let totalWeight = 0;

      for (const [type, weight] of Object.entries(typeWeights)) {
        if (data.scores[type] !== undefined) {
          combinedScore += data.scores[type] * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        result.push({
          problem_id: problemId,
          similarity_score: combinedScore / totalWeight,
          similarity_type: 'hybrid'
        });
      }
    }

    return result.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  // Track related problems view for analytics
  private async trackRelatedProblemsView(count: number): Promise<void> {
    try {
      await supabase
        .from('discovery_analytics')
        .insert({
          user_id: null, // Anonymous for now
          discovery_method: 'similar',
          source_id: this.targetProblemId,
          problems_discovered: count,
          session_id: `related_${Date.now()}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking related problems view:', error);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const problemId = params.id;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const refresh = url.searchParams.get('refresh') === 'true';

    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }

    // Create related problems engine
    const engine = new RelatedProblemsEngine(problemId);

    // Find related problems
    const relatedProblems = await engine.findRelatedProblems(limit);

    return NextResponse.json({
      success: true,
      data: relatedProblems,
      metadata: {
        target_problem_id: problemId,
        total: relatedProblems.length,
        generated_at: new Date().toISOString(),
        algorithm_version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error in related problems API:', error);
    return NextResponse.json(
      { error: 'Failed to find related problems' },
      { status: 500 }
    );
  }
}