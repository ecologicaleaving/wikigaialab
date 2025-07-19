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
  requireAuth,
  commonSchemas 
} from '../../../lib/api-middleware';
import { 
  problemCreationRateLimit, 
  apiRateLimit,
  withRateLimitAnalytics 
} from '../../../lib/rate-limiter';

// Request validation schemas
const createProblemSchema = z.object({
  method: z.literal('POST'),
  body: z.object({
    title: z.string().min(5, 'Il titolo deve essere di almeno 5 caratteri').max(100, 'Il titolo non può superare i 100 caratteri'),
    description: z.string().min(10, 'La descrizione deve essere di almeno 10 caratteri').max(1000, 'La descrizione non può superare i 1000 caratteri'),
    category_id: z.string().uuid('ID categoria non valido'),
  }),
});

const getProblemSchema = z.object({
  method: z.literal('GET'),
  query: z.object({
    page: z.string().optional().transform(val => Math.max(1, parseInt(val || '1'))),
    limit: z.string().optional().transform(val => Math.min(100, Math.max(1, parseInt(val || '10')))),
    category: z.string().uuid().optional(),
    status: z.enum(['Proposed', 'In Development', 'Completed', 'Rejected']).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['created_at', 'vote_count', 'title']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// POST handler with comprehensive error handling and rate limiting
export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Apply rate limiting
  await withRateLimitAnalytics(problemCreationRateLimit, 'problem_creation')(request);
  
  // Validate request structure
  const validateReq = validateRequest(createProblemSchema);
  const { body } = await validateReq(request);
  const { title, description, category_id } = body;

  // Get authenticated user - try Authorization header first, then cookies
  const authHeader = request.headers.get('authorization');
  let supabase: any;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
  } else {
    // Fallback to cookies
    const cookieStore = cookies();
    supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw apiErrors.authenticationError();
  }

  // Verify category exists and is active
  const category = await withDatabaseErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, is_active')
        .eq('id', category_id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    'Errore nella verifica della categoria'
  );

  if (!category) {
    throw apiErrors.validationError('Categoria non valida o non attiva');
  }

  // Check if user exists in our users table
  const dbUser = await withDatabaseErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, total_problems_proposed')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    'Errore nella verifica dell\'utente'
  );

  if (!dbUser) {
    throw apiErrors.validationError('Utente non trovato nel database');
  }

  // Create the problem with database transaction
  const result = await withDatabaseErrorHandling(
    async () => {
      // Insert problem
      const { data: problem, error: problemError } = await supabase
        .from('problems')
        .insert({
          proposer_id: user.id,
          title,
          description,
          category_id,
          status: 'Proposed' as const,
          vote_count: 0, // Will be set to 1 by auto-vote trigger
        })
        .select('id, title, vote_count, created_at')
        .single();

      if (problemError) throw problemError;

      // Update user stats (non-blocking)
      supabase
        .from('users')
        .update({ 
          total_problems_proposed: (dbUser.total_problems_proposed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.warn('Failed to update user stats:', error);
          }
        });

      return problem;
    },
    'Errore nella creazione del problema'
  );

  return apiResponse.created({
    id: result.id,
    title: result.title,
    vote_count: result.vote_count,
    created_at: result.created_at,
  });
});

// GET handler with comprehensive error handling and rate limiting
export const GET = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  // Apply rate limiting
  await withRateLimitAnalytics(apiRateLimit, 'problems_get')(request);
  
  // Validate request structure
  const validateReq = validateRequest(getProblemSchema);
  const { query } = await validateReq(request);
  const { page, limit, category, status, search, sortBy, sortOrder } = query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get Supabase client
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  // Fetch problems with comprehensive error handling
  const result = await withDatabaseErrorHandling(
    async () => {
      // Build query
      let query = supabase
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
        `, { count: 'exact' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (category) {
        query = query.eq('category_id', category);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        // Sanitize search term to prevent injection
        const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
        query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });
      
      // Add secondary sort for consistency
      if (sortBy !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { problems: data || [], count: count || 0 };
    },
    'Errore nel caricamento dei problemi'
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(result.count / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return apiResponse.success({
    problems: result.problems,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: result.count,
      hasNextPage,
      hasPrevPage,
      limit,
    }
  });
});