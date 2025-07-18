import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@wikigaialab/database';
import { 
  withApiHandler, 
  apiResponse, 
  apiErrors, 
  validateRequest,
  withDatabaseErrorHandling,
  commonSchemas 
} from '../../../../lib/api-middleware';
import { 
  apiRateLimit,
  withRateLimitAnalytics 
} from '../../../../lib/rate-limiter';

// Advanced search request validation schema
const searchProblemsSchema = z.object({
  method: z.literal('GET'),
  query: z.object({
    // Search query
    q: z.string().max(100).optional(),
    
    // Advanced filters
    category: z.string().uuid().optional(),
    status: z.enum(['Proposed', 'In Development', 'Completed', 'Rejected']).optional(),
    proposer: z.string().uuid().optional(),
    
    // Vote count range
    min_votes: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    max_votes: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    
    // Date range filters
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    
    // Sort options
    sort_by: z.enum(['relevance', 'vote_count', 'created_at', 'updated_at', 'trending']).default('relevance'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    
    // Pagination
    page: z.string().optional().transform(val => Math.max(1, parseInt(val || '1'))),
    limit: z.string().optional().transform(val => Math.min(50, Math.max(1, parseInt(val || '20')))),
    
    // Search options
    highlight: z.string().optional().transform(val => val === 'true'),
    include_description: z.string().optional().transform(val => val !== 'false'),
    
    // Analytics tracking
    search_id: z.string().optional(),
  }),
});

// Search result highlighting utility
function highlightText(text: string, query: string): string {
  if (!query || query.length < 2) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Calculate trending score (simplified algorithm)
function calculateTrendingScore(voteCount: number, createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const ageInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  // Trending score: votes / (age_in_hours + 2)^1.8
  // This gives more weight to recent posts with votes
  return voteCount / Math.pow(ageInHours + 2, 1.8);
}

// GET handler for advanced search
export const GET = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Apply rate limiting
  await withRateLimitAnalytics(apiRateLimit, 'search_problems')(request);
  
  // Validate request structure
  const validateReq = validateRequest(searchProblemsSchema);
  const { query } = await validateReq(request);
  const { 
    q, 
    category, 
    status, 
    proposer,
    min_votes,
    max_votes,
    date_from,
    date_to,
    sort_by, 
    sort_order, 
    page, 
    limit,
    highlight,
    include_description,
    search_id
  } = query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get Supabase client
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  // Start building the query
  let searchQuery = supabase
    .from('problems')
    .select(`
      id,
      title,
      description,
      status,
      vote_count,
      created_at,
      updated_at,
      proposer:users!proposer_id(id, name, avatar_url),
      category:categories!category_id(id, name)
    `, { count: 'exact' });

  // Apply full-text search if query provided
  if (q && q.length >= 2) {
    const sanitizedQuery = q.replace(/['"\\]/g, '');
    
    if (include_description) {
      // Use PostgreSQL full-text search with ranking
      searchQuery = searchQuery.textSearch('title,description', sanitizedQuery, {
        config: 'english'
      });
    } else {
      // Search only in title with full-text search
      searchQuery = searchQuery.textSearch('title', sanitizedQuery, {
        config: 'english'
      });
    }
  }

  // Apply category filter
  if (category) {
    searchQuery = searchQuery.eq('category_id', category);
  }

  // Apply status filter
  if (status) {
    searchQuery = searchQuery.eq('status', status);
  }

  // Apply proposer filter
  if (proposer) {
    searchQuery = searchQuery.eq('proposer_id', proposer);
  }

  // Apply vote count range
  if (min_votes !== undefined) {
    searchQuery = searchQuery.gte('vote_count', min_votes);
  }
  if (max_votes !== undefined) {
    searchQuery = searchQuery.lte('vote_count', max_votes);
  }

  // Apply date range filters
  if (date_from) {
    searchQuery = searchQuery.gte('created_at', date_from);
  }
  if (date_to) {
    searchQuery = searchQuery.lte('created_at', date_to);
  }

  // Execute the search
  const result = await withDatabaseErrorHandling(
    async () => {
      let finalQuery = searchQuery;

      // Apply sorting
      if (sort_by === 'trending') {
        // For trending, we'll sort by created_at first and calculate score client-side
        finalQuery = finalQuery.order('vote_count', { ascending: false })
                               .order('created_at', { ascending: false });
      } else if (sort_by === 'relevance' && q) {
        // For relevance with search query, prioritize title matches over description
        finalQuery = finalQuery.order('vote_count', { ascending: false })
                               .order('created_at', { ascending: false });
      } else {
        const ascending = sort_order === 'asc';
        finalQuery = finalQuery.order(sort_by, { ascending });
        
        // Add secondary sort for consistency
        if (sort_by !== 'created_at') {
          finalQuery = finalQuery.order('created_at', { ascending: false });
        }
      }

      // Apply pagination
      finalQuery = finalQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await finalQuery;
      
      if (error) throw error;
      
      return { problems: data || [], count: count || 0 };
    },
    'Errore nella ricerca dei problemi'
  );

  // Process results for highlighting and trending score
  let processedProblems = result.problems.map(problem => {
    let processedProblem = { ...problem };

    // Apply highlighting if requested and query exists
    if (highlight && q && q.length >= 2) {
      processedProblem.title = highlightText(problem.title, q);
      if (include_description && problem.description) {
        processedProblem.description = highlightText(problem.description, q);
      }
    }

    // Add trending score if sorting by trending
    if (sort_by === 'trending') {
      (processedProblem as any).trending_score = calculateTrendingScore(
        problem.vote_count,
        problem.created_at
      );
    }

    return processedProblem;
  });

  // Sort by trending score if applicable
  if (sort_by === 'trending') {
    processedProblems.sort((a, b) => {
      const scoreA = (a as any).trending_score || 0;
      const scoreB = (b as any).trending_score || 0;
      return sort_order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    });
  }

  // Calculate pagination metadata
  const totalPages = Math.ceil(result.count / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Track search analytics asynchronously (non-blocking)
  if (q || category || status) {
    trackSearchAnalytics({
      query: q,
      category,
      status,
      proposer,
      min_votes,
      max_votes,
      date_from,
      date_to,
      sort_by,
      sort_order,
      results_count: result.count,
      search_id,
      user_agent: request.headers.get('user-agent'),
      ip: request.ip,
    }).catch(error => {
      console.warn('Failed to track search analytics:', error);
    });
  }

  return apiResponse.success({
    problems: processedProblems,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: result.count,
      hasNextPage,
      hasPrevPage,
      limit,
    },
    search: {
      query: q,
      filters: {
        category,
        status,
        proposer,
        min_votes,
        max_votes,
        date_from,
        date_to,
      },
      sort: {
        by: sort_by,
        order: sort_order,
      },
      highlighting: highlight,
      search_id,
    }
  });
});

// Search analytics tracking function
async function trackSearchAnalytics(params: {
  query?: string;
  category?: string;
  status?: string;
  proposer?: string;
  min_votes?: number;
  max_votes?: number;
  date_from?: string;
  date_to?: string;
  sort_by: string;
  sort_order: string;
  results_count: number;
  search_id?: string;
  user_agent?: string | null;
  ip?: string;
}) {
  try {
    // Send analytics data to analytics API
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'search_problems',
        data: {
          ...params,
          timestamp: new Date().toISOString(),
        }
      })
    });
  } catch (error) {
    // Silent fail for analytics
    console.warn('Search analytics tracking failed:', error);
  }
}

// Search suggestions endpoint (could be a separate route, but included here for completeness)
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  try {
    // Get recent popular search terms and problem titles
    const { data: titles } = await supabase
      .from('problems')
      .select('title')
      .ilike('title', `%${query}%`)
      .order('vote_count', { ascending: false })
      .limit(limit);

    return titles?.map(item => item.title) || [];
  } catch (error) {
    console.warn('Failed to get search suggestions:', error);
    return [];
  }
}