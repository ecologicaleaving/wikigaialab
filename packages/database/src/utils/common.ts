/**
 * Common database utility functions
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { DatabaseOperationResult, PaginationOptions } from '../types';

/**
 * Generic pagination utility
 */
export const paginate = <T>(
  query: any,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: T[]; count: number }>> => {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  return query
    .range(offset, offset + limit - 1)
    .then(({ data, error, count }: any) => ({
      success: !error,
      data: error ? undefined : { data, count: count || 0 },
      error: error?.message,
    }));
};

/**
 * Handle database errors consistently
 */
export const handleDatabaseError = <T = unknown>(error: any): DatabaseOperationResult<T> => {
  console.error('Database error:', error);
  
  return {
    success: false,
    error: error?.message || 'An unknown database error occurred',
  };
};

/**
 * Check if user exists
 */
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
};

/**
 * Check if problem exists
 */
export const problemExists = async (problemId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('id')
      .eq('id', problemId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
};

/**
 * Get current user from auth context
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    return !error && data?.is_admin === true;
  } catch {
    return false;
  }
};

/**
 * Transaction wrapper for multiple operations
 */
export const withTransaction = async <T>(
  operations: (() => Promise<T>)[]
): Promise<DatabaseOperationResult<T[]>> => {
  const results: T[] = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    return handleDatabaseError<T[]>(error);
  }
};

/**
 * Search across multiple tables
 */
export const globalSearch = async (
  query: string,
  limit: number = 20
): Promise<DatabaseOperationResult<{
  problems: any[];
  users: any[];
  categories: any[];
  apps: any[];
}>> => {
  try {
    const searchTerm = `%${query}%`;
    
    const [problemsResult, usersResult, categoriesResult, appsResult] = await Promise.all([
      supabase
        .from('problems')
        .select('*')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(limit),
      
      supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(limit),
      
      supabase
        .from('categories')
        .select('*')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(limit),
      
      supabase
        .from('apps')
        .select('*')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq('is_published', true)
        .limit(limit)
    ]);

    const errors = [problemsResult.error, usersResult.error, categoriesResult.error, appsResult.error]
      .filter(Boolean);

    if (errors.length > 0) {
      return handleDatabaseError<{
        problems: any[];
        users: any[];
        categories: any[];
        apps: any[];
      }>(errors[0]);
    }

    return {
      success: true,
      data: {
        problems: problemsResult.data || [],
        users: usersResult.data || [],
        categories: categoriesResult.data || [],
        apps: appsResult.data || [],
      },
    };
  } catch (error) {
    return handleDatabaseError<{
      problems: any[];
      users: any[];
      categories: any[];
      apps: any[];
    }>(error);
  }
};