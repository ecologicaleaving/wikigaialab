/**
 * User database operations
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { 
  User, 
  UserInsert, 
  UserUpdate, 
  UserProfile, 
  UserStats,
  DatabaseOperationResult,
  PaginationOptions
} from '../types';
import { handleDatabaseError, paginate } from './common';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<DatabaseOperationResult<UserProfile>> => {
  try {
    const { data, error } = await supabase
      .from('users')
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
          updated_at
        ),
        votes:votes(
          problem_id,
          created_at,
          problems:problems(
            id,
            title,
            description,
            category_id,
            status,
            vote_count,
            created_at
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    // Transform votes to include voted problems
    const userProfile: UserProfile = {
      ...data,
      votedProblems: data.votes?.map((vote: any) => vote.problems) || []
    };

    return {
      success: true,
      data: userProfile,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (userData: UserInsert): Promise<DatabaseOperationResult<User>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
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
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  updates: UserUpdate
): Promise<DatabaseOperationResult<User>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
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
 * Get user statistics
 */
export const getUserStats = async (userId: string): Promise<DatabaseOperationResult<UserStats>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('total_votes_cast, total_problems_proposed, created_at, last_login_at, subscription_status')
      .eq('id', userId)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    const stats: UserStats = {
      totalVotesCast: data.total_votes_cast,
      totalProblemsProposed: data.total_problems_proposed,
      joinedAt: data.created_at,
      lastActive: data.last_login_at,
      subscriptionStatus: data.subscription_status,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get all users with pagination
 */
export const getUsers = async (
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: User[]; count: number }>> => {
  try {
    const query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    return await paginate<User>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (
  searchTerm: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: User[]; count: number }>> => {
  try {
    const query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    return await paginate<User>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Update user's last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<DatabaseOperationResult<User>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
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
 * Get top users by vote count
 */
export const getTopUsers = async (
  limit: number = 10
): Promise<DatabaseOperationResult<User[]>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('total_votes_cast', { ascending: false })
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
 * Get user's voting history
 */
export const getUserVotingHistory = async (
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
 * Delete user account (admin only)
 */
export const deleteUser = async (userId: string): Promise<DatabaseOperationResult<void>> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

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