/**
 * Problem database operations
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { 
  Problem, 
  ProblemInsert, 
  ProblemUpdate, 
  ProblemWithDetails,
  ProblemFilters,
  ProblemSortOptions,
  DatabaseOperationResult,
  PaginationOptions
} from '../types';
import { handleDatabaseError, paginate } from './common';

/**
 * Get problem with full details
 */
export const getProblemWithDetails = async (
  problemId: string,
  userId?: string
): Promise<DatabaseOperationResult<ProblemWithDetails>> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id, created_at),
        apps:apps(id, name, description, slug, is_published, access_model)
      `)
      .eq('id', problemId)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    // Check if current user has voted
    const hasUserVoted = userId ? 
      data.votes?.some((vote: any) => vote.user_id === userId) : false;

    // Get voter details
    const voterIds = data.votes?.map((vote: any) => vote.user_id) || [];
    const votersResult = voterIds.length > 0 ? await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', voterIds) : { data: [], error: null };

    const problemWithDetails: ProblemWithDetails = {
      ...data,
      hasUserVoted,
      voters: votersResult.data || [],
    };

    return {
      success: true,
      data: problemWithDetails,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get problems with filtering and sorting
 */
export const getProblems = async (
  filters: ProblemFilters = {},
  sortOptions: ProblemSortOptions = { field: 'created_at', direction: 'desc' },
  pagination: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: ProblemWithDetails[]; count: number }>> => {
  try {
    let query = supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
      `, { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.proposer) {
      query = query.eq('proposer_id', filters.proposer);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.minVotes) {
      query = query.gte('vote_count', filters.minVotes);
    }
    if (filters.maxVotes) {
      query = query.lte('vote_count', filters.maxVotes);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply sorting
    query = query.order(sortOptions.field, { ascending: sortOptions.direction === 'asc' });

    const result = await paginate<ProblemWithDetails>(query, pagination);

    return result;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Create a new problem
 */
export const createProblem = async (problemData: ProblemInsert): Promise<DatabaseOperationResult<Problem>> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .insert(problemData)
      .select()
      .single();

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
 * Update a problem
 */
export const updateProblem = async (
  problemId: string,
  updates: ProblemUpdate
): Promise<DatabaseOperationResult<Problem>> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .update(updates)
      .eq('id', problemId)
      .select()
      .single();

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
 * Delete a problem
 */
export const deleteProblem = async (problemId: string): Promise<DatabaseOperationResult<void>> => {
  try {
    const { error } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId);

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

/**
 * Get problems by category
 */
export const getProblemsByCategory = async (
  categoryId: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: ProblemWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
      `, { count: 'exact' })
      .eq('category_id', categoryId)
      .order('vote_count', { ascending: false });

    return await paginate<ProblemWithDetails>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get problems by user
 */
export const getProblemsByUser = async (
  userId: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: ProblemWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
      `, { count: 'exact' })
      .eq('proposer_id', userId)
      .order('created_at', { ascending: false });

    return await paginate<ProblemWithDetails>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get trending problems (most voted recently)
 */
export const getTrendingProblems = async (
  limit: number = 10
): Promise<DatabaseOperationResult<ProblemWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
      `)
      .order('vote_count', { ascending: false })
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
 * Get recent problems
 */
export const getRecentProblems = async (
  limit: number = 10
): Promise<DatabaseOperationResult<ProblemWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
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
 * Search problems
 */
export const searchProblems = async (
  searchTerm: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: ProblemWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('problems')
      .select(`
        *,
        proposer:users(id, name, email, avatar_url),
        category:categories(id, name, description),
        votes:votes(user_id)
      `, { count: 'exact' })
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('vote_count', { ascending: false });

    return await paginate<ProblemWithDetails>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get problem stats
 */
export const getProblemStats = async (): Promise<DatabaseOperationResult<{
  totalProblems: number;
  proposedProblems: number;
  inDevelopmentProblems: number;
  completedProblems: number;
  totalVotes: number;
}>> => {
  try {
    const [problemsResult, votesResult] = await Promise.all([
      supabase
        .from('problems')
        .select('status', { count: 'exact' }),
      supabase
        .from('votes')
        .select('*', { count: 'exact' })
    ]);

    if (problemsResult.error) {
      return handleDatabaseError(problemsResult.error);
    }

    if (votesResult.error) {
      return handleDatabaseError(votesResult.error);
    }

    const problems = problemsResult.data || [];
    const statusCounts = problems.reduce((acc, problem) => {
      acc[problem.status] = (acc[problem.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        totalProblems: problems.length,
        proposedProblems: statusCounts['Proposed'] || 0,
        inDevelopmentProblems: statusCounts['In Development'] || 0,
        completedProblems: statusCounts['Completed'] || 0,
        totalVotes: votesResult.count || 0,
      },
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};