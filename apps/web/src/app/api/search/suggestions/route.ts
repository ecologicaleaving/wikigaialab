import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@wikigaialab/database';
import { 
  withApiHandler, 
  apiResponse, 
  validateRequest,
  withDatabaseErrorHandling,
} from '../../../../lib/api-middleware';
import { 
  apiRateLimit,
  withRateLimitAnalytics 
} from '../../../../lib/rate-limiter';

// Search suggestions request validation schema
const suggestionsSchema = z.object({
  method: z.literal('GET'),
  query: z.object({
    q: z.string().min(1).max(50),
    limit: z.string().optional().transform(val => Math.min(10, Math.max(1, parseInt(val || '5')))),
    type: z.enum(['titles', 'categories', 'mixed']).default('mixed'),
  }),
});

interface Suggestion {
  text: string;
  type: 'title' | 'category' | 'proposer';
  count?: number;
  id?: string;
}

// GET handler for search suggestions
export const GET = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Apply rate limiting (more lenient for suggestions)
  await withRateLimitAnalytics(apiRateLimit, 'search_suggestions')(request);
  
  // Validate request structure
  const validateReq = validateRequest(suggestionsSchema);
  const { query } = await validateReq(request);
  const { q, limit, type } = query;

  // Get Supabase client
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const suggestions: Suggestion[] = [];
  const sanitizedQuery = q.replace(/[%_]/g, '\\$&');

  const result = await withDatabaseErrorHandling(
    async () => {
      const promises = [];

      // Get problem title suggestions
      if (type === 'titles' || type === 'mixed') {
        promises.push(
          supabase
            .from('problems')
            .select('title, vote_count')
            .ilike('title', `%${sanitizedQuery}%`)
            .order('vote_count', { ascending: false })
            .limit(type === 'titles' ? limit : Math.ceil(limit * 0.6))
            .then(({ data, error }) => {
              if (error) throw error;
              return data?.map(item => ({
                text: item.title,
                type: 'title' as const,
                count: item.vote_count,
              })) || [];
            })
        );
      }

      // Get category suggestions
      if (type === 'categories' || type === 'mixed') {
        promises.push(
          supabase
            .from('categories')
            .select(`
              id,
              name,
              problems!category_id(count)
            `)
            .ilike('name', `%${sanitizedQuery}%`)
            .eq('is_active', true)
            .limit(type === 'categories' ? limit : Math.ceil(limit * 0.3))
            .then(({ data, error }) => {
              if (error) throw error;
              return data?.map(item => ({
                text: item.name,
                type: 'category' as const,
                id: item.id,
                count: Array.isArray(item.problems) ? item.problems.length : 0,
              })) || [];
            })
        );
      }

      // Get proposer suggestions (for mixed type only)
      if (type === 'mixed') {
        promises.push(
          supabase
            .from('users')
            .select(`
              id,
              name,
              problems!proposer_id(count)
            `)
            .ilike('name', `%${sanitizedQuery}%`)
            .limit(Math.ceil(limit * 0.2))
            .then(({ data, error }) => {
              if (error) throw error;
              return data?.map(item => ({
                text: item.name || 'Utente Anonimo',
                type: 'proposer' as const,
                id: item.id,
                count: Array.isArray(item.problems) ? item.problems.length : 0,
              })) || [];
            })
        );
      }

      const results = await Promise.all(promises);
      return results.flat();
    },
    'Errore nel caricamento dei suggerimenti'
  );

  // Combine and sort suggestions
  suggestions.push(...result);

  // Sort by relevance (exact matches first, then by count)
  suggestions.sort((a, b) => {
    // Exact matches first
    const aExact = a.text.toLowerCase() === q.toLowerCase();
    const bExact = b.text.toLowerCase() === q.toLowerCase();
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Then by starts with
    const aStarts = a.text.toLowerCase().startsWith(q.toLowerCase());
    const bStarts = b.text.toLowerCase().startsWith(q.toLowerCase());
    
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Finally by count
    return (b.count || 0) - (a.count || 0);
  });

  // Limit results
  const limitedSuggestions = suggestions.slice(0, limit);

  // Remove duplicates based on text
  const uniqueSuggestions = limitedSuggestions.filter(
    (suggestion, index, self) => 
      index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
  );

  // Track suggestion analytics (non-blocking)
  trackSuggestionAnalytics({
    query: q,
    type,
    results_count: uniqueSuggestions.length,
    user_agent: request.headers.get('user-agent'),
  }).catch(error => {
    console.warn('Failed to track suggestion analytics:', error);
  });

  return apiResponse.success({
    suggestions: uniqueSuggestions,
    query: q,
    type,
    total: uniqueSuggestions.length,
  });
});

// Suggestion analytics tracking function
async function trackSuggestionAnalytics(params: {
  query: string;
  type: string;
  results_count: number;
  user_agent?: string | null;
}) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'search_suggestions',
        data: {
          ...params,
          timestamp: new Date().toISOString(),
        }
      })
    });
  } catch (error) {
    // Silent fail for analytics
    console.warn('Suggestion analytics tracking failed:', error);
  }
}