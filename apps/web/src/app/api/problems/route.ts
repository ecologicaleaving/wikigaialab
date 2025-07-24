import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';
import type { ProblemInsert } from '@wikigaialab/database';
import { randomUUID } from 'crypto';

// Input validation import
import { validateProblemInput, type CreateProblemInput } from '@/lib/validation/problem-schema';

// Debug and monitoring imports
import { createApiTracker } from '@/lib/debug/api-tracker';
import { logger } from '@/lib/debug/logger';

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
    console.log('🔍 Problems GET endpoint called');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    console.log('🔍 Query params:', { page, limit, category_id, search, sort, order });

    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log('✅ Supabase client initialized');
    } catch (clientError) {
      console.error('❌ Supabase client error:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: clientError instanceof Error ? clientError.message : 'Unknown error'
      }, { status: 503 });
    }
    
    // Build query with explicit columns (no foreign keys for now)
    console.log('🔍 Building query without foreign key joins...');
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
        updated_at
      `)
      .in('status', ['Proposed', 'In Development', 'Completed'])
      .limit(limit);

    // Apply filters
    if (category_id) {
      console.log('🔍 Adding category filter:', category_id);
      query = query.eq('category_id', category_id);
    }

    if (search) {
      console.log('🔍 Adding search filter:', search);
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort as any, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('🔍 Executing query...');
    const { data: problems, error, count } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch problems',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('✅ Query successful:', { problemsCount: problems?.length || 0, totalCount: count });

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
 * Problem Creation Endpoint
 * Features: Authentication, input validation, database operations
 */
export async function POST(request: NextRequest) {
  // Initialize enhanced tracking
  const tracker = createApiTracker(request, 'POST /api/problems');
  
  try {
    
    // STEP 1: Enhanced Authentication Check
    const session = await logger.time('auth-check', async () => {
      return await auth();
    });
    
    if (!session?.user?.id) {
      const authError = new Error('Authentication required');
      tracker.trackError(authError, 401);
      
      return tracker.complete(NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in and try again.',
        correlationId: tracker.getCorrelationId()
      }, { status: 401 }));
    }
    
    const user = {
      id: session.user.id,
      email: session.user.email || 'unknown@email.com',
      name: session.user.name || 'Unknown User'
    };
    
    // Set user context for tracking
    tracker.setUser(user.id, {
      email: user.email,
      name: user.name,
      sessionId: session.id
    });

    // STEP 2: Enhanced Input Validation & Sanitization
    let body;
    try {
      body = await logger.time('request-parse', async () => {
        return await request.json();
      });
      
      // Track request body for debugging
      tracker.setRequestBody(body);
      
    } catch (error) {
      const parseError = new Error('Invalid JSON in request body');
      tracker.trackError(parseError, 400);
      
      return tracker.complete(NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        correlationId: tracker.getCorrelationId()
      }, { status: 400 }));
    }

    let validation;
    try {
      validation = await logger.time('input-validation', () => {
        return validateProblemInput(body);
      });
    } catch (error) {
      const validationError = new Error('Validation failed due to server error');
      tracker.trackError(validationError, 500);
      
      return tracker.complete(NextResponse.json({
        success: false,
        error: 'Validation failed due to server error',
        details: error instanceof Error ? error.message : 'Unknown validation error',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    if (!validation.success) {
      // Track validation errors for debugging
      tracker.addValidationError(validation.errorMessage);
      
      return tracker.complete(NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: validation.errorMessage,
        correlationId: tracker.getCorrelationId()
      }, { status: 400 }));
    }

    const validatedInput = validation.data!;

    // STEP 3: Database Operations
    console.log('🔍 Connecting to database...');
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log('✅ Supabase client created successfully');
    } catch (dbError) {
      console.log('❌ Failed to create Supabase client:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        correlationId
      }, { status: 500 });
    }

    // STEP 3.1: Ensure user exists in database (fix foreign key constraint)
    console.log('🔍 Ensuring user exists in database...');
    try {
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
        // User doesn't exist, try to create them
        console.log('🔍 User not found, creating new user...');
        
        // Use insert instead of upsert to avoid email conflicts
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          // If insert fails due to email conflict, try update instead
          if (insertError.code === '23505') {
            console.log('🔍 Email conflict, trying to update existing user...');
            const { error: updateError } = await supabase
              .from('users')
              .update({
                name: user.name,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (updateError) {
              console.log('❌ Failed to update user:', updateError);
              return NextResponse.json({
                success: false,
                error: 'Failed to synchronize user data',
                details: updateError.message,
                correlationId
              }, { status: 500 });
            }
          } else {
            console.log('❌ Failed to create user:', insertError);
            return NextResponse.json({
              success: false,
              error: 'Failed to create user',
              details: insertError.message,
              correlationId
            }, { status: 500 });
          }
        }
      } else if (checkError && checkError.code !== 'PGRST116') {
        console.log('❌ Error checking user existence:', checkError);
        return NextResponse.json({
          success: false,
          error: 'Failed to verify user existence',
          details: checkError.message,
          correlationId
        }, { status: 500 });
      } else {
        console.log('✅ User already exists in database');
      }

      console.log('✅ User synchronized with database');
    } catch (userSyncError) {
      console.log('❌ User synchronization failed:', userSyncError);
      return NextResponse.json({
        success: false,
        error: 'Failed to synchronize user with database',
        details: userSyncError instanceof Error ? userSyncError.message : 'Unknown sync error',
        correlationId
      }, { status: 500 });
    }
    
    // Verify category exists
    console.log('🔍 Verifying category exists...');
    let category, categoryError;
    try {
      const result = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', validatedInput.category_id)
        .single();
      category = result.data;
      categoryError = result.error;
      console.log('🔍 Category query result:', { category, categoryError });
    } catch (queryError) {
      console.log('❌ Category query failed:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify category',
        details: queryError instanceof Error ? queryError.message : 'Unknown query error',
        correlationId
      }, { status: 500 });
    }

    if (categoryError || !category) {
      console.log('❌ Category validation failed:', categoryError?.message);
      return NextResponse.json({
        success: false,
        error: 'Invalid category selected',
        correlationId
      }, { status: 400 });
    }
    
    console.log('✅ Category verified:', category.name);

    // STEP 4: Create Problem
    console.log('🔍 Creating problem...');
    const problemData = {
      title: validatedInput.title,
      description: validatedInput.description,
      category_id: validatedInput.category_id,
      proposer_id: user.id,
      status: 'Proposed', // Match status from screenshot
      vote_count: 0, // Start with 0 votes - users can't vote on their own problems
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Problem data to insert:', problemData);

    let problem, insertError;
    try {
      const result = await supabase
        .from('problems')
        .insert(problemData)
        .select('*')
        .single();
      problem = result.data;
      insertError = result.error;
      console.log('🔍 Insert result:', { problem: !!problem, insertError });
    } catch (insertException) {
      console.log('❌ Problem insert failed with exception:', insertException);
      return NextResponse.json({
        success: false,
        error: 'Failed to create problem due to database error',
        details: insertException instanceof Error ? insertException.message : 'Unknown insert error',
        correlationId
      }, { status: 500 });
    }

    if (insertError) {
      console.log('❌ Problem creation failed:', insertError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to create problem',
        details: insertError.message,
        correlationId
      }, { status: 500 });
    }

    console.log('✅ Problem created successfully:', problem.id);

    // STEP 5: Success Response
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Problem created successfully',
      data: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        vote_count: problem.vote_count,
        status: problem.status,
        created_at: problem.created_at
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

  } catch (error) {
    console.error('❌ POST endpoint unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      correlationId
    });
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      correlationId
    }, { status: 500 });
  }
}