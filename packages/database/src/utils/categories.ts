/**
 * Category database operations
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { 
  Category, 
  CategoryInsert, 
  CategoryUpdate, 
  CategoryWithStats,
  DatabaseOperationResult,
  PaginationOptions
} from '../types';
import { handleDatabaseError, paginate } from './common';

/**
 * Get all active categories
 */
export const getActiveCategories = async (): Promise<DatabaseOperationResult<Category[]>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

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
 * Get all categories (including inactive)
 */
export const getAllCategories = async (
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: Category[]; count: number }>> => {
  try {
    const query = supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('order_index', { ascending: true });

    return await paginate<Category>(query, options);
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get category with problem statistics
 */
export const getCategoryWithStats = async (
  categoryId: string
): Promise<DatabaseOperationResult<CategoryWithStats>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        problems:problems(
          id,
          title,
          description,
          status,
          vote_count,
          created_at,
          proposer:users(id, name, avatar_url)
        )
      `)
      .eq('id', categoryId)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    const categoryWithStats: CategoryWithStats = {
      ...data,
      problemCount: data.problems?.length || 0,
    };

    return {
      success: true,
      data: categoryWithStats,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Create a new category
 */
export const createCategory = async (
  categoryData: CategoryInsert
): Promise<DatabaseOperationResult<Category>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
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
 * Update a category
 */
export const updateCategory = async (
  categoryId: string,
  updates: CategoryUpdate
): Promise<DatabaseOperationResult<Category>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
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
 * Delete a category (soft delete by setting is_active to false)
 */
export const deleteCategory = async (
  categoryId: string,
  hardDelete: boolean = false
): Promise<DatabaseOperationResult<void>> => {
  try {
    let error;

    if (hardDelete) {
      // Hard delete - only if no problems are using this category
      const { data: problems } = await supabase
        .from('problems')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);

      if (problems && problems.length > 0) {
        return {
          success: false,
          error: 'Cannot delete category that has problems assigned to it',
        };
      }

      const deleteResult = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      error = deleteResult.error;
    } else {
      // Soft delete
      const updateResult = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      error = updateResult.error;
    }

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
 * Reorder categories
 */
export const reorderCategories = async (
  categoryOrders: { id: string; order_index: number }[]
): Promise<DatabaseOperationResult<void>> => {
  try {
    const updates = categoryOrders.map(({ id, order_index }) => 
      supabase
        .from('categories')
        .update({ order_index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      return handleDatabaseError(errors[0].error);
    }

    return {
      success: true,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get categories with problem counts
 */
export const getCategoriesWithCounts = async (): Promise<DatabaseOperationResult<CategoryWithStats[]>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        problems:problems(id)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      return handleDatabaseError(error);
    }

    const categoriesWithStats: CategoryWithStats[] = data.map(category => ({
      ...category,
      problemCount: category.problems?.length || 0,
    }));

    return {
      success: true,
      data: categoriesWithStats,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Search categories
 */
export const searchCategories = async (
  searchTerm: string,
  includeInactive: boolean = false
): Promise<DatabaseOperationResult<Category[]>> => {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;

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
 * Get category statistics
 */
export const getCategoryStats = async (): Promise<DatabaseOperationResult<{
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesWithProblems: number;
  averageProblemsPerCategory: number;
}>> => {
  try {
    const [categoriesResult, problemsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('is_active', { count: 'exact' }),
      supabase
        .from('problems')
        .select('category_id', { count: 'exact' })
    ]);

    if (categoriesResult.error) {
      return handleDatabaseError(categoriesResult.error);
    }

    if (problemsResult.error) {
      return handleDatabaseError(problemsResult.error);
    }

    const categories = categoriesResult.data || [];
    const totalCategories = categories.length;
    const activeCategories = categories.filter(cat => cat.is_active).length;
    const inactiveCategories = totalCategories - activeCategories;

    // Get unique categories that have problems
    const uniqueCategories = new Set(
      (problemsResult.data || []).map(problem => problem.category_id)
    );
    const categoriesWithProblems = uniqueCategories.size;

    const averageProblemsPerCategory = activeCategories > 0 ? 
      Math.round(((problemsResult.count || 0) / activeCategories) * 100) / 100 : 0;

    return {
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
        categoriesWithProblems,
        averageProblemsPerCategory,
      },
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get most popular categories (by problem count)
 */
export const getPopularCategories = async (
  limit: number = 5
): Promise<DatabaseOperationResult<CategoryWithStats[]>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        problems:problems(id)
      `)
      .eq('is_active', true);

    if (error) {
      return handleDatabaseError(error);
    }

    const categoriesWithStats: CategoryWithStats[] = data
      .map(category => ({
        ...category,
        problemCount: category.problems?.length || 0,
      }))
      .sort((a, b) => (b.problemCount || 0) - (a.problemCount || 0))
      .slice(0, limit);

    return {
      success: true,
      data: categoriesWithStats,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};