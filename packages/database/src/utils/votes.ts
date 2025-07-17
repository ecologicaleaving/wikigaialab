/**
 * Vote database operations
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { 
  Vote, 
  VoteInsert, 
  VotingResult,
  DatabaseOperationResult,
  PaginationOptions
} from '../types';
import { handleDatabaseError, paginate, userExists, problemExists } from './common';

/**
 * Cast a vote for a problem
 */
export const castVote = async (
  userId: string,
  problemId: string
): Promise<DatabaseOperationResult<VotingResult>> => {
  try {
    // Check if user and problem exist
    const [userExistsResult, problemExistsResult] = await Promise.all([
      userExists(userId),
      problemExists(problemId)
    ]);

    if (!userExistsResult) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (!problemExistsResult) {
      return {
        success: false,
        error: 'Problem not found',
      };
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single();

    if (existingVote) {
      return {
        success: false,
        error: 'User has already voted on this problem',
      };
    }

    // Cast the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ user_id: userId, problem_id: problemId });

    if (voteError) {
      return handleDatabaseError(voteError);
    }

    // Get updated vote count
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('vote_count')
      .eq('id', problemId)
      .single();

    if (problemError) {
      return handleDatabaseError(problemError);
    }

    const votingResult: VotingResult = {
      success: true,
      newVoteCount: problem.vote_count,
      hasVoted: true,
    };

    return {
      success: true,
      data: votingResult,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Remove a vote from a problem
 */
export const removeVote = async (
  userId: string,
  problemId: string
): Promise<DatabaseOperationResult<VotingResult>> => {
  try {
    // Check if vote exists
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single();

    if (!existingVote) {
      return {
        success: false,
        error: 'Vote not found',
      };
    }

    // Remove the vote
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId)
      .eq('problem_id', problemId);

    if (deleteError) {
      return handleDatabaseError(deleteError);
    }

    // Get updated vote count
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('vote_count')
      .eq('id', problemId)
      .single();

    if (problemError) {
      return handleDatabaseError(problemError);
    }

    const votingResult: VotingResult = {
      success: true,
      newVoteCount: problem.vote_count,
      hasVoted: false,
    };

    return {
      success: true,
      data: votingResult,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Toggle vote (cast if not voted, remove if voted)
 */
export const toggleVote = async (
  userId: string,
  problemId: string
): Promise<DatabaseOperationResult<VotingResult>> => {
  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single();

    if (existingVote) {
      // Remove vote
      return await removeVote(userId, problemId);
    } else {
      // Cast vote
      return await castVote(userId, problemId);
    }
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Check if user has voted on a problem
 */
export const hasUserVoted = async (
  userId: string,
  problemId: string
): Promise<DatabaseOperationResult<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return handleDatabaseError(error);
    }

    return {
      success: true,
      data: !!data,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get votes for a problem
 */
export const getProblemVotes = async (
  problemId: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: any[]; count: number }>> => {
  try {
    const query = supabase
      .from('votes')
      .select(`
        *,
        users:users(id, name, email, avatar_url)
      `, { count: 'exact' })
      .eq('problem_id', problemId)
      .order('created_at', { ascending: false });

    return await paginate(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get votes by user
 */
export const getUserVotes = async (
  userId: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: any[]; count: number }>> => {
  try {
    const query = supabase
      .from('votes')
      .select(`
        *,
        problems:problems(
          id,
          title,
          description,
          category_id,
          status,
          vote_count,
          created_at,
          categories:categories(name)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return await paginate(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get recent votes across all problems
 */
export const getRecentVotes = async (
  limit: number = 20
): Promise<DatabaseOperationResult<any[]>> => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        *,
        users:users(id, name, email, avatar_url),
        problems:problems(
          id,
          title,
          description,
          category_id,
          status,
          vote_count,
          categories:categories(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return handleDatabaseError(error);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get vote statistics
 */
export const getVoteStats = async (): Promise<DatabaseOperationResult<{
  totalVotes: number;
  uniqueVoters: number;
  averageVotesPerProblem: number;
  mostVotedProblem: any;
}>> => {
  try {
    const [votesResult, uniqueVotersResult, problemsResult] = await Promise.all([
      supabase
        .from('votes')
        .select('*', { count: 'exact' }),
      supabase
        .from('votes')
        .select('user_id', { count: 'exact' })
        .group('user_id'),
      supabase
        .from('problems')
        .select('*')
        .order('vote_count', { ascending: false })
        .limit(1)
    ]);

    if (votesResult.error) {
      return handleDatabaseError(votesResult.error);
    }

    if (uniqueVotersResult.error) {
      return handleDatabaseError(uniqueVotersResult.error);
    }

    if (problemsResult.error) {
      return handleDatabaseError(problemsResult.error);
    }

    const totalVotes = votesResult.count || 0;
    const uniqueVoters = uniqueVotersResult.count || 0;
    const totalProblems = await supabase
      .from('problems')
      .select('*', { count: 'exact' });

    const averageVotesPerProblem = totalProblems.count ? 
      Math.round(totalVotes / totalProblems.count * 100) / 100 : 0;

    return {
      success: true,
      data: {
        totalVotes,
        uniqueVoters,
        averageVotesPerProblem,
        mostVotedProblem: problemsResult.data?.[0] || null,
      },
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get voting trends over time
 */
export const getVotingTrends = async (
  days: number = 30
): Promise<DatabaseOperationResult<any[]>> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('votes')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return handleDatabaseError(error);
    }

    // Group votes by day
    const votesByDay = data.reduce((acc: any[], vote) => {
      const date = new Date(vote.created_at).toISOString().split('T')[0];
      const existingDay = acc.find(day => day.date === date);
      
      if (existingDay) {
        existingDay.votes += 1;
      } else {
        acc.push({ date, votes: 1 });
      }
      
      return acc;
    }, []);

    return {
      success: true,
      data: votesByDay,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Bulk vote operations (admin only)
 */
export const bulkDeleteVotes = async (
  voteIds: string[]
): Promise<DatabaseOperationResult<void>> => {
  try {
    const { error } = await supabase
      .from('votes')
      .delete()
      .in('id', voteIds);

    if (error) {
      return handleDatabaseError(error);
    }

    return {
      success: true,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};