/**
 * App database operations
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { 
  App, 
  AppInsert, 
  AppUpdate, 
  AppWithDetails,
  DatabaseOperationResult,
  PaginationOptions
} from '../types';
import { handleDatabaseError, paginate } from './common';

/**
 * Get all published apps
 */
export const getPublishedApps = async (
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: AppWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `, { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    const result = await paginate<AppWithDetails>(query, options);
    
    // Transform JSONB features to string arrays
    if (result.success && result.data) {
      result.data.data = result.data.data.map(app => ({
        ...app,
        baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
        premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
      }));
    }

    return result;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get all apps (including unpublished) - admin only
 */
export const getAllApps = async (
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: AppWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    const result = await paginate<AppWithDetails>(query, options);
    
    // Transform JSONB features to string arrays
    if (result.success && result.data) {
      result.data.data = result.data.data.map(app => ({
        ...app,
        baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
        premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
      }));
    }

    return result;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get app by ID
 */
export const getAppById = async (
  appId: string
): Promise<DatabaseOperationResult<AppWithDetails>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          proposer:users(id, name, avatar_url),
          category:categories(id, name, description)
        )
      `)
      .eq('id', appId)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    const appWithDetails: AppWithDetails = {
      ...data,
      baseFeatures: Array.isArray(data.base_features) ? data.base_features : [],
      premiumFeatures: Array.isArray(data.premium_features) ? data.premium_features : [],
    };

    return {
      success: true,
      data: appWithDetails,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get app by slug
 */
export const getAppBySlug = async (
  slug: string
): Promise<DatabaseOperationResult<AppWithDetails>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          proposer:users(id, name, avatar_url),
          category:categories(id, name, description)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    const appWithDetails: AppWithDetails = {
      ...data,
      baseFeatures: Array.isArray(data.base_features) ? data.base_features : [],
      premiumFeatures: Array.isArray(data.premium_features) ? data.premium_features : [],
    };

    return {
      success: true,
      data: appWithDetails,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Create a new app
 */
export const createApp = async (
  appData: AppInsert
): Promise<DatabaseOperationResult<App>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .insert(appData)
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
 * Update an app
 */
export const updateApp = async (
  appId: string,
  updates: AppUpdate
): Promise<DatabaseOperationResult<App>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .update(updates)
      .eq('id', appId)
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
 * Delete an app
 */
export const deleteApp = async (appId: string): Promise<DatabaseOperationResult<void>> => {
  try {
    const { error } = await supabase
      .from('apps')
      .delete()
      .eq('id', appId);

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
 * Publish an app
 */
export const publishApp = async (appId: string): Promise<DatabaseOperationResult<App>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .update({ is_published: true })
      .eq('id', appId)
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
 * Unpublish an app
 */
export const unpublishApp = async (appId: string): Promise<DatabaseOperationResult<App>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .update({ is_published: false })
      .eq('id', appId)
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
 * Get apps by problem ID
 */
export const getAppsByProblem = async (
  problemId: string
): Promise<DatabaseOperationResult<AppWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `)
      .eq('problem_id', problemId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return handleDatabaseError(error);
    }

    const appsWithDetails: AppWithDetails[] = data.map(app => ({
      ...app,
      baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
      premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
    }));

    return {
      success: true,
      data: appsWithDetails,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Search apps
 */
export const searchApps = async (
  searchTerm: string,
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: AppWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `, { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    const result = await paginate<AppWithDetails>(query, options);
    
    // Transform JSONB features to string arrays
    if (result.success && result.data) {
      result.data.data = result.data.data.map(app => ({
        ...app,
        baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
        premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
      }));
    }

    return result;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get apps by access model
 */
export const getAppsByAccessModel = async (
  accessModel: 'freemium' | 'subscription' | 'one-time',
  options: PaginationOptions = {}
): Promise<DatabaseOperationResult<{ data: AppWithDetails[]; count: number }>> => {
  try {
    const query = supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `, { count: 'exact' })
      .eq('access_model', accessModel)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    const result = await paginate<AppWithDetails>(query, options);
    
    // Transform JSONB features to string arrays
    if (result.success && result.data) {
      result.data.data = result.data.data.map(app => ({
        ...app,
        baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
        premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
      }));
    }

    return result;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get featured apps (most popular or recently published)
 */
export const getFeaturedApps = async (
  limit: number = 6
): Promise<DatabaseOperationResult<AppWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        problem:problems(
          id,
          title,
          description,
          status,
          vote_count,
          category:categories(id, name)
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return handleDatabaseError(error);
    }

    const appsWithDetails: AppWithDetails[] = data.map(app => ({
      ...app,
      baseFeatures: Array.isArray(app.base_features) ? app.base_features : [],
      premiumFeatures: Array.isArray(app.premium_features) ? app.premium_features : [],
    }));

    return {
      success: true,
      data: appsWithDetails,
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Get app statistics
 */
export const getAppStats = async (): Promise<DatabaseOperationResult<{
  totalApps: number;
  publishedApps: number;
  unpublishedApps: number;
  freemiumApps: number;
  subscriptionApps: number;
  oneTimeApps: number;
}>> => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select('is_published, access_model', { count: 'exact' });

    if (error) {
      return handleDatabaseError(error);
    }

    const apps = data || [];
    const totalApps = apps.length;
    const publishedApps = apps.filter(app => app.is_published).length;
    const unpublishedApps = totalApps - publishedApps;
    
    const freemiumApps = apps.filter(app => app.access_model === 'freemium').length;
    const subscriptionApps = apps.filter(app => app.access_model === 'subscription').length;
    const oneTimeApps = apps.filter(app => app.access_model === 'one-time').length;

    return {
      success: true,
      data: {
        totalApps,
        publishedApps,
        unpublishedApps,
        freemiumApps,
        subscriptionApps,
        oneTimeApps,
      },
    };
  } catch (error) {
    return handleDatabaseError(error);
  }
};