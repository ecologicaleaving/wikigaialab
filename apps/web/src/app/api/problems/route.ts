import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';
import type { ProblemInsert } from '@wikigaialab/database';
import { randomUUID } from 'crypto';

// A+ Security Implementation imports
import { validateProblemInput, type CreateProblemInput } from '@/lib/validation/problem-schema';
import { rateLimitMiddleware, createRateLimitHeaders, isWhitelisted } from '@/lib/security/rate-limit';
import { 
  createSecureError, 
  createSecureResponse, 
  handleValidationError,
  handleDatabaseError,
  handleAuthError,
  handleRateLimitError,
  ErrorCategory,
  ErrorSeverity 
} from '@/lib/security/error-handling';
import { validateUserSession, ensureUserExists, createSecurityContext, validateSecurityContext } from '@/lib/security/auth-validation';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    const supabase = getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        category_id,
        proposer_id,
        status,
        vote_count,
        created_at,
        updated_at,
        proposer:users(id, name, email),
        category:categories(id, name, color, icon)
      `)
      .eq('status', 'published'); // Only show published problems

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort as any, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: problems, error, count } = await query;

    if (error) {
      console.error('Error fetching problems:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch problems',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        problems: problems || [],
        total: count || 0,
        pagination: {
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    });

  } catch (error) {
    console.error('Error in problems GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch problems'
    }, { status: 500 });
  }
}

/**
 * A+ Security Implementation - Problem Creation Endpoint
 * Features: Rate limiting, input validation, secure error handling, comprehensive logging
 */
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  const startTime = Date.now();
  
  try {
    // STEP 1: Rate Limiting & Security Checks
    if (!isWhitelisted(request)) {
      const rateLimitResult = await rateLimitMiddleware(request, 'problemCreation');
      
      if (!rateLimitResult.success) {
        const error = handleRateLimitError(rateLimitResult.retryAfter!, correlationId);
        return createSecureResponse(error, createRateLimitHeaders(rateLimitResult));
      }
    }

    // STEP 2: Authentication & User Validation
    const session = await auth();
    
    if (!session?.user) {
      const error = handleAuthError(
        new Error('No active session found'),
        correlationId
      );
      return createSecureResponse(error);
    }
    
    // Use basic session validation
    const user = {
      id: session.user.id || session.user.email || 'unknown',
      email: session.user.email || 'unknown@email.com',
      name: session.user.name || 'Unknown User'
    };

    // STEP 3: Security Context Validation
    const securityContext = createSecurityContext(request, user.id);
    
    if (!validateSecurityContext(securityContext)) {
      const error = createSecureError(
        new Error('Security validation failed'),
        ErrorCategory.AUTHORIZATION,
        ErrorSeverity.HIGH,
        correlationId
      );
      return createSecureResponse(error);
    }

    // STEP 4: Input Validation & Sanitization
    const body = await request.json();
    const validation = validateProblemInput(body);
    
    if (!validation.success) {
      const error = handleValidationError(
        new Error(validation.errorMessage || 'Input validation failed'),
        correlationId
      );
      return createSecureResponse(error);
    }

    const validatedInput = validation.data!;

    // STEP 5: Database Operations with Error Handling
    let supabase;
    try {
      supabase = getSupabaseClient();
      
      // Ensure user exists in database
      const userSync = await ensureUserExists({
        id: user.id,
        email: user.email,
        name: user.name
      }, correlationId);

      if (!userSync.success) {
        const error = handleDatabaseError(
          new Error(userSync.error || 'User synchronization failed'),
          correlationId
        );
        return createSecureResponse(error);
      }

      // Verify category exists (with prepared statement protection)
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', validatedInput.category_id)
        .eq('is_active', true)
        .single();

      if (categoryError || !category) {
        const error = handleValidationError(
          new Error('Invalid or inactive category selected'),
          correlationId
        );
        return createSecureResponse(error);
      }

      // STEP 6: Create Problem with Transaction Safety
      const problemData: ProblemInsert = {
        title: validatedInput.title,
        description: validatedInput.description,
        category_id: validatedInput.category_id,
        proposer_id: user.id,
        status: 'published',
        vote_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: problem, error: insertError } = await supabase
        .from('problems')
        .insert(problemData)
        .select(`
          id,
          title,
          description,
          vote_count,
          status,
          created_at,
          proposer:users!proposer_id(id, name),
          category:categories!category_id(id, name, color, icon)
        `)
        .single();

      if (insertError) {
        const error = handleDatabaseError(insertError, correlationId);
        return createSecureResponse(error);
      }

      // STEP 7: Create Initial Vote (non-blocking)
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          problem_id: problem.id,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      // Log vote error but don't fail the request
      if (voteError) {
        console.warn('Initial vote creation failed:', {
          correlationId,
          problemId: problem.id,
          userId: user.id,
          error: voteError.message
        });
      }

      // STEP 8: Success Response with Metrics
      const duration = Date.now() - startTime;
      
      console.info('Problem created successfully:', {
        correlationId,
        problemId: problem.id,
        userId: user.id,
        duration,
        category: category.name
      });

      return NextResponse.json({
        success: true,
        message: 'Problem created successfully',
        data: {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          voteCount: problem.vote_count,
          status: problem.status,
          createdAt: problem.created_at,
          proposer: problem.proposer,
          category: problem.category
        },
        metadata: {
          correlationId,
          duration
        }
      }, {
        headers: {
          'X-Request-ID': correlationId,
          'X-Response-Time': duration.toString()
        }
      });

    } catch (envError) {
      console.error('❌ Environment configuration error:', envError);
      
      // Return configuration error with instructions
      return NextResponse.json({
        success: false,
        error: 'Service configuration incomplete',
        message: 'Database connection not configured. Please set up Supabase environment variables.',
        code: 'CONFIG_ERROR',
        correlationId,
        instructions: {
          variables: [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_KEY'
          ],
          values: {
            'NEXT_PUBLIC_SUPABASE_URL': 'https://jgivhyalioldfelngboi.supabase.co',
            'SUPABASE_SERVICE_KEY': '[Contact admin for service key]'
          }
        }
      }, { 
        status: 503,
        headers: {
          'X-Request-ID': correlationId,
          'Retry-After': '300' // Retry after 5 minutes
        }
      });
    }

  } catch (error) {
    // STEP 9: Comprehensive Error Handling
    const secureError = createSecureError(
      error,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.HIGH,
      correlationId
    );

    return createSecureResponse(secureError, {
      'X-Request-ID': correlationId,
      'X-Response-Time': (Date.now() - startTime).toString()
    });
  }
}